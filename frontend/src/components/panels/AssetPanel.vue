<template>
  <div class="h-full flex flex-col bg-background text-foreground font-sans text-sm select-none">
    
    <div class="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-background h-10 min-h-[40px]">
      
      <div class="flex items-center gap-2 shrink-0 mr-2">
        
        <button 
          @click="toggleViewMode"
          class="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
          :title="viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'"
        >
          <svg v-if="viewMode === 'grid'" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h16v4H4zm0 6h16v4H4zm0 6h16v4H4z"/></svg>
          <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z"/></svg>
        </button>

        <div class="w-px h-4 bg-border"></div>

        <div class="flex items-center gap-1 text-xs text-muted-foreground font-medium">
          <div class="flex items-center hover:bg-secondary/80 px-1.5 py-1 rounded cursor-pointer transition-colors text-foreground">
            <svg class="w-3.5 h-3.5 mr-1 text-orange-400" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
            <span>Assets</span>
          </div>
          <svg class="w-3 h-3 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          <div class="flex items-center hover:bg-secondary/80 px-1.5 py-1 rounded cursor-pointer transition-colors text-foreground">
            <span>Sprites</span>
          </div>
        </div>
      </div>

      <div class="flex-1"></div>

      <div class="flex items-center gap-2">
        
        <div class="relative group transition-all duration-300 ease-out">
          <svg class="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search" 
            class="w-40 focus:w-64 text-xs rounded-md pl-8 pr-2 py-1 outline-none transition-all duration-300
                   bg-background border border-border hover:border-border/50
                   focus:bg-background focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/70"
          >
        </div>

        <div class="w-px h-4 bg-border mx-1"></div>

        <div class="flex items-center gap-0.5 shrink-0">
          <button class="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors" title="Options">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="12" cy="19" r="2"/></svg>
          </button>
          <button @click="$emit('close')" class="p-1.5 hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors rounded" title="Minimize">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
        </div>

      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-3 bg-background/50" @contextmenu.prevent="handleContextMenu">
      
      <div v-if="viewMode === 'grid'" class="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
        
        <button 
          @click="handleAddAsset"
          class="flex flex-col items-center justify-center gap-2 p-2 rounded-md 
                 border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5
                 group transition-all cursor-pointer h-[84px]" 
          title="Add New Asset"
        >
          <div class="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <svg class="w-5 h-5 text-muted-foreground group-hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </div>
          <span class="text-[10px] text-muted-foreground group-hover:text-primary font-medium">Add New</span>
        </button>

        <div v-for="item in items" :key="item.id" class="group flex flex-col items-center gap-2 p-2 rounded-md hover:bg-secondary/50 cursor-pointer border border-transparent hover:border-border transition-all">
          <div class="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105">
            <svg v-if="item.type === 'folder'" class="w-full h-full text-orange-400/90" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
            <svg v-else-if="item.type === 'image'" class="w-8 h-8 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <svg v-else-if="item.type === 'audio'" class="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
            <svg v-else class="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <span class="text-[11px] text-center text-muted-foreground font-medium truncate w-full group-hover:text-foreground">{{ item.name }}</span>
        </div>
      </div>

      <div v-else class="flex flex-col gap-1">
        
        <button 
           @click="handleAddAsset"
           class="flex items-center gap-3 p-1.5 rounded-sm border border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 cursor-pointer group transition-all text-left"
        >
           <div class="w-4 h-4 flex items-center justify-center rounded bg-secondary/50 group-hover:bg-primary/20">
             <svg class="w-3 h-3 text-muted-foreground group-hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
           </div>
           <span class="text-xs text-muted-foreground group-hover:text-primary font-medium italic">Create or Import new asset...</span>
        </button>

        <div v-for="item in items" :key="item.id" class="flex items-center gap-2 p-1.5 rounded-sm hover:bg-secondary cursor-pointer group">
           <svg v-if="item.type === 'folder'" class="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
           <svg v-else-if="item.type === 'image'" class="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
           <span class="text-xs text-muted-foreground font-medium group-hover:text-foreground">{{ item.name }}</span>
           <span class="ml-auto text-[10px] text-muted-foreground/50 opacity-0 group-hover:opacity-100">12 KB</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineEmits(['close']);
const viewMode = ref('grid');

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid';
};

const items = ref([
  { id: 1, name: 'Sprites', type: 'folder' },
  { id: 2, name: 'Audio', type: 'folder' },
  { id: 3, name: 'Scripts', type: 'folder' },
  { id: 4, name: 'player_idle.png', type: 'image' },
  { id: 5, name: 'player_walk.png', type: 'image' },
  { id: 6, name: 'jump.wav', type: 'audio' },
  { id: 7, name: 'GameManager.js', type: 'script' },
]);

function handleAddAsset() {
  console.log("Add Asset");
}
function handleContextMenu() {}
</script>