<template>
  <div 
    class="relative h-full flex flex-col bg-background text-foreground select-none overflow-hidden"
    @click="closeMenu"
    @contextmenu.prevent="handleContextMenu($event, null)"
    tabindex="0"
  >
    <div 
      v-if="isUploading" 
      class="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm cursor-wait transition-opacity"
      style="pointer-events: all;"
      @click.stop
      @contextmenu.stop
      @drop.prevent
      @dragover.prevent
    >
      <svg class="animate-spin h-10 w-10 text-white mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span class="text-sm font-semibold text-white animate-pulse tracking-wide">Processing Asset...</span>
    </div>

    <div class="flex items-center gap-2 px-3 h-10 border-b border-border shrink-0">
      <button 
        @click.stop="toggleViewMode"
        class="p-1.5 rounded-md hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border/50"
        :title="viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'"
      >
        <component :is="viewMode === 'grid' ? List : LayoutGrid" class="w-4 h-4" />
      </button>

      <div class="w-px h-4 bg-border mx-1"></div>

      <div class="flex items-center text-xs text-muted-foreground overflow-x-auto whitespace-nowrap hide-scrollbar">
        <button 
          @click.stop="navigateTo(null)"
          @dragover.prevent="dragOverBreadcrumb = 'root'"
          @dragleave.prevent="dragOverBreadcrumb = null"
          @drop.prevent="handleBreadcrumbDrop($event, null)"
          class="hover:text-foreground cursor-pointer transition-colors shrink-0 px-1 py-0.5 rounded"
          :class="{ 
            'font-bold text-foreground': !currentFolder,
            'bg-primary/20 text-primary ring-1 ring-primary': dragOverBreadcrumb === 'root'
          }"
        >
          Assets
        </button>

        <template v-for="(folder, index) in folderBreadcrumbs" :key="folder._id">
          <ChevronRight class="w-3 h-3 mx-1 opacity-50 shrink-0" />
          <button 
            @click.stop="navigateTo(folder)"
            @dragover.prevent="dragOverBreadcrumb = folder._id"
            @dragleave.prevent="dragOverBreadcrumb = null"
            @drop.prevent="handleBreadcrumbDrop($event, folder._id)"
            class="hover:text-foreground cursor-pointer transition-colors truncate max-w-[120px] px-1 py-0.5 rounded"
            :class="{ 
              'font-medium text-foreground': currentFolder && currentFolder._id === folder._id,
              'bg-primary/20 text-primary ring-1 ring-primary': dragOverBreadcrumb === folder._id
            }"
            :title="folder.name"
          >
            {{ folder.name }}
          </button>
        </template>
      </div>

      <div class="flex-1"></div>

      <input 
        type="file" 
        ref="fileInputRef" 
        class="hidden" 
        multiple
        @change="handleFileUpload"
        accept=".jpg,.jpeg,.png,.ttf,.wav,.mp3,.ogg"
        :disabled="isUploading"
      />

      <BaseSearchInput v-model="searchQuery" placeholder="Search assets..." :disabled="isUploading" />

      <div class="w-px h-4 bg-border mx-1"></div>
      
      <button 
        @click.stop="triggerUpload"
        class="p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-md transition-colors"
        :class="{ 'opacity-50 cursor-not-allowed': isUploading }"
        :disabled="isUploading"
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
      <div :class="viewMode === 'grid' ? 'grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2' : 'flex flex-col gap-0.5'">
        
        <AssetItem 
          v-for="folder in visibleFolders" 
          :key="folder._id" 
          :data="{ 
             id: folder._id, 
             name: folder.name, 
             type: 'folder', 
             isFolder: true,
             parentId: folder.parentId
          }" 
          :view-mode="viewMode"
          :active="selectedId === folder._id"
          :is-cut="clipboard?.action === 'cut' && clipboard?.item?.id === folder._id"
          @click="handleSelect(folder._id)"
          @dblclick="navigateTo(folder)"
          @contextmenu="handleContextMenu($event, { ...folder, type: 'folder' })"
          @move-asset="({ id, type, targetFolderId }) => moveItem(id, type, targetFolderId)" 
        />

        <AssetItem 
          v-for="asset in visibleAssets" 
          :key="asset._id" 
          :data="{
            id: asset._id,
            name: asset.displayName || asset.name, 
            type: asset.type,
            fileKey: asset.fileKey,
            meta: asset.meta,
            isSynced: asset.isSynced,
            folderId: asset.folderId
          }"
          :view-mode="viewMode"
          :active="selectedId === asset._id"
          :is-cut="clipboard?.action === 'cut' && clipboard?.item?.id === asset._id"
          @click="handleSelect(asset._id)"
          @dblclick="handleAssetDoubleClick(asset)"
          @contextmenu="handleContextMenu($event, { ...asset, name: asset.displayName || asset.name })" 
          @move-asset="({ id, type, targetFolderId }) => moveItem(id, type, targetFolderId)"
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { LayoutGrid, List, ChevronRight, Plus, FolderPlus } from 'lucide-vue-next'

import BaseSearchInput from '@/commons/components/inputs/BaseSearchInput.vue'
import BaseContextMenu from '@/commons/components/overlay/BaseContextMenu.vue'
import AssetItem from '@editors/assets/parts/AssetItem.vue'

import { useAssetLogic } from '@editors/assets/composables/useAssetLogic.js'
import { useAssetMenu } from '@editors/assets/composables/useAssetMenu.js'

const assetLogic = useAssetLogic()

const {
  isUploading,
  viewMode,
  searchQuery,
  selectedId,
  fileInputRef,
  currentFolder,
  visibleFolders,
  visibleAssets,
  toggleViewMode,
  navigateTo,
  handleSelect,
  triggerUpload,
  handleFileUpload,
  handleDrop,
  folderBreadcrumbs,
  moveItem,   
  handlePaste,  
  clipboard,
  handleAssetDoubleClick
} = assetLogic

const {
  menu,
  handleContextMenu,
  closeMenu,
  contextMenuItems
} = useAssetMenu(selectedId, triggerUpload, assetLogic)

const dragOverBreadcrumb = ref(null)

const handleBreadcrumbDrop = (e, targetFolderId) => {
  dragOverBreadcrumb.value = null 

  try {
    const dragData = e.dataTransfer.getData('application/json')
    if (dragData) {
      const { id, type, originalFolderId } = JSON.parse(dragData)
      
      if (id === targetFolderId) return
      
      if (originalFolderId !== targetFolderId) {
        moveItem(id, type, targetFolderId)
      }
    }
  } catch (err) {
    console.error("Drop ke breadcrumb gagal:", err)
  }
}

const handleKeyDown = (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  if (e.ctrlKey || e.metaKey) {
    switch(e.key.toLowerCase()) {
      case 'c':
        if (selectedId.value) {
          const item = visibleFolders.value.find(f => f._id === selectedId.value) || 
                       visibleAssets.value.find(a => a._id === selectedId.value)
          if (item) {
            clipboard.value = { 
              action: 'copy', 
              item: { id: item._id, type: item.isFolder || item.type === 'folder' ? 'folder' : 'asset' } 
            }
          }
        }
        break;
      case 'x':
        if (selectedId.value) {
          const item = visibleFolders.value.find(f => f._id === selectedId.value) || 
                       visibleAssets.value.find(a => a._id === selectedId.value)
          if (item) {
            clipboard.value = { 
              action: 'cut', 
              item: { id: item._id, type: item.isFolder || item.type === 'folder' ? 'folder' : 'asset' } 
            }
          }
        }
        break;
      case 'v':
        e.preventDefault();
        handlePaste();
        break;
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>