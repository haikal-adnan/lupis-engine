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

        <div class="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <svg class="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Prefab Library</span>
        </div>
      </div>

      <div class="flex-1"></div>

      <div class="flex items-center gap-2">
        <div class="relative group transition-all duration-300 ease-out">
          <svg class="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Filter prefabs..." 
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

    <div class="flex-1 overflow-y-auto p-3 bg-background/50 relative">
      
      <div 
        v-if="items.length === 0" 
        class="absolute inset-0 flex flex-col items-center justify-center p-6 select-none"
      >
        <div class="w-14 h-14 bg-gradient-to-br from-secondary to-background border border-border rounded-xl flex items-center justify-center mb-4 shadow-sm">
          <svg class="w-7 h-7 text-pink-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        
        <h3 class="text-foreground font-semibold mb-1">Library is Empty</h3>
        <p class="text-xs text-muted-foreground text-center mb-6 max-w-[300px]">
          Save objects from your Scene to reuse them later.
        </p>

        <div class="flex items-stretch gap-2 w-full max-w-[480px]">
          
          <div class="flex-1 flex flex-col items-center text-center p-3 rounded-lg bg-secondary/20 border border-border/40 hover:bg-secondary/40 transition-colors">
            <div class="w-5 h-5 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center font-bold text-[10px] mb-2">1</div>
            <span class="text-xs text-foreground font-medium mb-1">Select Entity</span>
            <p class="text-[10px] text-muted-foreground leading-tight">Click object in Scene.</p>
          </div>

          <div class="flex items-center justify-center text-muted-foreground/30">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>

          <div class="flex-1 flex flex-col items-center text-center p-3 rounded-lg bg-secondary/20 border border-border/40 hover:bg-secondary/40 transition-colors">
            <div class="w-5 h-5 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center font-bold text-[10px] mb-2">2</div>
            <span class="text-xs text-foreground font-medium mb-1">Check Properties</span>
            <p class="text-[10px] text-muted-foreground leading-tight">Look at Inspector panel.</p>
          </div>

          <div class="flex items-center justify-center text-muted-foreground/30">
             <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>

          <div class="flex-1 flex flex-col items-center text-center p-3 rounded-lg bg-secondary/20 border border-border/40 hover:bg-secondary/40 transition-colors">
            <div class="w-5 h-5 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center font-bold text-[10px] mb-2">3</div>
            <span class="text-xs text-foreground font-medium mb-1">Save Prefab</span>
            <div class="mt-1 flex items-center gap-1 px-1.5 py-0.5 bg-background border border-border rounded-[4px] text-[9px] text-pink-500 shadow-sm">
                <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 1m0-1l1 3m0-9a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span class="font-bold">Save</span>
            </div>
          </div>

        </div>
      </div>

      <div 
        v-else-if="filteredItems.length === 0" 
        class="absolute inset-0 flex flex-col items-center justify-center text-center opacity-80"
      >
        <svg class="w-10 h-10 text-muted-foreground/50 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <p class="text-sm text-foreground mb-1">No results found</p>
        <p class="text-xs text-muted-foreground mb-4">No prefabs match "{{ searchQuery }}"</p>
        <button @click="searchQuery = ''" class="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-xs font-medium rounded-md transition-colors border border-border">Clear Search</button>
      </div>

      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2">
        <div 
          v-for="item in filteredItems" 
          :key="item.id" 
          class="group flex flex-col items-center gap-2 p-2 rounded-md hover:bg-secondary/50 cursor-pointer border border-transparent hover:border-border transition-all"
        >
          <div class="w-12 h-12 flex items-center justify-center bg-secondary/30 rounded-md group-hover:scale-105 transition-transform border border-border relative overflow-hidden">
             <div class="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:4px_4px]"></div>
             <svg class="w-6 h-6 text-pink-500 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span class="text-[11px] text-center text-muted-foreground font-medium truncate w-full group-hover:text-foreground">{{ item.name }}</span>
        </div>
      </div>

      <div v-else class="flex flex-col gap-1">
        <div 
          v-for="item in filteredItems" 
          :key="item.id" 
          class="flex items-center gap-3 p-1.5 rounded-sm hover:bg-secondary cursor-pointer group"
        >
          <div class="w-5 h-5 flex items-center justify-center rounded bg-secondary/50 text-pink-500">
             <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span class="text-xs text-muted-foreground font-medium group-hover:text-foreground">{{ item.name }}</span>
          <span class="ml-auto text-[10px] text-muted-foreground/50 bg-secondary/50 px-1.5 rounded">Prefab</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

defineEmits(['close']);

const viewMode = ref('grid');
const searchQuery = ref('');

// ITEMS: Biarkan kosong untuk melihat Empty State "Local Guide"
const items = ref([
    // { id: 1, name: 'PlayerHero' },
    // { id: 2, name: 'Enemy_Slime' },
]);

const filteredItems = computed(() => {
  if (!searchQuery.value) return items.value;
  return items.value.filter(i => i.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid';
};
</script>