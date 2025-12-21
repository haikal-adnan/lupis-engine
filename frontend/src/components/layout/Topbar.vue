<template>
  <header class="h-12 flex items-center justify-between bg-background border-b border-border select-none text-foreground font-sans z-50 relative">
    
    <div class="flex items-center h-full">
      
      <div class="relative h-full">
        <button 
          @click="isMenuOpen = !isMenuOpen"
          class="h-full flex items-center gap-2 px-4 hover:bg-secondary transition-colors border-r border-border outline-none focus:bg-secondary"
        >
          <div 
            class="w-2.5 h-2.5 rounded-full transition-colors duration-300 shadow-sm" 
            :class="[indicatorColor, { 'animate-pulse': isWorking }]"
            :title="statusTooltip"
          ></div>
          
          <span class="text-sm font-semibold tracking-tight">Lupis Engine</span>
          
          <svg class="w-3 h-3 text-muted-foreground opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div v-if="isMenuOpen" class="absolute top-full left-1 mt-1 w-64 rounded-md border border-border bg-popover shadow-lg py-1 z-50">
          <div class="px-2 py-1.5 text-xs text-muted-foreground font-medium">Project Options</div>
          <div class="h-px bg-border my-1"></div>
          
          <button class="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary transition-colors">
            Back to Files
          </button>

          <button 
            @click="handleSaveLocal"
            :disabled="isSavingLocal"
            class="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary transition-colors flex justify-between items-center group"
          >
            <span>Save Local <span class="text-xs text-muted-foreground ml-1">(Ctrl+S)</span></span>
            <span v-if="isSavingLocal" class="loading loading-spinner loading-xs"></span>
            <span v-else class="text-xs opacity-0 group-hover:opacity-100 transition-opacity">Draft</span>
          </button>

          <button 
            @click="handleSyncCloud"
            :disabled="isUploading"
            class="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary transition-colors flex justify-between items-center group"
          >
            <span>Sync to Cloud</span>
            <span v-if="isUploading" class="loading loading-spinner loading-xs"></span>
            <span v-else class="text-xs opacity-0 group-hover:opacity-100 transition-opacity">Pub</span>
          </button>

          <div class="h-px bg-border my-1"></div>
          <button class="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary text-destructive transition-colors">
            Close Project
          </button>
        </div>
      </div>

      <div class="flex items-center h-full overflow-x-auto no-scrollbar">
        
        <div 
          class="group relative h-full flex items-center gap-2 px-3 min-w-[140px] max-w-[200px] cursor-pointer bg-primary/10 border-t-2 border-primary"
          @click="activeTab = 'scene'"
        >
          <svg class="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span class="text-xs text-foreground font-medium truncate">Level_1.scene</span>
          
          <button class="ml-auto p-0.5 rounded-sm hover:bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg class="w-3 h-3 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div 
          class="group relative h-full flex items-center gap-2 px-3 min-w-[140px] max-w-[200px] cursor-pointer border-r border-border hover:bg-secondary/50 transition-colors"
          @click="activeTab = 'js'"
        >
          <svg class="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span class="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate">PlayerController.js</span>
           <button class="ml-auto p-0.5 rounded-sm hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity">
            <svg class="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div 
          class="group relative h-full flex items-center gap-2 px-3 min-w-[140px] max-w-[200px] cursor-pointer border-r border-border hover:bg-secondary/50 transition-colors"
          @click="activeTab = 'flow'"
        >
          <svg class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11" />
          </svg>
          <span class="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate">Player.flow</span>
          <button class="ml-auto p-0.5 rounded-sm hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity">
            <svg class="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

      </div>
    </div>

    <div class="flex items-center gap-1 px-4 h-full">
      
      <div class="flex items-center gap-0.5 mr-3">
        <button class="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors" title="Undo">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button class="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors" title="Redo">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
        </button>
      </div>

      <div class="w-px h-4 bg-border mr-3"></div>

      <button 
        class="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors" 
        @click="toggleTheme"
        :title="isDark ? 'Switch to Light' : 'Switch to Dark'"
      >
        <svg v-if="isDark" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>

      <button class="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors" title="Settings">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useSyncManager } from "@/composables/useSyncManager.js";
import { useBackend } from "@/composables/useBackend.js";

const { currentScene } = useBackend();
const { 
  syncStatus, 
  indicatorColor, 
  isSavingLocal, 
  isUploading, 
  saveLocal, 
  syncCloud 
} = useSyncManager();

const isMenuOpen = ref(false);
const activeTab = ref('scene');
const isDark = ref(false);

const isWorking = computed(() => isSavingLocal.value || isUploading.value);

const statusTooltip = computed(() => {
  if (isSavingLocal.value) return "Saving to local storage...";
  if (isUploading.value) return "Syncing to cloud...";
  
  switch(syncStatus.value) {
    case 'RED': return 'Unsaved Changes (RAM)';
    case 'BLUE': return 'Saved Locally (Draft)';
    case 'GREEN': return 'Fully Synced';
    default: return 'Ready';
  }
});

function applyTheme() {
  const html = document.documentElement;
  if (isDark.value) html.classList.add("dark");
  else html.classList.remove("dark");
}

function toggleTheme() {
  isDark.value = !isDark.value;
  localStorage.setItem("theme", isDark.value ? "dark" : "light");
  applyTheme();
}

async function handleSaveLocal() {
  console.log(currentScene)
  if (!currentScene.value) return;
  console.log(currentScene.value)
    
  await saveLocal(currentScene.value._id);
  isMenuOpen.value = false;
}

async function handleSyncCloud() {
  if (!currentScene.value) return;
  await syncCloud(currentScene.value._id);
  isMenuOpen.value = false;
}

onMounted(() => {
  const saved = localStorage.getItem("theme");
  isDark.value = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
  applyTheme();
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('button')) isMenuOpen.value = false;
  });

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSaveLocal();
    }
  });
});
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
    display: none;
}
.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>