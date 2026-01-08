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
        <button 
          @click.stop="navigateTo(null)"
          class="hover:text-foreground cursor-pointer transition-colors"
          :class="{ 'font-bold text-foreground': !currentFolder }"
        >
          Assets
        </button>
        <template v-if="currentFolder">
          <ChevronRight class="w-3 h-3 mx-1 opacity-50" />
          <span class="font-medium text-foreground">{{ currentFolder.name }}</span>
        </template>
      </div>

      <div class="flex-1"></div>

      <input 
        type="file" 
        ref="fileInput" 
        class="hidden" 
        multiple
        @change="handleFileUpload"
        accept="image/*,.fnt,.json,.ttf"
      />

      <BaseSearchInput v-model="searchQuery" placeholder="Search assets..." />

      <div class="w-px h-4 bg-border mx-1"></div>
      
      <button 
        @click.stop="triggerUpload"
        class="p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-md transition-colors"
        title="Import Asset"
      >
        <Plus class="w-4 h-4" />
      </button>
    </div>

    <div 
      class="flex-1 overflow-y-auto p-2" 
      @contextmenu.prevent
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      
      <div v-if="viewMode === 'grid'" class="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2">
        <AssetItem 
          v-for="folder in visibleFolders" 
          :key="folder._id" 
          :data="{ 
             id: folder._id, 
             name: folder.name, 
             type: 'folder', 
             isFolder: true 
          }" 
          view-mode="grid"
          :active="selectedId === folder._id"
          @click="handleSelect(folder._id)"
          @dblclick="navigateTo(folder)"
          @contextmenu="handleContextMenu($event, { ...folder, type: 'folder' })"
        />

        <AssetItem 
          v-for="asset in visibleAssets" 
          :key="asset._id" 
          :data="{
            id: asset._id,
            name: asset.name,
            type: asset.type,
            fileUrl: asset.fileUrl,
            meta: asset.meta,
            isSynced: asset.isSynced
          }"
          view-mode="grid"
          :active="selectedId === asset._id"
          @click="handleSelect(asset._id)"
          @contextmenu="handleContextMenu($event, { ...asset, type: 'asset' })"
        />
      </div>

      <div v-else class="flex flex-col gap-0.5">
         <AssetItem 
          v-for="folder in visibleFolders" 
          :key="folder._id" 
          :data="{ 
             id: folder._id, 
             name: folder.name, 
             type: 'folder', 
             isFolder: true 
          }" 
          view-mode="list"
          :active="selectedId === folder._id"
          @click="handleSelect(folder._id)"
          @dblclick="navigateTo(folder)"
          @contextmenu="handleContextMenu($event, { ...folder, type: 'folder' })"
        />

        <AssetItem 
          v-for="asset in visibleAssets" 
          :key="asset._id" 
          :data="{
            id: asset._id,
            name: asset.name,
            type: asset.type,
            fileUrl: asset.fileUrl,
            meta: asset.meta,
            isSynced: asset.isSynced
          }"
          view-mode="list"
          :active="selectedId === asset._id"
          @click="handleSelect(asset._id)"
          @contextmenu="handleContextMenu($event, { ...asset, type: 'asset' })"
        />
      </div>

      <div v-if="visibleFolders.length === 0 && visibleAssets.length === 0" class="h-full flex flex-col items-center justify-center text-muted-foreground/50">
        <div class="mb-2 opacity-50"><FolderPlus class="w-8 h-8" /></div>
        <span class="text-xs">This folder is empty.</span>
        <span class="text-[10px] mt-1">Right click to create or Drag files to upload.</span>
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
  Edit2, Copy, Trash2, FolderPlus, Download, RefreshCw 
} from 'lucide-vue-next'

// Logic Imports
import { useAssetStore } from '@/stores/useAssetStore'
import { useFolderStore } from '@/stores/useFolderStore'
import { useAssetActions } from '@/stores/scene/assetActions.js';

// Components
import BaseSearchInput from '@/commons/components/inputs/BaseSearchInput.vue'
import BaseContextMenu from '@/commons/components/overlay/BaseContextMenu.vue'
import AssetItem from './parts/AssetItem.vue'

// --- Stores & Actions ---
const assetStore = useAssetStore()
const folderStore = useFolderStore()
const { createNewFolder, importAsset, deleteAsset, deleteFolder } = useAssetActions()

// --- State ---
const viewMode = ref('grid')
const searchQuery = ref('')
const selectedId = ref(null)
const fileInput = ref(null)
const menu = ref({ visible: false, x: 0, y: 0, item: null })

// --- Computed Data ---
const currentFolderId = computed(() => folderStore.activeFolderId)
const currentFolder = computed(() => folderStore.getFolderById(currentFolderId.value))

// Filter Folders
const visibleFolders = computed(() => {
  let folders = folderStore.folders.filter(f => f.parentId === currentFolderId.value)
  if (searchQuery.value) {
    folders = folders.filter(f => f.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
  }
  return folders
})

// Filter Assets
const visibleAssets = computed(() => {
  let assets = assetStore.assets.filter(a => a.folderId === currentFolderId.value)
  if (searchQuery.value) {
    assets = assets.filter(a => a.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
  }
  return assets
})

// --- Logic Methods ---

const toggleViewMode = () => { viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid' }

const navigateTo = (folder) => {
  folderStore.setActiveFolder(folder ? folder._id : null)
  selectedId.value = null
  searchQuery.value = '' // Clear search on navigation
}

const handleSelect = (id) => { 
  selectedId.value = id 
}

const triggerUpload = () => { fileInput.value?.click() }

const handleFileUpload = async (e) => {
  const files = Array.from(e.target.files || [])
  for (const file of files) {
    await importAsset(file)
  }
  e.target.value = '' // Reset input agar bisa select file yang sama
}

const handleDrop = async (e) => {
  const files = Array.from(e.dataTransfer.files)
  for (const file of files) {
    await importAsset(file)
  }
}

// --- Context Menu Logic ---

const handleContextMenu = (e, item) => {
  if (item) selectedId.value = item.id || item._id
  
  menu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    item: item // null = background
  }
}

const closeMenu = () => {
  menu.value.visible = false
}

const contextMenuItems = computed(() => {
  const targetItem = menu.value.item

  // 1. Menu untuk Item (Asset / Folder)
  if (targetItem) {
    const isFolder = targetItem.type === 'folder'
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
        action: () => console.log('Rename Todo', targetItem) 
      },
      { separator: true },
      { 
        label: 'Delete', 
        icon: Trash2, 
        shortcut: 'Del',
        action: () => {
           if (isFolder) deleteFolder(targetItem.id || targetItem._id)
           else deleteAsset(targetItem.id || targetItem._id)
        }
      }
    ]
  }

  // 2. Menu Global (Klik Kanan di Background)
  return [
    { 
      label: 'New Folder', 
      icon: FolderPlus, 
      action: () => createNewFolder('New Folder') 
    },
    { 
      label: 'Import Assets...', 
      icon: Download, 
      action: triggerUpload 
    },
    { separator: true },
    { 
      label: 'Refresh', 
      icon: RefreshCw, 
      shortcut: 'F5',
      action: () => console.log('Refresh Logic') 
    }
  ]
})
</script>