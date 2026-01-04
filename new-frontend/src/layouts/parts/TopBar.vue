<template>
  <header class="h-12 flex items-center justify-between bg-background border-b border-border select-none text-foreground font-sans z-50 relative shadow-sm">
    
    <div class="flex items-center h-full">
      
      <BaseDropdown ref="projectMenuDropdown">
        <template #trigger="{ isOpen }">
          <button 
            class="h-full flex items-center gap-2 px-4 hover:bg-secondary transition-colors border-r border-border outline-none focus-visible:bg-secondary"
            :class="{ 'bg-secondary': isOpen }"
          >
            <div 
              class="w-2.5 h-2.5 rounded-full transition-colors duration-300 shadow-sm ring-1 ring-background/20" 
              :class="[indicatorColor, { 'animate-pulse': isWorking }]"
              :title="statusTooltip"
            ></div>
            <span class="text-sm font-semibold tracking-tight">Lupis Engine</span>
            <ChevronDown 
              class="w-3 h-3 text-muted-foreground opacity-70 transition-transform duration-200" 
              :class="{ 'rotate-180': isOpen }"
              :stroke-width="2"
            />
          </button>
        </template>

        <template #default>
            <div class="px-3 py-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">Project Options</div>
            <div class="h-px bg-border my-1"></div>
            
            <button class="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors outline-none focus-visible:bg-secondary flex items-center gap-2" @click="closeMenu">
              <FolderOpen class="w-3.5 h-3.5 text-muted-foreground" /> Back to Files
            </button>

            <button @click="handleSaveLocal" :disabled="isSavingLocal" class="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex justify-between items-center group disabled:cursor-not-allowed disabled:opacity-50 outline-none focus-visible:bg-secondary">
              <span class="flex items-center gap-2"><Save class="w-3.5 h-3.5 text-muted-foreground" /> Save Local <span class="text-xs text-muted-foreground ml-1">(Ctrl+S)</span></span>
              <span v-if="isSavingLocal" class="loading loading-spinner loading-xs"></span>
              <span v-else class="text-[10px] font-mono border border-border px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground group-hover:bg-background group-hover:text-foreground transition-colors">Draft</span>
            </button>

            <button @click="handleSyncCloud" :disabled="isUploading" class="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex justify-between items-center group disabled:cursor-not-allowed disabled:opacity-50 outline-none focus-visible:bg-secondary">
              <span class="flex items-center gap-2"><CloudUpload class="w-3.5 h-3.5 text-muted-foreground" /> Sync to Cloud</span>
              <span v-if="isUploading" class="loading loading-spinner loading-xs"></span>
              <span v-else class="text-[10px] font-mono border border-border px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground group-hover:bg-background group-hover:text-foreground transition-colors">Pub</span>
            </button>

            <div class="h-px bg-border my-1"></div>
            
            <button class="w-full text-left px-3 py-2 text-sm hover:bg-destructive hover:text-destructive-foreground text-destructive transition-colors outline-none focus-visible:bg-destructive focus-visible:text-destructive-foreground flex items-center gap-2" @click="closeMenu">
              <LogOut class="w-3.5 h-3.5" /> Close Project
            </button>
        </template>
      </BaseDropdown>

      <div class="flex items-center h-full overflow-x-auto no-scrollbar border-l border-border">
        <BaseTab
          v-for="tab in tabs"
          :key="tab.id"
          :label="tab.name"
          :active="activeTab === tab.id"
          :icon="tab.icon"
          :icon-color="tab.iconColor"
          @click="activeTab = tab.id"
          @close="closeTab(tab.id)"
        />
      </div>
    </div>

    <div class="flex items-center gap-1 px-4 h-full bg-background z-10 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.1)] border-l border-border">
      
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

      <IconButton tooltip="Settings" ghost>
        <Settings class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" :stroke-width="1.5" />
      </IconButton>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, computed, shallowRef } from "vue";
import IconButton from "@ui/buttons/IconButton.vue";
import BaseDropdown from "@ui/overlay/BaseDropdown.vue";
// Pastikan path ini benar sesuai struktur folder Anda (terkadang typo 'navigation' vs 'navigations')
import BaseTab from "@commons/components/navigations/BaseTab.vue"; 

import { useTheme } from "@commons/composables/useTheme.js";
import { useLocalSave } from "@services/db/useLocalSave.js";
import { useCloudSync } from "@services/api/useCloudSync.js";
import { ChevronDown, Box, FileCode2, Workflow, Undo2, Redo2, Sun, Moon, Settings, FolderOpen, Save, CloudUpload, LogOut } from 'lucide-vue-next';

const { isDark, toggleTheme, initTheme } = useTheme();
const { isSavingLocal, saveLocal } = useLocalSave();
const { isUploading, syncCloud } = useCloudSync();

const projectMenuDropdown = ref(null);
const activeTab = ref('scene');

const tabs = ref([
  { id: 'scene', name: 'Level_1.scene', icon: shallowRef(Box), iconColor: 'text-primary' },
  { id: 'js', name: 'PlayerController.js', icon: shallowRef(FileCode2), iconColor: 'text-yellow-500' },
  { id: 'flow', name: 'Player.flow', icon: shallowRef(Workflow), iconColor: 'text-emerald-500' },
]);

const isWorking = computed(() => isSavingLocal.value || isUploading.value);
const indicatorColor = computed(() => {
  if (isSavingLocal.value || isUploading.value) return 'bg-yellow-500';
  return 'bg-green-500';
});
const statusTooltip = computed(() => {
  if (isSavingLocal.value) return "Saving to local storage...";
  if (isUploading.value) return "Syncing to cloud...";
  return "Ready";
});

function closeMenu() { projectMenuDropdown.value?.close(); }
async function handleSaveLocal() { await saveLocal({ id: 'current-scene-id' }); closeMenu(); }
async function handleSyncCloud() { await syncCloud({ id: 'current-scene-id' }); closeMenu(); }
function closeTab(id) { tabs.value = tabs.value.filter(t => t.id !== id); }

onMounted(() => {
  initTheme();
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSaveLocal(); }
  });
});
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>