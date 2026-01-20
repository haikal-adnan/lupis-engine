<template>
  <div 
    class="h-full flex flex-col bg-background text-foreground select-none"
    @click="closeMenu"
    @contextmenu.prevent="handleContextMenu($event, null)"
  >
    <div class="flex items-center gap-2 px-3 h-10 border-b border-border bg-background shrink-0">
      
      <button 
        @click.stop="toggleView" 
        class="p-1.5 hover:bg-secondary rounded-md text-muted-foreground transition-colors"
        :title="viewMode === 'grid' ? 'Switch to List' : 'Switch to Grid'"
      >
        <component :is="viewMode === 'grid' ? List : LayoutGrid" class="w-4 h-4" />
      </button>

      <div class="w-px h-4 bg-border mx-1"></div>

      <div class="flex items-center gap-2 text-xs font-medium">
        <ScrollText class="w-3.5 h-3.5 text-blue-500" />
        <span>Scripts</span>
        <span class="bg-secondary px-1.5 rounded-full text-[10px] text-muted-foreground">
            {{ filteredScripts.length }}
        </span>
      </div>

      <div class="flex-1"></div>

      <BaseSearchInput v-model="searchQuery" placeholder="Search scripts..." />
      
      <div class="w-px h-4 bg-border mx-1"></div>
      
      <button 
        @click="handleCreate('component')"
        class="p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-md transition-colors"
        title="New Component Script"
      >
        <Plus class="w-4 h-4" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-2 bg-background/50" @contextmenu.prevent>
      
      <div v-if="viewMode === 'grid'" class="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
        <ScriptItem 
          v-for="item in filteredScripts" 
          :key="item._id" 
          :data="item" 
          view-mode="grid"
          :active="selectedId === item._id"
          @click.stop="handleSelect(item)"
          @contextmenu.prevent.stop="handleContextMenu($event, item)"
        />
      </div>

      <div v-else class="flex flex-col gap-1">
        <ScriptItem 
          v-for="item in filteredScripts" 
          :key="item._id" 
          :data="item" 
          view-mode="list"
          :active="selectedId === item._id"
          @click.stop="handleSelect(item)"
          @contextmenu.prevent.stop="handleContextMenu($event, item)"
        />
      </div>

      <div v-if="filteredScripts.length === 0" class="h-full flex flex-col items-center justify-center text-muted-foreground/50">
        <FileCode2 class="w-8 h-8 mb-2 opacity-20" />
        <span class="text-xs">No scripts found.</span>
        <span class="text-[10px] opacity-70">Right click to create new.</span>
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
import { ref, computed } from 'vue'
import { 
  LayoutGrid, List, ScrollText, FileCode2, Workflow,
  Plus, Edit3, Trash2, Copy, RefreshCw, FilePlus
} from 'lucide-vue-next'

// Atomic Components
import BaseSearchInput from '@/commons/components/inputs/BaseSearchInput.vue'
import BaseContextMenu from '@/commons/components/overlay/BaseContextMenu.vue'
import ScriptItem from './parts/ScriptItem.vue'

// Logic Composable
import { useScriptPanel } from './composables/useScriptPanel.js'

// --- Init Composable ---
const {
    searchQuery,
    viewMode,
    selectedId,
    filteredScripts,
    toggleView,
    selectScript,
    handleCreate,
    handleRename,
    handleDuplicate,
    handleDelete,
    handleRefresh
} = useScriptPanel();


// --- Local UI State (Context Menu) ---
const menu = ref({ visible: false, x: 0, y: 0, item: null })

// --- Logic Local ---
const handleSelect = (item) => { 
  selectScript(item)
}

// --- Context Menu System ---
const handleContextMenu = (e, item) => {
  if (item) selectScript(item)
  
  menu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    item: item
  }
}

const closeMenu = () => {
  menu.value.visible = false
}

// Generate Dynamic Menu
const contextMenuItems = computed(() => {
  const targetItem = menu.value.item

  // 1. Menu untuk Existing Script
  if (targetItem) {
    return [
      { 
        label: targetItem.name, 
        disabled: true,
        class: 'font-semibold text-blue-500' 
      },
      { separator: true },
      { 
        label: 'Open Graph', 
        icon: Workflow, 
        action: () => console.log('Open Graph Router Push:', targetItem._id) 
      },
      { 
        label: 'Rename', 
        icon: Edit3, 
        shortcut: 'F2',
        action: () => handleRename(targetItem._id) 
      },
      { separator: true },
      { 
        label: 'Duplicate', 
        icon: Copy, 
        action: () => handleDuplicate(targetItem._id) 
      },
      { 
        label: 'Delete', 
        icon: Trash2, 
        shortcut: 'Del',
        action: () => handleDelete(targetItem._id) 
      }
    ]
  }

  // 2. Menu untuk Area Kosong (Create New)
  return [
    { 
      label: 'New Component Script', 
      icon: FileCode2, 
      action: () => handleCreate('component')
    },
    { 
      label: 'New Scene Logic', 
      icon: Workflow, 
      action: () => handleCreate('scene_logic') 
    },
    { separator: true },
    { 
      label: 'Import Script...', 
      icon: FilePlus, 
      disabled: true // Belum diimplementasi
    },
    { separator: true },
    { 
      label: 'Refresh', 
      icon: RefreshCw, 
      shortcut: 'F5',
      action: () => handleRefresh() 
    }
  ]
})
</script>