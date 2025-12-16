<script setup>
import { ref } from 'vue';
import SceneTree from '../panels/SceneGraph/SceneTree.vue';

defineProps({
  collapsed: Boolean
});

const emit = defineEmits(['toggle']);

// --- STATE: VISIBILITY ---
const showPages = ref(true);
const showLayers = ref(true);
const showPrefabs = ref(true);

// --- STATE: RESIZING ---
const containerRef = ref(null);
const pagesHeight = ref(140);   // Default Pixel
const prefabsHeight = ref(200); // Default Pixel

const isResizingPages = ref(false);
const isResizingPrefabs = ref(false);

// --- RESIZE LOGIC: PAGES (TOP) ---
const startResizePages = () => {
  isResizingPages.value = true;
  document.addEventListener('mousemove', handleResizePages);
  document.addEventListener('mouseup', stopResizePages);
  document.body.style.cursor = 'row-resize';
  document.body.style.userSelect = 'none';
};

const handleResizePages = (e) => {
  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  
  // Jarak mouse dari atas container dikurangi tinggi header (40px)
  const newHeight = e.clientY - rect.top - 40;
  
  // Batas Min 40px, Max 400px
  if (newHeight >= 40 && newHeight <= 400) {
    pagesHeight.value = newHeight;
  }
};

const stopResizePages = () => {
  isResizingPages.value = false;
  document.removeEventListener('mousemove', handleResizePages);
  document.removeEventListener('mouseup', stopResizePages);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
};

// --- RESIZE LOGIC: PREFABS (BOTTOM) ---
const startResizePrefabs = () => {
  isResizingPrefabs.value = true;
  document.addEventListener('mousemove', handleResizePrefabs);
  document.addEventListener('mouseup', stopResizePrefabs);
  document.body.style.cursor = 'row-resize';
  document.body.style.userSelect = 'none';
};

const handleResizePrefabs = (e) => {
  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  
  // Logic: Jarak dari Bawah Layar ke Mouse
  // (Bottom Container) - (Posisi Mouse Y)
  const newHeight = rect.bottom - e.clientY;

  // Batas Min 40px, Max 500px
  if (newHeight >= 40 && newHeight <= 500) {
    prefabsHeight.value = newHeight;
  }
};

const stopResizePrefabs = () => {
  isResizingPrefabs.value = false;
  document.removeEventListener('mousemove', handleResizePrefabs);
  document.removeEventListener('mouseup', stopResizePrefabs);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
};

// --- DUMMY DATA ---
const pages = ref([
  { id: 'p1', name: 'Level 1', active: true },
  { id: 'p2', name: 'Level 2', active: false },
]);

const sceneData = ref([
  {
    id: 'root', name: "Main_Scene", type: "scene",
    children: [
      { id: '1', name: "Managers", type: "folder", children: [{ id: 'c1', name: "Main_Camera", type: "camera" }] },
      { id: '2', name: "Environment", type: "folder", children: [{ id: 't1', name: "Tilemap", type: "grid" }] },
      { id: '3', name: "Player", type: "character", children: [{ id: 's1', name: "Sprite", type: "sprite" }] }
    ]
  }
]);

const selectedNodeId = ref(null);

const handlePageSelect = (page) => {
    pages.value.forEach(p => p.active = false);
    page.active = true;
}
</script>

