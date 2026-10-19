<template>
  <BaseDropdown ref="projectMenuDropdown" class="shrink-0 z-20">
    <template #trigger="{ isOpen }">
      <button 
        data-testid="header-project-menu-button"
        class="h-full flex items-center gap-2 px-4 hover:bg-secondary transition-colors border-r border-border outline-none focus-visible:bg-secondary cursor-pointer"
        :class="{ 'bg-secondary': isOpen }"
        aria-label="Project Menu"
      >
        <div 
          data-testid="project-sync-status-indicator"
          :data-sync-status="projectStore.syncStatus"
          class="w-2.5 h-2.5 rounded-full transition-all duration-300 shadow-sm ring-1 ring-background/20 shrink-0" 
          :class="[indicatorColor, { 'animate-pulse': workspaceStore.isLoading || workspaceStore.isSaving }]"
          :title="statusTooltip"
        ></div>
        
        <span data-testid="header-project-name" class="text-sm font-semibold tracking-tight truncate max-w-[160px]">
          {{ projectStore.project?.name || 'Lupis Engine' }}
        </span>
        
        <ChevronDown 
          class="w-3 h-3 text-muted-foreground opacity-70 transition-transform duration-200 shrink-0" 
          :class="{ 'rotate-180': isOpen }"
          :stroke-width="2"
        />
      </button>
    </template>

    <template #default>
      <div class="px-3 py-2 text-xs text-muted-foreground font-medium uppercase tracking-wider flex justify-between items-center select-none">
        <span>Project</span>
        <span 
          data-testid="project-sync-status-badge" 
          :data-sync-status="projectStore.syncStatus"
          class="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold"
          :class="projectStore.syncStatus === 'dirty' ? 'bg-destructive/15 text-destructive' : 'bg-muted text-muted-foreground'"
        >
          {{ projectStore.syncStatus }}
        </span>
      </div>
      <div class="h-px bg-border my-1"></div>

      <!-- Item 1: Save Project -->
      <button 
        data-testid="project-menu-save"
        @click="handleSaveProject" 
        :disabled="workspaceStore.isLoading || workspaceStore.isSaving || !workspaceStore.activeProjectId" 
        class="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex justify-between items-center group disabled:cursor-not-allowed disabled:opacity-50 outline-none cursor-pointer"
      >
        <span class="flex items-center gap-2">
          <CloudUpload class="w-3.5 h-3.5 text-emerald-500" /> 
          Save Project <span class="text-xs text-muted-foreground ml-1">(Ctrl+S)</span>
        </span>
        <span v-if="workspaceStore.isSaving" class="loading loading-spinner loading-xs scale-75"></span>
      </button>

      <!-- Item 2: Export Project -->
      <button 
        data-testid="project-menu-export"
        @click="handleExportProject" 
        :disabled="workspaceStore.isLoading || workspaceStore.isSaving || !workspaceStore.activeProjectId" 
        class="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex justify-between items-center group disabled:cursor-not-allowed disabled:opacity-50 outline-none cursor-pointer"
      >
        <span class="flex items-center gap-2">
          <Download class="w-3.5 h-3.5 text-blue-500" /> 
          Export Project
        </span>
      </button>

      <!-- Item 3: Settings -->
      <button 
        data-testid="project-menu-settings"
        @click="handleOpenSettings" 
        class="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2 group outline-none cursor-pointer"
      >
        <Settings class="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" :stroke-width="1.75" />
        <span>Settings</span>
      </button>
              
      <!-- Item 4: Back to Dashboard -->
      <button 
        data-testid="project-menu-dashboard"
        class="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors outline-none flex items-center gap-2 mt-1 border-t border-border pt-2 cursor-pointer" 
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
import { useConfirm } from '@composables/composables.js';
import { useOPFSActions } from '@opfs/opfs.js';
import { BaseDropdown } from "@components/components.js";
import { ChevronDown, FolderOpen, CloudUpload, Download, Settings, RefreshCw } from 'lucide-vue-next';
import { useNodeOverride } from '@nodes/nodes.js';

const router = useRouter();
const projectStore = useProjectStore();
const workspaceStore = useWorkspaceStore();
const { confirm } = useConfirm();
const { exportToLupisProject } = useOPFSActions();
const { triggerOverrideAllNodes } = useNodeOverride();

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
  if (workspaceStore.isLoading) return "Loading project...";
  if (workspaceStore.isSaving) return "Saving project...";
  
  const map = {
    'dirty': 'Unsaved Changes',
    'local': 'Saved Locally',
    'synced': 'All changes saved'
  };
  return map[projectStore.syncStatus] || "System Ready";
});

function closeMenu() { 
  projectMenuDropdown.value?.close(); 
}

function handleOverrideNodes() {
  closeMenu();
  triggerOverrideAllNodes();
}

function handleOpenSettings() {
  closeMenu();
  workspaceStore.openSettingsModal();
}

async function handleExportProject() {
  closeMenu();
  if (!workspaceStore.activeProjectId) return;
  await exportToLupisProject(workspaceStore.activeProjectId);
}

async function handleSaveProject() {
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
      handleSaveProject();
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