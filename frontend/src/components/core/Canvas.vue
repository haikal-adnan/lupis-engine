<script setup>
import { onMounted, nextTick, ref } from "vue";
import { startEngine } from "@engine/main.js"; 
import { useEditorState } from "@/composables/useEditorState.js";
import { useBackend } from "@/composables/useBackend.js";

const { activeProjectId } = useEditorState();
const { 
  CDN_URL, 
  projectData, 
  assets, 
  scenes, 
  currentScene, 
  fetchProjectDetails, 
  fetchAllProjectResources, 
  fetchScene 
} = useBackend();

const isEngineReady = ref(false);

onMounted(async () => {
  await nextTick();

  if (!activeProjectId.value) return;

  await Promise.all([
    fetchProjectDetails(activeProjectId.value),
    fetchAllProjectResources(activeProjectId.value)
  ]);

  if (!currentScene.value && scenes.value.length > 0) {
    await fetchScene(scenes.value[0]._id);
  }

  if (!projectData.value || !currentScene.value) {
    console.error("❌ Data Project tidak lengkap.");
    return;
  }

  const projectBaseUrl = `${CDN_URL}/projects/${activeProjectId.value}/`;

  const rawPayload = {
    project: projectData.value, 
    assets: assets.value,        
    scene: currentScene.value 
  };

  console.log("📦 Sending Raw Data to Engine...");

  await startEngine("glCanvas", "editor", projectBaseUrl, rawPayload);
  
  isEngineReady.value = true;
});
</script>

<template>
  <div class="w-full h-full relative overflow-hidden flex flex-col bg-slate-900">
    <div v-if="!isEngineReady" class="absolute inset-0 z-50 flex items-center justify-center bg-slate-900 text-white">
      <div class="flex flex-col items-center gap-2">
        <span class="loading loading-spinner loading-lg"></span>
        <p>Memuat Engine & Aset...</p>
      </div>
    </div>

    <div class="relative flex-1 overflow-hidden shadow-inner">
      <canvas id="glCanvas" class="absolute inset-0 w-full h-full block"></canvas>
    </div>
  </div>
</template>