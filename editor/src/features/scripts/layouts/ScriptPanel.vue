<template>
  <div 
    data-testid="script-panel"
    :data-view-mode="viewMode"
    class="relative h-full flex flex-col bg-background text-foreground select-none overflow-hidden"
    @click="closeMenu"
    @contextmenu.prevent="handleContextMenu($event, null)"
    tabindex="0"
  >
    <div class="flex items-center gap-2 px-3 h-10 border-b border-border shrink-0">
      <button 
        @click.stop="toggleViewMode" 
        class="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
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
          class="hover:text-foreground cursor-pointer transition-colors shrink-0 px-1 py-0.5 rounded flex items-center gap-1"
          :class="{ 
            'font-bold text-foreground': !currentFolder,
            'bg-primary/20 text-primary ring-1 ring-primary': dragOverBreadcrumb === 'root'
          }"
        >
          <FileCode2 class="w-3.5 h-3.5 text-blue-500" />
          <span>Scripts</span>
        </button>

        <template v-for="folder in folderBreadcrumbs" :key="folder.id">
          <ChevronRight class="w-3 h-3 mx-1 opacity-50 shrink-0" />
          <button 
            @click.stop="navigateTo(folder)"
            @dragover.prevent="dragOverBreadcrumb = folder.id"
            @dragleave.prevent="dragOverBreadcrumb = null"
            @drop.prevent="handleBreadcrumbDrop($event, folder.id)"
            class="hover:text-foreground cursor-pointer transition-colors truncate max-w-[120px] px-1 py-0.5 rounded"
            :class="{ 
              'font-medium text-foreground': currentFolder && currentFolder.id === folder.id,
              'bg-primary/20 text-primary ring-1 ring-primary': dragOverBreadcrumb === folder.id
            }"
            :title="folder.name"
          >
            {{ folder.name }}
          </button>
        </template>
      </div>

      <div class="flex-1"></div>

      <BaseSearchInput data-testid="search-script-input" v-model="searchQuery" placeholder="Search scripts..." />
      <button 
        data-testid="create-script-btn"
        @click.stop="createScript('component')" 
        class="p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-md transition-colors"
        title="New Script"
      >
        <Plus class="w-4 h-4" />
      </button>
    </div>

    <div 
      data-testid="script-container"
      :data-view-mode="viewMode"
      class="flex-1 overflow-y-auto p-2 bg-background/50" 
      @contextmenu.prevent
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <div :class="viewMode === 'grid' ? 'grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2' : 'flex flex-col gap-0.5'">
        
        <ScriptItem 
          v-for="folder in visibleFolders" 
          :key="folder.id" 
          :data="{ 
            id: folder.id, 
            name: folder.name, 
            type: 'folder', 
            isFolder: true,
            folderId: folder.parentId,
            parentId: folder.parentId
          }" 
          :view-mode="viewMode"
          :active="selectedId === folder.id"
          :is-cut="clipboard?.action === 'cut' && clipboard?.item?.id === folder.id"
          @click="handleSelect(folder.id)"
          @dblclick="navigateTo(folder)"
          @contextmenu="handleContextMenu($event, { ...folder, type: 'folder', isFolder: true })"
          @move-item="({ id, type, targetFolderId }) => moveItem(id, type, targetFolderId)" 
        />

        <ScriptItem 
          v-for="script in visibleScripts" 
          :key="script.id" 
          :data="{
            id: script.id,
            name: script.name,
            type: script.type || 'component',
            folderId: script.folderId,
            originalData: script.originalData || script
          }"
          :view-mode="viewMode"
          :active="selectedId === script.id"
          :is-cut="clipboard?.action === 'cut' && clipboard?.item?.id === script.id"
          @click="handleSelect(script.id)"
          @dblclick="handleOpenGraph(script)"
          @contextmenu="handleContextMenu($event, script)" 
          @move-item="({ id, type, targetFolderId }) => moveItem(id, type, targetFolderId)"
        />

      </div>

      <div v-if="visibleFolders.length === 0 && visibleScripts.length === 0" class="h-full flex flex-col items-center justify-center text-muted-foreground/50">
        <FileCode2 class="w-8 h-8 mb-2 opacity-20" />
        <span class="text-xs">No scripts or folders found.</span>
        <span class="text-[10px] mt-1">Right-click to create a new folder or script.</span>
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
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { LayoutGrid, List, FileCode2, ChevronRight, Plus } from 'lucide-vue-next';

import {
  BaseSearchInput,
  BaseContextMenu,
} from '@components/components.js';

import { ScriptItem, useScriptLogic, useScriptMenu } from '@scripts/scripts.js';

const scriptLogic = useScriptLogic();

const {
  viewMode,
  searchQuery,
  selectedId,
  currentFolder,
  folderBreadcrumbs,
  visibleFolders,
  visibleScripts,
  toggleViewMode,
  navigateTo,
  handleSelect,
  moveItem,
  handleDrop,
  handlePaste,
  handleOpenGraph,
  createScript,
  clipboard
} = scriptLogic;

const {
  menu,
  handleContextMenu,
  closeMenu,
  contextMenuItems
} = useScriptMenu(selectedId, scriptLogic);

const dragOverBreadcrumb = ref(null);

const handleBreadcrumbDrop = (e, targetFolderId) => {
  dragOverBreadcrumb.value = null;

  try {
    const dragData = e.dataTransfer.getData('application/json');
    if (dragData) {
      const { id, type, originalFolderId } = JSON.parse(dragData);
      if (id === targetFolderId) return;
      
      if (originalFolderId !== targetFolderId) {
        moveItem(id, type, targetFolderId);
      }
    }
  } catch (err) {
    console.error("Drop to breadcrumb failed:", err);
  }
};

const handleKeyDown = (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  if (e.ctrlKey || e.metaKey) {
    switch(e.key.toLowerCase()) {
      case 'c':
        if (selectedId.value) {
          const item = visibleFolders.value.find(f => f.id === selectedId.value) || 
                       visibleScripts.value.find(s => s.id === selectedId.value);
          if (item) {
            clipboard.value = { 
              action: 'copy', 
              item: { id: item.id, type: item.isFolder || item.type === 'folder' ? 'folder' : 'script' } 
            };
          }
        }
        break;
      case 'x':
        if (selectedId.value) {
          const item = visibleFolders.value.find(f => f.id === selectedId.value) || 
                       visibleScripts.value.find(s => s.id === selectedId.value);
          if (item) {
            clipboard.value = { 
              action: 'cut', 
              item: { id: item.id, type: item.isFolder || item.type === 'folder' ? 'folder' : 'script' } 
            };
          }
        }
        break;
      case 'v':
        e.preventDefault();
        handlePaste();
        break;
    }
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>