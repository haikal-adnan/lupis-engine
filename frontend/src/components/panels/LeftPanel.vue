<script setup>
import { ref, onMounted, watch } from 'vue';
import { useBackend } from '@/composables/useBackend.js';
import { useEditorState } from '@/composables/useEditorState.js'; // Import composable state
import SceneTree from './SceneGraph/SceneTree.vue';
import FileTree from './FileExplorer/FileTree.vue';

const props = defineProps({
  collapsed: Boolean
});

const emit = defineEmits(['toggle']);

// --- EDITOR STATE ---
// Ambil activeProjectId (ref)
const { activeProjectId } = useEditorState();

// --- BACKEND INTEGRATION ---
const { 
  folders, 
  assets, 
  scenes, 
  prefabs, 
  currentScene, 
  fetchAllProjectResources, 
  fetchScene,
  loading 
} = useBackend();

// --- UI STATE ---
const activeTab = ref('hierarchy'); // 'hierarchy' atau 'files'
const selectedNodeId = ref(null);
const prefabsHeight = ref(220);
const isResizingPrefabs = ref(false);
const containerRef = ref(null);

// --- INITIALIZATION ---

// Fungsi helper untuk memuat data project
const loadProjectData = async () => {
  // Cek apakah ada ID aktif
  if (!activeProjectId.value) {
    console.warn("No active project ID found.");
    return;
  }

  // Gunakan ID dinamis dari state
  await fetchAllProjectResources(activeProjectId.value);
  
  // Auto-load scene pertama jika ada resources dan belum ada scene aktif
  if (scenes.value.length > 0 && !currentScene.value) {
    await fetchScene(scenes.value[0]._id);
  }
};

// Jalankan saat komponen di-mount
onMounted(async () => {
  await loadProjectData();
});

// Watcher: Jika activeProjectId berubah (misal ganti project), muat ulang data
watch(activeProjectId, async (newId) => {
  if (newId) {
    console.log("Project ID changed to:", newId);
    // Reset selection jika perlu
    selectedNodeId.value = null; 
    await loadProjectData();
  }
});

// --- RESIZE LOGIC (PREFABS) ---
const startResizePrefabs = () => {
  isResizingPrefabs.value = true;
  document.addEventListener('mousemove', handleResizePrefabs);
  document.addEventListener('mouseup', stopResizePrefabs);
  document.body.style.cursor = 'row-resize';
};

const handleResizePrefabs = (e) => {
  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  const newHeight = rect.bottom - e.clientY;
  if (newHeight >= 40 && newHeight <= 500) {
    prefabsHeight.value = newHeight;
  }
};

const stopResizePrefabs = () => {
  isResizingPrefabs.value = false;
  document.removeEventListener('mousemove', handleResizePrefabs);
  document.removeEventListener('mouseup', stopResizePrefabs);
  document.body.style.cursor = '';
};
</script>

<template>
  <div 
    ref="containerRef"
    class="h-full flex flex-col bg-panel overflow-hidden border-r border-border select-none"
  >
    <div class="h-10 shrink-0 flex items-center justify-between px-3 border-b border-border bg-muted/20">
      <h3 v-if="!collapsed" class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {{ activeTab === 'hierarchy' ? 'Scene Graph' : 'Project Files' }}
      </h3>
      <button 
        @click="$emit('toggle')" 
        class="p-1.5 rounded-md hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground"
      >
        <svg v-if="!collapsed" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M9 3v18"/></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3z"/><path d="M9 3v18"/><path d="m15 9-3 3 3 3"/></svg>
      </button>
    </div>

    <div v-if="!collapsed" class="flex-1 flex flex-col min-h-0">
      
      <div class="flex border-b border-border bg-muted/10">
        <button 
          @click="activeTab = 'hierarchy'"
          class="flex-1 py-2 text-[9px] font-bold uppercase tracking-tighter transition-all border-b-2"
          :class="activeTab === 'hierarchy' ? 'border-primary text-foreground bg-background' : 'border-transparent text-muted-foreground'"
        >
          Hierarchy
        </button>
        <button 
          @click="activeTab = 'files'"
          class="flex-1 py-2 text-[9px] font-bold uppercase tracking-tighter transition-all border-b-2"
          :class="activeTab === 'files' ? 'border-primary text-foreground bg-background' : 'border-transparent text-muted-foreground'"
        >
          Resources
        </button>
      </div>

      <div v-if="activeTab === 'hierarchy' && scenes.length > 0" class="p-2 border-b border-border bg-muted/5">
        <select 
          :value="currentScene?._id"
          @change="fetchScene($event.target.value)"
          class="w-full bg-background border border-border rounded px-2 py-1 text-[11px] outline-none focus:ring-1 ring-primary/30"
        >
          <option v-for="s in scenes" :key="s._id" :value="s._id">🎬 {{ s.name }}</option>
        </select>
      </div>

      <div class="flex-1 overflow-y-auto scrollbar-thin relative">
        <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <span class="text-[10px] animate-pulse">Loading...</span>
        </div>

        <SceneTree 
          v-if="activeTab === 'hierarchy'" 
          :data="currentScene?.entities" 
          :selectedId="selectedNodeId"
          @select="selectedNodeId = $event"
        />
        <FileTree 
          v-else 
          :folders="folders" 
          :assets="assets" 
        />
      </div>

      <div 
        @mousedown.prevent="startResizePrefabs"
        class="h-1 bg-border hover:bg-primary/50 cursor-row-resize transition-colors"
      ></div>

      <div 
        class="bg-panel flex flex-col overflow-hidden shrink-0" 
        :style="{ height: `${prefabsHeight}px` }"
      >
        <div class="px-3 py-1.5 bg-muted/20 text-[9px] font-bold uppercase text-muted-foreground flex justify-between border-b border-border">
          <span>Prefabs</span>
          <button class="hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-2 scrollbar-thin">
          <div v-if="prefabs.length > 0" class="grid grid-cols-3 gap-2">
            <div 
              v-for="prefab in prefabs" :key="prefab._id"
              class="aspect-square bg-muted/30 rounded border border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-grab group"
            >
              <span class="text-lg group-hover:scale-110 transition-transform">📦</span>
              <span class="text-[8px] mt-1 truncate w-full text-center px-1 opacity-70">{{ prefab.name }}</span>
            </div>
          </div>
          <div v-else class="h-full flex flex-col items-center justify-center opacity-30">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
            <span class="text-[8px] mt-2 uppercase tracking-widest">No Prefabs</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex-1 flex flex-col items-center py-4 gap-6">
      <div class="flex flex-col gap-4">
        <button @click="activeTab = 'hierarchy'; $emit('toggle')" class="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground" title="Hierarchy">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
        </button>
        <button @click="activeTab = 'files'; $emit('toggle')" class="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground" title="Resources">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
        </button>
      </div>
      
      <div class="flex-1 flex items-center justify-center">
        <div class="writing-vertical text-[10px] text-muted-foreground uppercase tracking-[0.3em] opacity-40 font-bold">
          Inspector Hierarchy
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.writing-vertical {
  writing-mode: vertical-lr;
  text-orientation: mixed;
  transform: rotate(180deg);
}
</style>