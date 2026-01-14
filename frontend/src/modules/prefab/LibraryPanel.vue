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
        <Box class="w-3.5 h-3.5 text-pink-500" />
        <span>Prefabs</span>
        <span class="bg-secondary px-1.5 rounded-full text-[10px] text-muted-foreground">{{ filteredItems.length }}</span>
      </div>

      <div class="flex-1"></div>
      <BaseSearchInput v-model="searchQuery" placeholder="Search prefabs..." />
      <div class="w-px h-4 bg-border mx-1"></div>
      
      <button class="p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-md transition-colors">
        <Plus class="w-4 h-4" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-2 bg-background/50" @contextmenu.prevent>
      
      <div v-if="viewMode === 'grid'" class="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
        <PrefabItem 
          v-for="item in filteredItems" 
          :key="item.id" 
          :data="item" 
          view-mode="grid"
          :active="selectedId === item.id"
          @click.stop="handleSelect(item)"
          @contextmenu.prevent.stop="handleContextMenu($event, item)"
        />
      </div>

      <div v-else class="flex flex-col gap-1">
        <PrefabItem 
          v-for="item in filteredItems" 
          :key="item.id" 
          :data="item" 
          view-mode="list"
          :active="selectedId === item.id"
          @click.stop="handleSelect(item)"
          @contextmenu.prevent.stop="handleContextMenu($event, item)"
        />
      </div>

      <div v-if="filteredItems.length === 0" class="h-full flex flex-col items-center justify-center text-muted-foreground/50">
        <span class="text-xs">No prefabs. Drag object from scene here.</span>
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
  LayoutGrid, List, Box, 
  PlusSquare, Edit3, Trash2, RefreshCw, Copy, Layers, Plus
} from 'lucide-vue-next'

// Atomic Components
import BaseSearchInput from '@/commons/components/inputs/BaseSearchInput.vue'
import BaseContextMenu from '@/commons/components/overlay/BaseContextMenu.vue'
import PrefabItem from './parts/PrefabItem.vue'

// --- State ---
const viewMode = ref('grid')
const searchQuery = ref('')
const selectedId = ref(null)
const menu = ref({ visible: false, x: 0, y: 0, item: null })

// --- Dummy Data ---
const BASE_POKE_URL = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon"
const items = ref([
  { id: 'p1', name: 'Player (Red)', thumbnailUrl: `${BASE_POKE_URL}/4.png` },
  { id: 'p2', name: 'Enemy Slime', thumbnailUrl: `${BASE_POKE_URL}/132.png` },
  { id: 'p3', name: 'Boss Dragon', thumbnailUrl: `${BASE_POKE_URL}/6.png` },
])

const filteredItems = computed(() => {
  if (!searchQuery.value) return items.value
  return items.value.filter(i => i.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

// --- Logic ---
const toggleView = () => { viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid' }

const handleSelect = (item) => { 
  selectedId.value = item.id
  // closeMenu() -> Optional, biasanya click kiri menutup menu secara natural
}

// --- Context Menu System ---
const handleContextMenu = (e, item) => {
  if (item) selectedId.value = item.id
  
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

  // 1. Menu untuk Item Prefab
  if (targetItem) {
    return [
      { 
        label: targetItem.name, 
        disabled: true 
      },
      { separator: true },
      { 
        label: 'Instantiate', 
        icon: PlusSquare, 
        action: () => console.log('Instantiate', targetItem.name) 
      },
      { 
        label: 'Open Prefab', 
        icon: Edit3, 
        action: () => console.log('Edit', targetItem.name) 
      },
      { separator: true },
      { 
        label: 'Duplicate', 
        icon: Copy, 
        action: () => console.log('Duplicate', targetItem.name) 
      },
      { 
        label: 'Delete', 
        icon: Trash2, 
        shortcut: 'Del',
        action: () => console.log('Delete', targetItem.name) 
      }
    ]
  }

  // 2. Menu untuk Area Kosong (Library Actions)
  return [
    { 
      label: 'Create New Prefab', 
      icon: Box, 
      action: () => console.log('Create Empty Prefab') 
    },
    { 
      label: 'Create from Selection', 
      icon: Layers, 
      disabled: true // Simulasi jika tidak ada selection di scene
    },
    { separator: true },
    { 
      label: 'Refresh Library', 
      icon: RefreshCw, 
      shortcut: 'F5',
      action: () => console.log('Refresh Lib') 
    }
  ]
})
</script>