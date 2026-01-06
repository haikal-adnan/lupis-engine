<template>
  <header class="h-12 flex items-center justify-between bg-background border-b border-border select-none text-foreground font-sans z-50 relative shadow-sm">
    
    <div class="flex items-center h-full min-w-0">
      
      <BaseDropdown ref="projectMenuDropdown" class="shrink-0 z-20">
        <template #trigger="{ isOpen }">
          <button 
            class="h-full flex items-center gap-2 px-4 hover:bg-secondary transition-colors border-r border-border outline-none focus-visible:bg-secondary"
            :class="{ 'bg-secondary': isOpen }"
          >
            <div 
              class="w-2.5 h-2.5 rounded-full transition-colors duration-300 shadow-sm ring-1 ring-background/20" 
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
            <div class="px-3 py-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Project Actions
            </div>
            <div class="h-px bg-border my-1"></div>
            
            <button class="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors outline-none flex items-center gap-2" @click="closeMenu">
              <FolderOpen class="w-3.5 h-3.5 text-muted-foreground" /> 
              Back to Dashboard
            </button>

            <button 
              @click="handleSave" 
              :disabled="projectStore.isLoading" 
              class="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex justify-between items-center group disabled:cursor-not-allowed disabled:opacity-50 outline-none"
            >
              <span class="flex items-center gap-2">
                <Save class="w-3.5 h-3.5 text-muted-foreground" /> 
                Save Project <span class="text-xs text-muted-foreground ml-1">(Ctrl+S)</span>
              </span>
              <span v-if="projectStore.isLoading" class="loading loading-spinner loading-xs scale-75"></span>
              <span v-else class="text-[10px] font-mono border border-border px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground group-hover:bg-background group-hover:text-foreground transition-colors">
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

      <div class="flex-1 flex items-center h-full overflow-hidden relative">
        <div class="flex items-center h-full overflow-x-auto no-scrollbar border-l border-border w-full">
          <BaseTab
            v-for="scene in projectStore.scenes"
            :key="scene.id"
            :label="scene.name"
            :active="projectStore.activeSceneId === scene.id"
            :icon="Box"
            icon-color="text-primary"
            @click="projectStore.setActiveScene(scene.id)"
            @close="() => {}"
          />
          
          <BaseTab
            label="PlayerController.js"
            :active="false"
            :icon="FileCode2"
            icon-color="text-yellow-500"
          />
        </div>
        
        <div class="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none"></div>
      </div>

    </div>

    <div class="flex items-center gap-1 px-4 h-full bg-background z-10 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.1)] border-l border-border shrink-0">
      
      <div class="flex items-center gap-0.5 mr-3">
        <IconButton tooltip="Undo (Ctrl+Z)" ghost>
          <Undo2 class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" :stroke-width="1.5" />
        </IconButton>
        <IconButton tooltip="Redo (Ctrl+Y)" ghost>
          <Redo2 class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" :stroke-width="1.5" />
        </IconButton>
      </div>

      <div class="w-px h-5 bg-border mr-3"></div>

      <IconButton @click="toggleTheme" :tooltip="isDark ? 'Switch to Light' : 'Switch to Dark'" ghost>
        <Moon v-if="isDark" class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" :stroke-width="1.5" />
        <Sun v-else class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" :stroke-width="1.5" />
      </IconButton>

      <IconButton tooltip="Project Settings" ghost>
        <Settings class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" :stroke-width="1.5" />
      </IconButton>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useProjectStore } from "@/stores/useProjectStore";
import { useTheme } from "@commons/composables/useTheme.js";

// UI Components
import IconButton from "@ui/buttons/IconButton.vue";
import BaseDropdown from "@ui/overlay/BaseDropdown.vue";
import BaseTab from "@commons/components/navigations/BaseTab.vue"; 

// Icons
import { 
  ChevronDown, Box, FileCode2, Undo2, Redo2, 
  Sun, Moon, Settings, FolderOpen, Save, LogOut 
} from 'lucide-vue-next';

const { isDark, toggleTheme, initTheme } = useTheme();
const projectStore = useProjectStore();
const projectMenuDropdown = ref(null);

// Status Indicators
const indicatorColor = computed(() => {
  if (projectStore.error) return 'bg-destructive';
  if (projectStore.isLoading) return 'bg-yellow-400';
  if (projectStore.isProjectLoaded) return 'bg-emerald-500';
  return 'bg-slate-400';
});

const statusTooltip = computed(() => {
  if (projectStore.error) return `Error: ${projectStore.error}`;
  if (projectStore.isLoading) return "Working...";
  return "System Ready";
});

// Actions
function closeMenu() { 
  projectMenuDropdown.value?.close(); 
}

async function handleSave() { 
  await projectStore.saveProject(); 
  closeMenu(); 
}

// Lifecycle & Shortcuts
onMounted(() => {
  initTheme();
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { 
      e.preventDefault(); 
      handleSave(); 
    }
  });
});
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>