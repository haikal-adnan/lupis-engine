<script setup>
import { ref } from 'vue';
import FileExplorer from '../panels/FileExplorer/FileTree.vue'; 
import SceneTree from '../panels/SceneGraph/SceneTree.vue'; // IMPORT BARU

const props = defineProps({
  collapsed: Boolean
});

const emit = defineEmits(['toggle']);
const activeTab = ref('layers');

const selectTab = (tab) => {
  activeTab.value = tab;
  if (props.collapsed) {
    emit('toggle'); 
  }
};
</script>

<template>
  <div class="h-full flex flex-col bg-panel overflow-hidden">
    
    <div v-if="!collapsed" class="h-10 flex items-center border-b border-border bg-panel-header px-2 shrink-0">
      <div class="flex space-x-1 flex-1">
        <button 
          @click="activeTab = 'layers'"
          :class="['px-3 py-1 text-xs font-medium rounded transition-colors', activeTab === 'layers' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-primary']"
        >
          Layers
        </button>
        <button 
          @click="activeTab = 'files'"
          :class="['px-3 py-1 text-xs font-medium rounded transition-colors', activeTab === 'files' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-primary']"
        >
          Files
        </button>
      </div>

      <button @click="$emit('toggle')" class="p-1 hover:bg-accent rounded text-muted-foreground hover:text-primary" title="Collapse">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M9 3v18"/></svg>
      </button>
    </div>

    <div v-else class="h-full flex flex-col items-center py-4 space-y-4 w-full">
      <button @click="$emit('toggle')" class="p-2 hover:bg-accent rounded text-primary mb-2" title="Expand">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3z"/><path d="M9 3v18"/><path d="m15 9-3 3 3 3"/></svg>
      </button>

      <button 
        @click="selectTab('layers')"
        :class="['p-2 rounded transition-colors', activeTab === 'layers' ? 'text-blue-400 bg-blue-400/10' : 'text-muted-foreground hover:text-primary']"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
      </button>

      <button 
        @click="selectTab('files')"
        :class="['p-2 rounded transition-colors', activeTab === 'files' ? 'text-yellow-400 bg-yellow-400/10' : 'text-muted-foreground hover:text-primary']"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
      </button>
    </div>

    <div v-if="!collapsed" class="flex-1 overflow-auto p-2 scrollbar-thin">
      <div v-show="activeTab === 'layers'">
        <div class="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide px-1 opacity-80">
          Scene Graph 
        </div>
        <SceneTree />
      </div>

      <div v-show="activeTab === 'files'">
         <div class="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide px-1">
           FileSystem
         </div>
        <FileExplorer />
      </div>

    </div>
  </div>
</template>