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
            :selected-ids="sceneStore.selectedEntityIds"
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useSceneStore } from '@/stores/scene/useSceneStore.js'
import { useEditorStore } from '@/stores/useEditorStore.js'
import { usePrompt } from '@/composables/usePrompt'

import { EngineBridge } from '@/services/engine/EngineBridge.js'
import { bus } from '@engines/Util/EventBus.js'

import BaseContextMenu from '@ui/overlay/BaseContextMenu.vue'
import ScrollArea from '@ui/overlay/ScrollArea.vue'
import HierarchyToolbar from './parts/HierarchyToolbar.vue'
import SceneTree from './parts/SceneTree.vue'

import { useHierarchyLogic } from '@/modules/scene/composables/useHierarchyLogic.js'
import { useHierarchyFilter } from '@/modules/scene/composables/useHierarchyFilter.js'
import { useHierarchyMenu } from '@/modules/scene/composables/useHierarchyMenu.js'

const sceneStore = useSceneStore()
const editorStore = useEditorStore()
const { prompt } = usePrompt() 

const { treeData, moveEntity } = useHierarchyLogic()
const { searchQuery, filteredData } = useHierarchyFilter(treeData)

const isRefreshing = ref(false)

const handlers = {
  addLayer: async () => {
    const name = await prompt({ title: 'New Layer', message: 'Enter layer name:', defaultValue: 'New Layer', confirmText: 'Create' })
    if (name) sceneStore.addLayer(name)
  },
  renameLayer: async (layerId) => {
    const layer = sceneStore.activeLayers.find(l => l._id === layerId)
    if (!layer) return
    const newName = await prompt({ title: 'Rename Layer', defaultValue: layer.name, confirmText: 'Rename' })
    if (newName?.trim()) sceneStore.updateLayerName(layerId, newName)
  },
  createEntity: (type, contextNode) => sceneStore.createEntity(type, contextNode),
  renameEntity: async (entityId) => {
    const entity = sceneStore.activeEntities.find(e => e._id === entityId)
    if (!entity) return
    const title = entity.type === 'group' ? 'Rename Group' : 'Rename Entity'
    const newName = await prompt({ title, defaultValue: entity.name, confirmText: 'Rename' })
    if (newName?.trim()) sceneStore.updateEntityName(entityId, newName)
  },
  deleteLayer: async (layerId) => { if (confirm('Delete layer?')) sceneStore.deleteLayer(layerId) },
  deleteEntity: (entityId) => sceneStore.deleteEntity(entityId),
  duplicateEntity: (entityId) => sceneStore.duplicateEntity(entityId),
  refresh: () => { isRefreshing.value = true; setTimeout(() => (isRefreshing.value = false), 300) }
}

const { contextMenu, openMenu, closeMenu } = useHierarchyMenu(handlers)

const handleSelect = (idOrIds) => {
  const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds]
  sceneStore.selectedEntityIds = ids
  
  if (EngineBridge.engineInstance) {
    EngineBridge.engineInstance.bus.emit('ui:select-by-id', ids)
  } else {
    bus.emit('ui:select-by-id', ids)
  }
}

const onExternalSelect = (entities) => {
  if (!entities || entities.length === 0) {
    sceneStore.selectedEntityIds = []
    return
  }
  const ids = entities.map(e => e.id || e._id)
  
  // Cek apakah ID-nya sama persis untuk menghindari loop re-render
  const isSame = ids.length === sceneStore.selectedEntityIds.length &&
                 ids.every(id => sceneStore.selectedEntityIds.includes(id))
  
  if (!isSame) {
    sceneStore.selectedEntityIds = ids
  }
}

const onExternalDeselect = () => {
  if (sceneStore.selectedEntityIds.length === 0) return;

  const currentId = sceneStore.selectedEntityIds[0];
  const entity = sceneStore.activeEntities.find(e => e._id === currentId);

  if (entity) {
    const isInactive = (entity.isActive === false) || (entity.isVisible === false);
    
    if (isInactive) {
      console.log(`[Hierarchy] Mencegah deselect untuk entity non-aktif: ${entity.name}`);
      return; 
    }
  }

  sceneStore.selectedEntityIds = [];
}

onMounted(() => {
  bus.on('entity:selected', onExternalSelect)
  bus.on('entity:deselected', onExternalDeselect)
  bus.on('entity:created', handlers.refresh)
})

onBeforeUnmount(() => {
  bus.off('entity:selected', onExternalSelect)
  bus.off('entity:deselected', onExternalDeselect)
  bus.off('entity:created', handlers.refresh)
})

const handleContextMenu = ({ event, node }) => {
  if (node && !sceneStore.selectedEntityIds.includes(node._id)) {
    handleSelect(node._id)
  }
  openMenu(event, node)
}

const handleDrop = ({ draggedId, targetNode, position }) => {
  moveEntity(draggedId, targetNode, position)
}
</script>