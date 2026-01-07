<template>
  <div class="flex flex-col h-full bg-background select-none" @click="closeMenu">
    <HierarchyToolbar 
      v-model="searchQuery" 
      :is-refreshing="isRefreshing"
      @add-layer="handlers.addLayer"
      @refresh="handlers.refresh"
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
import { ref } from 'vue'
import { useSceneStore } from '@/stores/scene/useSceneStore.js'

import BaseContextMenu from '@ui/overlay/BaseContextMenu.vue'
import ScrollArea from '@ui/overlay/ScrollArea.vue'
import HierarchyToolbar from './parts/HierarchyToolbar.vue'
import SceneTree from './parts/SceneTree.vue'

import { useHierarchyLogic } from '@/modules/scene/composables/useHierarchyLogic.js'
import { useHierarchyFilter } from '@/modules/scene/composables/useHierarchyFilter.js'
import { useHierarchyMenu } from '@/modules/scene/composables/useHierarchyMenu.js'

const sceneStore = useSceneStore()
const { treeData, moveEntity } = useHierarchyLogic()
const { searchQuery, filteredData } = useHierarchyFilter(treeData)

const selectedIds = ref([])
const isRefreshing = ref(false)

const handlers = {
  addLayer: () => {
    sceneStore.addLayer('New Layer')
  },

  deleteLayer: (layerId) => {
    if (confirm('Are you sure you want to delete this layer and all its content?')) {
      sceneStore.deleteLayer(layerId)
    }
  },

  createEntity: (type, contextNode) => {
    sceneStore.createEntity(type, contextNode)
  },

  deleteEntity: (entityId) => {
    sceneStore.deleteEntity(entityId)
  },

  refresh: () => {
    isRefreshing.value = true
    setTimeout(() => (isRefreshing.value = false), 300)
  }
}

const { contextMenu, openMenu, closeMenu } = useHierarchyMenu(handlers)

const handleSelect = (idOrIds) => {
  selectedIds.value = Array.isArray(idOrIds) ? idOrIds : [idOrIds]
  sceneStore.selectedEntityIds = selectedIds.value
}

const handleContextMenu = ({ event, node }) => {
  if (node && !selectedIds.value.includes(node._id)) {
    handleSelect(node._id)
  }
  openMenu(event, node)
}

const handleDrop = ({ draggedId, targetNode, position }) => {
  moveEntity(draggedId, targetNode, position)
}
</script>
