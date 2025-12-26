<template>
  <div class="h-full flex flex-col bg-background text-foreground font-sans text-sm select-none">
    <div class="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-background h-10 min-h-[40px]">
      <div class="flex items-center gap-2 shrink-0 mr-2">
        <button @click="toggleViewMode" class="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors">
          <svg v-if="viewMode === 'grid'" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h16v4H4zm0 6h16v4H4zm0 6h16v4H4z"/></svg>
          <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z"/></svg>
        </button>
        <div class="w-px h-4 bg-border"></div>
        <div class="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <svg class="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Prefab Library</span>
          <span class="ml-1 text-[10px] bg-secondary text-muted-foreground px-1.5 rounded-full">{{ prefabs.length }}</span>
        </div>
      </div>
      <div class="flex-1"></div>
      <div class="flex items-center gap-2">
        <input v-model="searchQuery" type="text" placeholder="Filter..." class="w-24 focus:w-40 text-xs rounded bg-background border border-border px-2 py-1 outline-none focus:border-primary transition-all">
        <button @click="$emit('close')" class="p-1.5 hover:bg-destructive/10 text-muted-foreground transition-colors rounded">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-3 bg-background/50 relative">
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
         <div class="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>

      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2">
        <div 
          v-for="item in filteredItems" 
          :key="item._id" 
          @click="selectPrefab(item)"
          :class="['group flex flex-col items-center gap-2 p-2 rounded-md cursor-pointer border transition-all relative', isSelected(item) ? 'bg-primary/10 border-primary shadow-sm' : 'hover:bg-secondary/50 border-transparent hover:border-border']"
        >
          <div class="w-12 h-12 flex items-center justify-center bg-secondary/30 rounded-md overflow-hidden">
             <img v-if="item.thumbnailUrl" :src="item.thumbnailUrl" class="w-full h-full object-cover" />
             <svg v-else class="w-6 h-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <span :class="['text-[11px] text-center font-medium truncate w-full', isSelected(item) ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground']">{{ item.name }}</span>
        </div>
      </div>

      <div v-else class="flex flex-col gap-1">
        <div 
          v-for="item in filteredItems" 
          :key="item._id" 
          @click="selectPrefab(item)"
          :class="['flex items-center gap-3 p-1.5 rounded-sm cursor-pointer group border border-transparent', isSelected(item) ? 'bg-primary/10 border-primary/50' : 'hover:bg-secondary']"
        >
          <div class="w-5 h-5 flex items-center justify-center rounded bg-secondary/50 text-pink-500">
             <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <span :class="['text-xs font-medium', isSelected(item) ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground']">{{ item.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useBackend } from '@/composables/useBackend.js';
import { useSelection } from '@/composables/useSelection.js';
import { bus } from '@engine/Util/EventBus.js';

defineEmits(['close']);

const { prefabs, loading } = useBackend();
const { selectedEntity } = useSelection();

const viewMode = ref('grid');
const searchQuery = ref('');

const filteredItems = computed(() => {
  if (!prefabs.value) return [];
  if (!searchQuery.value) return prefabs.value;
  return prefabs.value.filter(i => i.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

const isSelected = (item) => {
  return selectedEntity.value && selectedEntity.value._id === item._id;
};

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid';
};

// --- CORE LOGIC: NORMALIZATION ---
// Mengubah data DB (Nested Scale) menjadi data Runtime (Flat ScaleX/Y)
const selectPrefab = (prefab) => {
  const rawData = prefab.data || {};
  const rawT = rawData.transform || {};

  // 1. Handle Scale (Object vs Flat)
  let sX = 1, sY = 1;
  if (rawT.scale && typeof rawT.scale === 'object') {
      sX = rawT.scale.x ?? 1;
      sY = rawT.scale.y ?? 1;
  } else {
      sX = rawT.scaleX ?? 1;
      sY = rawT.scaleY ?? 1;
  }

  // 2. Bangun Object Transform Standar
  const normalizedTransform = {
    x: rawT.x ?? rawT.translate?.x ?? 0, 
    y: rawT.y ?? rawT.translate?.y ?? 0,
    rotation: rawT.rotation ?? 0,
    scaleX: sX,
    scaleY: sY,
    pivotX: rawT.pivotX ?? rawT.pivot?.x ?? 0.5,
    pivotY: rawT.pivotY ?? rawT.pivot?.y ?? 0.5,
    zIndex: rawT.zIndex ?? 0
  };

  // 3. Bangun Entity Object Lengkap
  const entityFormat = {
    ...rawData, 
    _id: prefab._id,      
    name: prefab.name,    
    isPrefabMaster: true,
    transform: normalizedTransform, // <--- INI KUNCINYA
    
    // Fallback Root Properties
    width: rawData.width ?? 100, 
    height: rawData.height ?? 100,
    opacity: rawData.opacity ?? 100,
    visible: true,
    tag: rawData.tag || 'untagged'
  };

  bus.emit("entity:selected", [entityFormat]);
  console.log("📦 Selected Prefab:", entityFormat);
};
</script>