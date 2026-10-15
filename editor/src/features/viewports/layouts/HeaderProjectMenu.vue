<template>
  <BaseDropdown ref="projectMenuDropdown" class="shrink-0 z-20">
    <template #trigger="{ isOpen }">
      <button 
        class="h-full flex items-center gap-2 px-4 hover:bg-secondary transition-colors border-r border-border outline-none focus-visible:bg-secondary"
        :class="{ 'bg-secondary': isOpen }"
      >
        <div 
          class="w-2.5 h-2.5 rounded-full transition-all duration-300 shadow-sm ring-1 ring-background/20" 
          :class="[indicatorColor, { 'animate-pulse': workspaceStore.isLoading || workspaceStore.isSaving }]"
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

        <button 
          @click="handleSyncProject" 
          :disabled="workspaceStore.isLoading || workspaceStore.isSaving || !workspaceStore.activeProjectId" 
          class="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex justify-between items-center group disabled:cursor-not-allowed disabled:opacity-50 outline-none"
        >
          <span class="flex items-center gap-2">
            <HardDrive class="w-3.5 h-3.5 text-blue-500" /> 
            Sync from Server
          </span>
          <span v-if="workspaceStore.isLoading" class="loading loading-spinner loading-xs scale-75"></span>
        </button>

        <button 
          @click="handleSaveServer" 
          :disabled="workspaceStore.isLoading || workspaceStore.isSaving || !workspaceStore.activeProjectId" 
          class="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex justify-between items-center group disabled:cursor-not-allowed disabled:opacity-50 outline-none"
        >
          <span class="flex items-center gap-2">
            <CloudUpload class="w-3.5 h-3.5 text-emerald-500" /> 
            Save to Server <span class="text-xs text-muted-foreground ml-1">(Ctrl+S)</span>
          </span>
          <span v-if="workspaceStore.isSaving" class="loading loading-spinner loading-xs scale-75"></span>
        </button>
                
        <button 
          class="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors outline-none flex items-center gap-2 mt-1 border-t border-border pt-2" 
          @click="handleBackToDashboard"
        >
          <FolderOpen class="w-3.5 h-3.5 text-muted-foreground" /> 
          Back to Dashboard
        </button>
    </template>
  </BaseDropdown>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useProjectStore } from '@projects/projects.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { BaseDropdown } from "@components/components.js";
import { ChevronDown, FolderOpen, CloudUpload, HardDrive } from 'lucide-vue-next';

import { useConfirm } from '@composables/composables.js';


const router = useRouter();
const projectStore = useProjectStore();
const workspaceStore = useWorkspaceStore();
const { confirm } = useConfirm();

const projectMenuDropdown = ref(null);

const indicatorColor = computed(() => {
  if (workspaceStore.error) return 'bg-destructive';
  if (workspaceStore.isLoading || workspaceStore.isSaving) return 'bg-yellow-400';
  
  switch (projectStore.syncStatus) {
    case 'dirty': return 'bg-red-500 shadow-red-500/50';   
    case 'local': return 'bg-blue-500 shadow-blue-500/50';  
    case 'synced': return 'bg-emerald-500 shadow-emerald-500/50'; 
    default: return 'bg-slate-400';
  }
});

const statusTooltip = computed(() => {
  if (workspaceStore.error) return `Error: ${workspaceStore.error}`;
  if (workspaceStore.isLoading) return "Loading data...";
  if (workspaceStore.isSaving) return "Saving to server...";
  
  const map = {
    'dirty': 'Unsaved Changes',
    'local': 'Saved Locally (IndexedDB)',
    'synced': 'Synced with Server'
  };
  return map[projectStore.syncStatus] || "System Ready";
});

function closeMenu() { 
  projectMenuDropdown.value?.close(); 
}

async function handleSyncProject() {
  closeMenu();
  
  if (!workspaceStore.activeProjectId) return;

  const isConfirmed = await confirm({
    title: 'Sync from Server?',
    message: 'Are you sure? All unsaved changes will be lost and the editor will reload the latest data from the server.',
    type: 'warning',
    confirmText: 'Sync'
  });

  if (isConfirmed) {
    await projectStore.syncFromServer();
  }
}

async function handleSaveServer() {
  closeMenu();
  if (!workspaceStore.activeProjectId) return;
  await projectStore.saveProjectToServer();
}

async function handleBackToDashboard() {
  closeMenu();
  
  if (projectStore.syncStatus === 'dirty') {
    const isConfirmed = await confirm({
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to leave the editor? Unsaved changes will be lost.',
      type: 'danger',
      confirmText: 'Leave Without Saving'
    });
    
    if (!isConfirmed) return;
  }
  
  projectStore.clearProjectData();
  
  router.push('/dashboard'); 
}

function handleKeyDown(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    
    if (!workspaceStore.isLoading && !workspaceStore.isSaving && workspaceStore.activeProjectId) {
      handleSaveServer();
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>