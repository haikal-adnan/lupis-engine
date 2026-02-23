<template>
  <BaseDropdown ref="projectMenuDropdown" class="shrink-0 z-20">
    <template #trigger="{ isOpen }">
      <button 
        class="h-full flex items-center gap-2 px-4 hover:bg-secondary transition-colors border-r border-border outline-none focus-visible:bg-secondary"
        :class="{ 'bg-secondary': isOpen }"
      >
        <div 
          class="w-2.5 h-2.5 rounded-full transition-all duration-300 shadow-sm ring-1 ring-background/20" 
          :class="[indicatorColor, { 'animate-pulse': projectStore.isLoading }]"
          :title="statusTooltip"
        ></div>
        
        <span class="text-sm font-semibold tracking-tight truncate max-w-[150px]">
          {{ projectStore.project?.name || 'Lupis Engine' }}
        </span>
        
        <ChevronDown 
          class="w-3 h-3 text-muted-foreground opacity-70 transition-transform duration-200" 
          :class="{ 'rotate-180': isOpen }"
          :stroke-width="2"
        />
      </button>
    </template>

    <template #default>
        <div class="px-3 py-2 text-xs text-muted-foreground font-medium uppercase tracking-wider flex justify-between items-center">
          <span>Project Actions</span>
          <span class="text-[10px] bg-muted px-1.5 rounded">{{ projectStore.syncStatus }}</span>
        </div>
        <div class="h-px bg-border my-1"></div>
        
        <button class="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors outline-none flex items-center gap-2" @click="closeMenu">
          <FolderOpen class="w-3.5 h-3.5 text-muted-foreground" /> 
          Back to Dashboard
        </button>

        <button 
          @click="handleSaveLocal" 
          :disabled="projectStore.isLoading" 
          class="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex justify-between items-center group disabled:cursor-not-allowed disabled:opacity-50 outline-none"
        >
          <span class="flex items-center gap-2">
            <HardDrive class="w-3.5 h-3.5 text-blue-500" /> 
            Save Local <span class="text-xs text-muted-foreground ml-1">(Ctrl+S)</span>
          </span>
          <span v-if="projectStore.isLoading" class="loading loading-spinner loading-xs scale-75"></span>
          <span v-else class="text-[10px] font-mono border border-border px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground group-hover:bg-background group-hover:text-foreground transition-colors">
            IDB
          </span>
        </button>

        <button 
          @click="handleSaveServer" 
          :disabled="projectStore.isLoading" 
          class="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex justify-between items-center group disabled:cursor-not-allowed disabled:opacity-50 outline-none"
        >
          <span class="flex items-center gap-2">
            <CloudUpload class="w-3.5 h-3.5 text-emerald-500" /> 
            Save to Cloud <span class="text-xs text-muted-foreground ml-1">(Ctrl+Shift+S)</span>
          </span>
           <span class="text-[10px] font-mono border border-border px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground group-hover:bg-background group-hover:text-foreground transition-colors">
            API
          </span>
        </button>

        <div class="h-px bg-border my-1"></div>
        
        <button class="w-full text-left px-3 py-2 text-sm hover:bg-destructive hover:text-destructive-foreground text-destructive transition-colors outline-none flex items-center gap-2" @click="closeMenu">
          <LogOut class="w-3.5 h-3.5" /> 
          Close Project
        </button>
    </template>
  </BaseDropdown>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useProjectStore } from "@/stores/useProjectStore";
import BaseDropdown from "@ui/overlay/BaseDropdown.vue";
import { ChevronDown, FolderOpen, Save, LogOut, CloudUpload, HardDrive } from 'lucide-vue-next';

const projectStore = useProjectStore();
const projectMenuDropdown = ref(null);

const indicatorColor = computed(() => {
  if (projectStore.error) return 'bg-destructive';
  if (projectStore.isLoading) return 'bg-yellow-400';
  
  switch (projectStore.syncStatus) {
    case 'dirty': return 'bg-red-500 shadow-red-500/50';   
    case 'local': return 'bg-blue-500 shadow-blue-500/50';  
    case 'synced': return 'bg-emerald-500 shadow-emerald-500/50'; 
    default: return 'bg-slate-400';
  }
});

const statusTooltip = computed(() => {
  if (projectStore.error) return `Error: ${projectStore.error}`;
  if (projectStore.isLoading) return "Working...";
  
  const map = {
    'dirty': 'Unsaved Changes (RAM)',
    'local': 'Saved Locally (IndexedDB)',
    'synced': 'Synced with Server'
  };
  return map[projectStore.syncStatus] || "System Ready";
});

function closeMenu() { 
  projectMenuDropdown.value?.close(); 
}

async function handleSaveLocal() { 
  await projectStore.saveProject(); 
  closeMenu(); 
}

async function handleSaveServer() {
  await projectStore.saveProjectToServer();
  closeMenu();
}

const handleKeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's' && !e.shiftKey) { 
    e.preventDefault(); 
    handleSaveLocal(); 
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's' && e.shiftKey) {
    e.preventDefault();
    handleSaveServer();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>