<template>
  <div class="flex flex-col h-full bg-background select-none" @click="closeMenu">
    
    <HierarchyToolbar 
      v-model="searchQuery" 
      :is-refreshing="isRefreshing"
      @add-layer="handleAddLayer"
      @refresh="handleRefresh"
    />

    <div class="flex-1 min-h-0 relative w-full">
      <ScrollArea>
        <div class="px-1 py-2">
          <SceneTree 
            :data="filteredData" 
            :selected-ids="selectedIds"
            @select="handleSelect"
            @contextmenu="handleContextMenu"
            @drop="handleDrop"
          />
        </div>
      </ScrollArea>
    </div>

    <BaseContextMenu 
      v-if="contextMenu.visible"
      :position="{ x: contextMenu.x, y: contextMenu.y }"
      :items="contextMenu.items"
      @close="closeMenu"
    />

  </div>
</template>

<script setup>
import { ref } from 'vue';

// --- Imports Atomic Components ---
import BaseContextMenu from '@ui/overlay/BaseContextMenu.vue';
import ScrollArea from '@ui/overlay/ScrollArea.vue'; // Menggunakan ScrollArea versi lama

// --- Imports Internal Parts ---
import HierarchyToolbar from './parts/HierarchyToolbar.vue';
import SceneTree from './parts/SceneTree.vue';

// --- Composables ---
import { useHierarchyLogic } from '@/modules/scene/composables/useHierarchyLogic.js';
import { useHierarchyFilter } from '@/modules/scene/composables/useHierarchyFilter.js';
import { useHierarchyMenu } from '@/modules/scene/composables/useHierarchyMenu.js';

// --- CORE LOGIC ---
const { treeData, moveEntity } = useHierarchyLogic();
const { searchQuery, filteredData } = useHierarchyFilter(treeData);

const selectedIds = ref([]);
const isRefreshing = ref(false);

const handleSelect = (idOrIds) => {
  selectedIds.value = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
};

const handleDrop = ({ draggedId, targetNode, position }) => {
  moveEntity(draggedId, targetNode, position);
};

const handleAddLayer = () => {
  console.log("Action: Add Layer");
};

const handleRefresh = () => {
  isRefreshing.value = true;
  setTimeout(() => isRefreshing.value = false, 500);
};

const { contextMenu, openMenu, closeMenu } = useHierarchyMenu({
  addLayer: handleAddLayer,
  refresh: handleRefresh,
  deleteEntity: (id) => console.log("Delete", id),
  createEntity: (type, parent) => console.log("Create", type, parent)
});

const handleContextMenu = ({ event, node }) => {
  if (node && !selectedIds.value.includes(node._id || node.id)) {
    handleSelect(node._id || node.id);
  }
  openMenu(event, node);
};
</script>