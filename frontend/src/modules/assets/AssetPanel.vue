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
        ref="fileInputRef" 
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
      <div :class="viewMode === 'grid' ? 'grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2' : 'flex flex-col gap-0.5'">
        
        <AssetItem 
          v-for="folder in visibleFolders" 
          :key="folder._id" 
          :data="{ 
             id: folder._id, 
             name: folder.name, 
             type: 'folder', 
             isFolder: true 
          }" 
          :view-mode="viewMode"
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
          :view-mode="viewMode"
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
import { LayoutGrid, List, ChevronRight, Plus, FolderPlus } from 'lucide-vue-next'

import BaseSearchInput from '@/commons/components/inputs/BaseSearchInput.vue'
import BaseContextMenu from '@/commons/components/overlay/BaseContextMenu.vue'
import AssetItem from '@/modules/assets/parts/AssetItem.vue'

// Import Refactored Logic
import { useAssetLogic } from '@/modules/assets/composables/useAssetLogic.js'
import { useAssetMenu } from '@/modules/assets/composables/useAssetMenu.js'

// Initialize Logic
const {
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
  handleDrop
} = useAssetLogic()

// Initialize Menu (Pass dependencies needed by menu)
const {
  menu,
  handleContextMenu,
  closeMenu,
  contextMenuItems
} = useAssetMenu(selectedId, triggerUpload)
</script>