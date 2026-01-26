<template>
  <div 
    class="h-full flex flex-col bg-background text-foreground select-none"
    @click="closeMenu"
    @contextmenu.prevent="handleContextMenu($event, null)"
  >
    <div class="flex items-center gap-2 px-3 h-10 border-b border-border bg-background shrink-0">
      <button @click.stop="toggleView" class="p-1.5 hover:bg-secondary rounded-md text-muted-foreground">
        <component :is="viewMode === 'grid' ? List : LayoutGrid" class="w-4 h-4" />
      </button>
      <div class="flex items-center gap-2 text-xs font-medium">
        <ScrollText class="w-3.5 h-3.5 text-blue-500" />
        <span>Scripts</span>
        <span class="bg-secondary px-1.5 rounded-full text-[10px]">{{ filteredScripts.length }}</span>
      </div>
      <div class="flex-1"></div>
      <BaseSearchInput v-model="searchQuery" placeholder="Search..." />
      <button @click="handleCreate('component')" class="p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-md">
        <Plus class="w-4 h-4" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-2" @contextmenu.prevent>
      <div :class="viewMode === 'grid' ? 'grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2' : 'flex flex-col gap-1'">
        <ScriptItem 
          v-for="item in filteredScripts" 
          :key="item._id" 
          :data="item" 
          :view-mode="viewMode"
          :active="selectedId === item._id"
          @select="selectScript(item)"
          @open="handleOpenGraph(item)"
          @contextmenu.prevent.stop="handleContextMenu($event, item)"
        />
      </div>

      <div v-if="filteredScripts.length === 0" class="h-full flex flex-col items-center justify-center text-muted-foreground/30">
        <FileCode2 class="w-8 h-8 mb-2" />
        <span class="text-xs">No scripts found.</span>
      </div>
    </div>

    <Teleport to="body">
      <BaseContextMenu 
        v-if="menu.visible"
        :position="{ x: menu.x, y: menu.y }"
        :items="contextMenuItems"
        @close="closeMenu"
      />
    </Teleport>
  </div>
</template>

<script setup>
import { LayoutGrid, List, ScrollText, FileCode2, Plus } from 'lucide-vue-next'
import BaseSearchInput from '@/commons/components/inputs/BaseSearchInput.vue'
import BaseContextMenu from '@/commons/components/overlay/BaseContextMenu.vue'
import ScriptItem from './parts/ScriptItem.vue'
import { useScriptPanel } from './composables/useScriptPanel.js'

// Semua logic diambil dari composable agar bersih
const {
  searchQuery, 
  viewMode, 
  selectedId, 
  filteredScripts,
  
  // Menu System (State & Computed Items)
  menu, 
  contextMenuItems, 
  
  // Actions
  toggleView, 
  selectScript, 
  handleOpenGraph,
  handleCreate, 
  handleContextMenu, 
  closeMenu
} = useScriptPanel();
</script>