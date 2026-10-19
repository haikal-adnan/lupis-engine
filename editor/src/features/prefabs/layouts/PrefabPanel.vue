<template>
  <div 
    ref="panelRef"
    class="relative h-full flex flex-col bg-background text-foreground select-none overflow-hidden"
    @click="handleBackgroundClick"
    @contextmenu.prevent="handleContextMenu($event, null)"
    tabindex="0"
    data-testid="prefab-panel"
    :data-section="`prefabs-${activeTab}`"
    :data-current-folder="currentFolderId || 'root'"
  >
    <div class="flex items-center gap-2 px-3 h-10 border-b border-border shrink-0">
      <button 
        @click.stop="toggleViewMode" 
        class="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
        :title="viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'"
        data-testid="toggle-view-mode-btn"
        :aria-label="viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'"
      >
        <component :is="viewMode === 'grid' ? List : LayoutGrid" class="w-4 h-4" />
      </button>

      <div class="w-px h-4 bg-border mx-1"></div>

      <div class="flex items-center text-xs text-muted-foreground overflow-x-auto whitespace-nowrap hide-scrollbar" data-testid="prefab-breadcrumbs">
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
          data-testid="breadcrumb-root"
        >
          <Box class="w-3.5 h-3.5 text-purple-500" />
          <span>Prefabs</span>
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
            data-testid="breadcrumb-item"
            :data-folder-id="folder.id"
          >
            {{ folder.name }}
          </button>
        </template>
      </div>

      <div class="flex-1"></div>

      <div class="flex bg-secondary/50 p-0.5 rounded-md h-7 shrink-0" data-testid="prefab-tabs">
        <button 
          @click="activeTab = 'world'"
          class="px-2 flex items-center justify-center text-[10px] rounded-sm transition-colors font-medium"
          :class="activeTab === 'world' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
          data-testid="tab-world"
          :aria-selected="activeTab === 'world'"
        >
          World
        </button>
        <button 
          @click="activeTab = 'ui'"
          class="px-2 flex items-center justify-center text-[10px] rounded-sm transition-colors font-medium"
          :class="activeTab === 'ui' ? 'bg-pink-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'"
          data-testid="tab-ui"
          :aria-selected="activeTab === 'ui'"
        >
          UI
        </button>
      </div>

      <BaseSearchInput 
        v-model="searchQuery" 
        placeholder="Search prefabs..." 
        input-test-id="search-prefab-input" 
      />
    </div>

    <div 
      class="flex-1 overflow-y-auto p-2 bg-background/50" 
      @contextmenu.prevent
      @dragover.prevent
      @drop.prevent="handleDrop"
      data-testid="prefab-content-area"
    >
      <div 
        :class="viewMode === 'grid' ? 'grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2' : 'flex flex-col gap-0.5'"
        data-testid="prefab-items-container"
        :data-view-mode="viewMode"
      >
        <PrefabItem 
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
          :is-cut="clipboard.action === 'cut' && clipboard.item.id === folder.id"
          @click="handleSelect(folder.id)"
          @dblclick="navigateTo(folder)"
          @contextmenu="handleContextMenu($event, { ...folder, type: 'folder', isFolder: true })"
          @move-item="({ id, type, targetFolderId }) => moveItem(id, type, targetFolderId)" 
        />

        <PrefabItem 
          v-for="prefab in visiblePrefabs" 
          :key="prefab.id" 
          :data="{
            id: prefab.id,
            scriptId: prefab.scriptId,
            type: prefab.type || prefab.data?.type || prefab.originalData?.type || 'world',
            thumbnailUrl: prefab.thumbnailUrl,
            folderId: prefab.folderId
          }"
          :view-mode="viewMode"
          :active="selectedId === prefab.id"
          :is-cut="clipboard.action === 'cut' && clipboard.item.id === prefab.id"
          @click="handleSelect(prefab.id)"
          @contextmenu="handleContextMenu($event, prefab)" 
          @move-item="({ id, type, targetFolderId }) => moveItem(id, type, targetFolderId)"
        />
      </div>

      <div v-if="visibleFolders.length === 0 && visiblePrefabs.length === 0" class="h-full flex flex-col items-center justify-center text-muted-foreground/50" data-testid="empty-prefab-state">
        <Box class="w-8 h-8 mb-2 opacity-20" />
        <span class="text-xs">No {{ activeTab }} prefabs or folders found.</span>
        <span class="text-[10px] mt-1">Right-click to create a new folder or prefab.</span>
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
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { LayoutGrid, List, Box, ChevronRight } from 'lucide-vue-next';

import {
  BaseSearchInput,
  BaseContextMenu,
} from '@components/components.js';

import { PrefabItem } from '@prefabs/prefabs.js';

import { useFolderStore } from '@folders/folders.js';
import { usePrefabLogic, usePrefabMenu } from '@prefabs/prefabs.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';

const workspaceStore = useWorkspaceStore();
const panelRef = ref(null);
const folderStore = useFolderStore();
const prefabLogic = usePrefabLogic();

const {
  viewMode,
  searchQuery,
  selectedId,
  activeTab,
  currentFolderId,
  currentFolder,
  folderBreadcrumbs,
  visibleFolders,
  visiblePrefabs,
  toggleViewMode,
  navigateTo,
  handleSelect,
  moveItem,
  handleDrop,
  handlePaste,
  clipboard
} = prefabLogic;

watch(activeTab, () => {
  folderStore.setActiveFolder(null);
  selectedId.value = null;
});

const {
  menu,
  handleContextMenu,
  closeMenu,
  contextMenuItems
} = usePrefabMenu(selectedId, activeTab, prefabLogic);

const dragOverBreadcrumb = ref(null);

const handleBreadcrumbDrop = (e, targetFolderId) => {
  dragOverBreadcrumb.value = null;

  const dragData = e.dataTransfer.getData('application/json');
  const { id, type, originalFolderId } = JSON.parse(dragData);
  
  if (id === targetFolderId) return;
  
  if (originalFolderId !== targetFolderId) {
    moveItem(id, type, targetFolderId);
  }
};

const handleBackgroundClick = (e) => {
  closeMenu();
  if (e.target === e.currentTarget || e.target.classList?.contains('overflow-y-auto') || !e.target.closest?.('[data-testid="prefab-item"], button, input')) {
    handleSelect(null);
  }
};

const handleKeyDown = (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  if (!workspaceStore.isBottomBarOpen || workspaceStore.activeBottomTabId !== 'prefabs') return;

  if (panelRef.value && !panelRef.value.contains(document.activeElement) && !panelRef.value.contains(e.target)) {
    return;
  }

  if (e.ctrlKey || e.metaKey) {
    switch(e.key.toLowerCase()) {
      case 'c':
        if (selectedId.value) {
          const item = visibleFolders.value.find(f => f.id === selectedId.value) || 
                       visiblePrefabs.value.find(p => p.id === selectedId.value);
          if (item) {
            clipboard.value = { 
              action: 'copy', 
              item: { id: item.id, type: item.isFolder || item.type === 'folder' ? 'folder' : 'prefab' } 
            };
          }
        }
        break;
      case 'x':
        if (selectedId.value) {
          const item = visibleFolders.value.find(f => f.id === selectedId.value) || 
                       visiblePrefabs.value.find(p => p.id === selectedId.value);
          if (item) {
            clipboard.value = { 
              action: 'cut', 
              item: { id: item.id, type: item.isFolder || item.type === 'folder' ? 'folder' : 'prefab' } 
            };
          }
        }
        break;
      case 'v':
        if (clipboard.value) {
          e.preventDefault();
          handlePaste();
        }
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