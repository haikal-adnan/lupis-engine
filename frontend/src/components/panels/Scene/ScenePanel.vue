<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useBackend } from '@/composables/useBackend.js';
import { useEditorState } from '@/composables/useEditorState.js';
import { bus } from '@engine/Util/EventBus.js';
import SceneTree from '@/components/panels/Scene/parts/SceneTree.vue';

// --- EDITOR STATE ---
const { activeProjectId } = useEditorState();

// --- BACKEND ---
const { 
  scenes, currentScene, 
  fetchAllProjectResources, fetchScene, loading 
} = useBackend();

// --- SELECTION STATE ---
const selectedIds = ref([]);

// --- HANDLERS ---
const handleTreeSelect = (idsToSelect) => {
   bus.emit("ui:select-by-id", idsToSelect);
};

// Handle Selection Entity Scene
const onGlobalSelected = (list) => {
  if (!list || list.length === 0) {
    selectedIds.value = [];
    return;
  }
  selectedIds.value = list.map(e => e._id || e.id);
};

// Handle Deselect Scene
const onGlobalDeselected = () => {
  selectedIds.value = [];
};

// [BARU] Handle Selection Prefab (Hapus highlight di tree)
const onPrefabSelected = () => {
  selectedIds.value = [];
};

// --- LIFECYCLE ---
const loadProjectData = async () => {
  if (!activeProjectId.value) return;
  await fetchAllProjectResources(activeProjectId.value);
  if (scenes.value.length > 0 && !currentScene.value) {
    await fetchScene(scenes.value[0]._id);
  }
};

onMounted(async () => {
  await loadProjectData();
  
  // Register Listeners
  bus.on("entity:selected", onGlobalSelected);
  bus.on("entity:deselected", onGlobalDeselected);
  // [BARU]
  bus.on("prefab:selected", onPrefabSelected);
});

onUnmounted(() => {
  bus.off("entity:selected", onGlobalSelected);
  bus.off("entity:deselected", onGlobalDeselected);
  // [BARU] Cleanup
  bus.off("prefab:selected", onPrefabSelected);
});

watch(activeProjectId, async (newId) => {
  if (newId) {
    selectedIds.value = [];
    await loadProjectData();
  }
});
</script>

<template>
  <div class="flex flex-col h-full">
    <div v-if="scenes.length > 0" class="p-2 border-b border-border bg-muted/10 shrink-0">
      <select 
        :value="currentScene?._id" 
        @change="fetchScene($event.target.value)" 
        class="w-full bg-background border border-border rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/50 transition-shadow"
      >
        <option v-for="s in scenes" :key="s._id" :value="s._id">
          🎬 {{ s.name }}
        </option>
      </select>
    </div>

    <div class="flex-1 overflow-y-auto scrollbar-thin relative p-1">
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-background/50 z-10 backdrop-blur-[1px]">
        <div class="flex flex-col items-center gap-2">
          <svg class="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-[10px] text-muted-foreground font-medium">Loading Scene...</span>
        </div>
      </div>

      <SceneTree 
        v-if="currentScene?.entities" 
        :data="currentScene.entities" 
        :selectedIds="selectedIds"
        @select="handleTreeSelect"
      />
      
      <div v-else-if="!loading" class="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
        <span class="text-xs">No Scene Loaded</span>
      </div>
    </div>
  </div>
</template>