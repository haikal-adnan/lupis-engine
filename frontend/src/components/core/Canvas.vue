<script setup>
import { onMounted, onUnmounted, nextTick, ref, toRaw } from "vue";
import { startEngine } from "@engine/main.js"; 
import { useEditorState } from "@/composables/useEditorState.js";
import { useBackend } from "@/composables/useBackend.js";
import { useLocalDB } from "@/composables/useLocalDB.js";
import { useSyncManager } from "@/composables/useSyncManager.js";
import { hasPendingCloudSync } from "@/services/sceneService.js";
import { useSelection } from "@/composables/useSelection.js";

const { initSelectionListener } = useSelection();
const { activeProjectId } = useEditorState();
const { initDB, hydrateFromBackend, getSceneFromLocal } = useLocalDB();
const { registerChange, setInitialSyncStatus } = useSyncManager();

const { 
  CDN_URL, 
  projectData, 
  assets, 
  scenes,
  prefabs, 
  currentScene, 
  fetchProjectDetails, 
  fetchAllProjectResources, 
  fetchScene
} = useBackend();

const isEngineReady = ref(false);
let engineBus = null;
let engineInstance = null; 

const handleEntityModified = (updates) => {
  if (Array.isArray(updates)) {
    updates.forEach(u => registerChange(u));
  } else {
    registerChange(updates);
  }
};

onMounted(async () => {
  await nextTick();
  const dbReady = await initDB();
  if (!dbReady || !activeProjectId.value) return;

  await Promise.all([
    fetchProjectDetails(activeProjectId.value),
    fetchAllProjectResources(activeProjectId.value)
  ]);

  if (!projectData.value) return;

  const targetSceneId = currentScene.value?._id || scenes.value[0]?._id;
  if (!targetSceneId) return;

  const localSceneData = await getSceneFromLocal(targetSceneId);

  if (localSceneData) {
      currentScene.value = localSceneData;
      const isPending = await hasPendingCloudSync(targetSceneId);
      setInitialSyncStatus(isPending);
  } else {
      await fetchScene(targetSceneId);
      
      const serverPayload = {
        project: toRaw(projectData.value),
        assets: toRaw(assets.value),
        scenes: [toRaw(currentScene.value)],
        prefabs: toRaw(prefabs.value) 
      };
      
      await hydrateFromBackend(serverPayload);
      setInitialSyncStatus(false);
  }

  const enginePayload = {
    project: toRaw(projectData.value), 
    assets: toRaw(assets.value),        
    scene: toRaw(currentScene.value),
    prefabs: toRaw(prefabs.value) 
  };

  console.log(enginePayload)

  engineInstance = await startEngine("glCanvas", "editor", `${CDN_URL}/projects/${activeProjectId.value}/`, enginePayload);
  
  if (engineInstance) {
      engineBus = engineInstance.bus;
      engineBus.on("entity:modified", handleEntityModified);
      initSelectionListener(engineBus);
      isEngineReady.value = true;
  }
});

onUnmounted(() => {
  if (engineBus) {
    engineBus.off("entity:modified", handleEntityModified);
  }
  if (engineInstance) {
    engineInstance.destroy();
  }
});
</script>

<template>
  <div class="w-full h-full relative overflow-hidden flex flex-col bg-slate-900 select-none">
    <div v-if="!isEngineReady" class="absolute inset-0 z-50 flex items-center justify-center bg-slate-950 text-white">
      <div class="flex flex-col items-center gap-3">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-sm text-slate-400 font-mono animate-pulse">Initializing Engine Context...</p>
      </div>
    </div>

    <canvas id="glCanvas" class="absolute inset-0 w-full h-full block outline-none"></canvas>
  </div>
</template>