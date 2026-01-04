<template>
  <div 
    class="h-full flex flex-col bg-background text-foreground select-none"
    @click="closeMenu"
    @contextmenu.prevent="handleContextMenu($event, null)"
  >
    <div class="flex items-center gap-2 px-3 h-10 border-b border-border shrink-0">
      
      <button 
        @click.stop="toggleViewMode"
        class="p-1.5 rounded-md hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border/50"
        :title="viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'"
      >
        <component :is="viewMode === 'grid' ? List : LayoutGrid" class="w-4 h-4" />
      </button>

      <div class="w-px h-4 bg-border mx-1"></div>

      <div class="flex items-center text-xs text-muted-foreground overflow-hidden">
        <span class="hover:text-foreground cursor-pointer transition-colors">Assets</span>
        <ChevronRight class="w-3 h-3 mx-1 opacity-50" />
        <span class="font-medium text-foreground">RPG_Pack</span>
      </div>

      <div class="flex-1"></div>

      <BaseSearchInput v-model="searchQuery" placeholder="Search assets..." />

      <div class="w-px h-4 bg-border mx-1"></div>
      
      <button class="p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-md transition-colors">
        <Plus class="w-4 h-4" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-2" @contextmenu.prevent>
      
      <div v-if="viewMode === 'grid'" class="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2">
        <AssetItem 
          v-for="item in filteredItems" 
          :key="item.id" 
          :data="item" 
          view-mode="grid"
          :active="selectedId === item.id"
          @click.stop="handleSelect(item)"
          @dblclick="handleOpen"
          @contextmenu.prevent.stop="handleContextMenu($event, item)"
        />
      </div>

      <div v-else class="flex flex-col gap-0.5">
         <AssetItem 
          v-for="item in filteredItems" 
          :key="item.id" 
          :data="item" 
          view-mode="list"
          :active="selectedId === item.id"
          @click.stop="handleSelect(item)"
          @dblclick="handleOpen"
          @contextmenu.prevent.stop="handleContextMenu($event, item)"
        />
      </div>

      <div v-if="filteredItems.length === 0" class="h-full flex flex-col items-center justify-center text-muted-foreground/50">
        <span class="text-xs">Right click to create asset</span>
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
  LayoutGrid, List, ChevronRight, Plus, 
  Edit2, Copy, Trash2, FolderPlus, FilePlus, Download, RefreshCw 
} from 'lucide-vue-next'

// Atomic Components
import BaseSearchInput from '@/commons/components/inputs/BaseSearchInput.vue'
import BaseContextMenu from '@/commons/components/overlay/BaseContextMenu.vue'
import AssetItem from './parts/AssetItem.vue'

// --- State ---
const viewMode = ref('grid')
const searchQuery = ref('')
const selectedId = ref(null)
const menu = ref({ visible: false, x: 0, y: 0, item: null })

// --- Dummy Data ---
const BASE_IMG_URL = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items"
const items = ref([
  { id: '1', name: 'Characters', isFolder: true, itemType: 'folder' },
  { id: '2', name: 'Maps', isFolder: true, itemType: 'folder' },
  { id: '3', name: 'potion.png', itemType: 'image', thumbnailUrl: `${BASE_IMG_URL}/potion.png` },
  { id: '4', name: 'super-potion.png', itemType: 'image', thumbnailUrl: `${BASE_IMG_URL}/super-potion.png` },
])

const filteredItems = computed(() => {
  if (!searchQuery.value) return items.value
  return items.value.filter(i => i.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

// --- Logic Actions ---
const toggleViewMode = () => { viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid' }

const handleSelect = (item) => { 
  selectedId.value = item.id 
  // Jangan close menu disini jika ingin click kiri menutup menu secara global via handler @click di root div
}

const handleOpen = (item) => { console.log('Opening:', item.name) }

// --- Context Menu System ---

const handleContextMenu = (e, item) => {
  // Jika klik kanan pada item, pastikan item tersebut terseleksi
  if (item) selectedId.value = item.id
  
  menu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    item: item // Jika null = klik di area kosong (Global actions)
  }
}

const closeMenu = () => {
  menu.value.visible = false
}

// Generate Menu Items secara dinamis berdasarkan target klik
const contextMenuItems = computed(() => {
  const targetItem = menu.value.item

  // 1. Menu untuk Item (File/Folder)
  if (targetItem) {
    return [
      { 
        label: targetItem.name, 
        disabled: true, 
        icon: null 
      },
      { separator: true },
      { 
        label: 'Rename', 
        icon: Edit2, 
        shortcut: 'F2',
        action: () => console.log('Rename', targetItem.name) 
      },
      { 
        label: 'Copy Path', 
        icon: Copy, 
        action: () => console.log('Copy Path', targetItem.id) 
      },
      { separator: true },
      { 
        label: 'Delete', 
        icon: Trash2, 
        shortcut: 'Del',
        action: () => console.log('Delete', targetItem.name),
        // Bisa tambah styling khusus jika BaseContextMenu support text-color di masa depan
      }
    ]
  }

  // 2. Menu untuk Area Kosong (Global Actions)
  return [
    { 
      label: 'New Folder', 
      icon: FolderPlus, 
      action: () => console.log('Create Folder') 
    },
    { 
      label: 'New Script', 
      icon: FilePlus, 
      action: () => console.log('Create Script') 
    },
    { separator: true },
    { 
      label: 'Import Asset...', 
      icon: Download, 
      action: () => console.log('Trigger Import') 
    },
    { 
      label: 'Refresh', 
      icon: RefreshCw, 
      shortcut: 'F5',
      action: () => console.log('Refresh Assets') 
    }
  ]
})
</script>