<template>
  <div 
    ref="containerRef"
    class="
      h-full flex flex-col 
      bg-editor-sidebar 
      overflow-hidden 
      border-r border-border
    "
  >
    <div 
      v-if="!collapsed" 
      class="
        h-10 shrink-0 
        flex items-center justify-between 
        px-2 
        border-b border-border 
        bg-muted/40 
        backdrop-blur-sm
      "
    >
      <h3 class="pl-1 text-sm font-bold uppercase tracking-wide text-foreground/90">
        Hierarchy
      </h3>
      <button 
        @click="$emit('toggle')" 
        class="
          p-1.5 rounded-md 
          text-muted-foreground 
          hover:text-foreground 
          hover:bg-accent/40 
          transition-colors
        " 
        title="Collapse"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M9 3v18"/></svg>
      </button>
    </div>

    <div 
      v-else 
      class="
        h-10 shrink-0 
        flex items-center justify-center 
        border-b border-border 
        bg-muted/40
      "
    >
      <button 
        @click="$emit('toggle')" 
        class="p-1.5 rounded-md text-foreground hover:bg-accent/40 transition-colors" 
        title="Expand"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3z"/><path d="M9 3v18"/><path d="m15 9-3 3 3 3"/></svg>
      </button>
    </div>

    <div v-if="!collapsed" class="flex flex-col flex-1 min-w-[16rem] overflow-hidden select-none">
        
        <div 
            class="flex flex-col border-b border-border bg-editor-sidebar shrink-0 overflow-hidden"
            :class="{ 'transition-height duration-300 ease-in-out': !isResizingPages }"
            :style="{ height: showPages ? `${pagesHeight}px` : 'auto' }"
        >
            <div 
                @click="showPages = !showPages"
                class="px-2 py-2 bg-muted/10 shrink-0 flex items-center gap-1 cursor-pointer hover:bg-accent/20 transition-colors group"
            >
                <svg 
                    xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="text-muted-foreground transition-transform duration-200"
                    :class="showPages ? 'rotate-0' : '-rotate-90'"
                >
                    <path d="m6 9 6 6 6-6"/>
                </svg>
                <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-foreground">Pages</span>
            </div>
            
            <div v-show="showPages" class="flex-1 overflow-y-auto scrollbar-thin pb-1">
                <div v-for="page in pages" :key="page.id" 
                     @click="handlePageSelect(page)"
                     class="flex items-center justify-between px-3 py-1.5 cursor-pointer text-xs hover:bg-accent/30 group transition-colors"
                     :class="page.active ? 'bg-accent/20 text-foreground border-l-2 border-primary pl-[10px]' : 'text-muted-foreground pl-3'">
                     <span class="font-medium">{{ page.name }}</span>
                     <span v-if="page.active" class="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                </div>
            </div>
        </div>

        <div 
            v-if="showPages"
            @mousedown.prevent="startResizePages"
            class="h-[1px] bg-border hover:bg-primary cursor-row-resize shrink-0 z-10 w-full flex justify-center items-center group relative"
        >
            <div class="absolute inset-x-0 -top-1 bottom-1 bg-transparent"></div> 
        </div>

        <div class="flex-1 flex flex-col min-h-0 bg-editor-sidebar overflow-hidden">
             <div 
                @click="showLayers = !showLayers"
                class="px-2 py-2 bg-muted/10 shrink-0 flex justify-between items-center border-b border-border cursor-pointer hover:bg-accent/20 transition-colors group"
            >
                <div class="flex items-center gap-1">
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="text-muted-foreground transition-transform duration-200"
                        :class="showLayers ? 'rotate-0' : '-rotate-90'"
                    >
                        <path d="m6 9 6 6 6-6"/>
                    </svg>
                    <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-foreground">Scene Graph</span>
                </div>
                <button @click.stop class="hover:text-foreground text-muted-foreground transition-colors p-0.5 rounded hover:bg-accent/40">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
            </div>
            
            <div v-show="showLayers" class="flex-1 overflow-y-auto scrollbar-thin p-1">
                <SceneTree 
                    :data="sceneData" 
                    :selectedId="selectedNodeId"
                    @select="selectedNodeId = $event" 
                />
            </div>
            <div v-if="!showLayers" class="flex-1 bg-editor-sidebar"></div>
        </div>

        <div 
            v-if="showPrefabs"
            @mousedown.prevent="startResizePrefabs"
            class="h-[1px] bg-border hover:bg-primary cursor-row-resize shrink-0 z-10 w-full flex justify-center items-center group relative"
        >
            <div class="absolute inset-x-0 -top-1 bottom-1 bg-transparent"></div>
        </div>

        <div 
            class="bg-editor-sidebar flex flex-col shrink-0 overflow-hidden"
            :class="{ 'transition-height duration-300 ease-in-out': !isResizingPrefabs }"
            :style="{ height: showPrefabs ? `${prefabsHeight}px` : 'auto' }"
        >
            <div 
                @click="showPrefabs = !showPrefabs"
                class="px-2 py-2 bg-muted/10 flex justify-between items-center shrink-0 cursor-pointer hover:bg-accent/20 transition-colors group border-t border-b border-border"
            >
                <div class="flex items-center gap-1">
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="text-muted-foreground transition-transform duration-200"
                        :class="showPrefabs ? 'rotate-0' : '-rotate-90'"
                    >
                        <path d="m6 9 6 6 6-6"/>
                    </svg>
                    <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-foreground">Prefabs</span>
                </div>
            </div>

            <div v-show="showPrefabs" class="p-2 grid grid-cols-3 gap-2 overflow-y-auto scrollbar-thin h-full bg-editor-sidebar">
                <div v-for="i in 6" :key="i" class="aspect-square bg-muted/30 rounded border border-transparent hover:border-primary/50 hover:bg-accent/20 cursor-grab flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-all">
                    <span class="text-xl mb-1">📦</span>
                    <span class="text-[9px]">Item {{i}}</span>
                </div>
            </div>
        </div>
    </div>

    <div v-else class="flex-1 py-4 flex flex-col items-center bg-editor-sidebar gap-4">
      <button class="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40" title="Pages">
         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>
      </button>
      <button class="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40" title="Layers">
         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
      </button>
      <button class="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40" title="Prefabs">
         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
      </button>

      <div class="flex-1 flex items-center justify-center">
        <div class="writing-vertical-lr text-[11px] text-muted-foreground tracking-widest uppercase opacity-60 select-none">
          Hierarchy
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.writing-vertical-lr {
  writing-mode: vertical-lr;
  text-orientation: mixed;
}
</style>