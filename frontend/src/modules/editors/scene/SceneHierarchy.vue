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
        <div class="px-1 pt-2 pb-32"> 
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
import { usePrompt } from '@/composables/usePrompt'
import { bus } from '@engines/Util/EventBus.js'
import BaseContextMenu from '@ui/overlay/BaseContextMenu.vue'
import ScrollArea from '@ui/overlay/ScrollArea.vue'
import HierarchyToolbar from './parts/HierarchyToolbar.vue'
import SceneTree from './parts/SceneTree.vue'
import { useHierarchyLogic } from '@editors/scene/composables/useHierarchyLogic.js'
import { useHierarchyFilter } from '@editors/scene/composables/useHierarchyFilter.js'
import { useHierarchyMenu } from '@editors/scene/composables/useHierarchyMenu.js'
import { useClipboard } from '@/composables/useClipboard.js'
import { EngineBridge } from '@/services/engine/EngineBridge.js'

const sceneStore = useSceneStore()
const { prompt } = usePrompt() 
const { treeData, moveEntity } = useHierarchyLogic()
const { searchQuery, filteredData } = useHierarchyFilter(treeData)
const { copy, cut, paste, duplicate, remove } = useClipboard()

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
  changeZIndex: async (layerId) => {
    const layer = sceneStore.activeLayers.find(l => l._id === layerId)
    if (!layer) return
    const newZ = await prompt({ 
      title: 'Change Z-Index', 
      message: `Current Z-Index: ${layer.zIndex}`,
      defaultValue: layer.zIndex.toString(), 
      confirmText: 'Update',
    })
    if (newZ !== null && newZ !== undefined) {
       sceneStore.updateLayerZIndex(layerId, newZ)
    }
  },
  createEntity: (...args) => sceneStore.createEntity(...args),
  renameEntity: async (entityId) => {
    const entity = sceneStore.activeEntities.find(e => e._id === entityId)
    if (!entity) return
    const title = entity.type === 'group' ? 'Rename Group' : 'Rename Entity'
    const newName = await prompt({ title, defaultValue: entity.name, confirmText: 'Rename' })
    if (newName?.trim()) sceneStore.updateEntityName(entityId, newName)
  },
  refresh: () => { isRefreshing.value = true; setTimeout(() => (isRefreshing.value = false), 300) }
}

const { contextMenu, openMenu, closeMenu } = useHierarchyMenu(handlers)

const handleSelect = (payload) => {
  const nodeId = typeof payload === 'object' && payload.id ? payload.id : payload;
  const event = typeof payload === 'object' ? payload.event : null;
  
  const isLayer = sceneStore.activeLayers.some(l => l._id === nodeId);

  if (isLayer) {
    sceneStore.selectedEntityIds = [nodeId]; 
    
    EngineBridge.clearSelection(); 
    EngineBridge.selectEntity([nodeId]); 
    return;
  }

  const allEntities = sceneStore.activeEntities || []; 
  const descendantIds = getAllDescendantIds(nodeId, allEntities);
  const targetIds = [nodeId, ...descendantIds];
  
  let newSelection = [];
  if (event && (event.ctrlKey || event.metaKey)) {
    const currentSelection = [...sceneStore.selectedEntityIds];
    const isAlreadySelected = currentSelection.includes(nodeId);
    if (isAlreadySelected) {
      newSelection = currentSelection.filter(id => !targetIds.includes(id));
    } else {
      newSelection = [...new Set([...currentSelection, ...targetIds])];
    }
  } else {
    newSelection = targetIds;
  }

  sceneStore.selectedEntityIds = newSelection;
  EngineBridge.selectEntity(newSelection);
}

const onExternalSelect = (entities) => {
  if (!entities || entities.length === 0) {
    sceneStore.selectedEntityIds = []
    return
  }
  const ids = entities.map(e => e.id || e._id)
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
    const isInactive = (entity.active === false) || (entity.visible === false);
    if (isInactive) return; 
  }
  sceneStore.selectedEntityIds = [];
}

const getAllDescendantIds = (parentId, allEntities) => {
    let ids = [];
    const children = allEntities.filter(e => e.parentId === parentId);
    for (const child of children) {
        ids.push(child._id);
        ids = [...ids, ...getAllDescendantIds(child._id, allEntities)];
    }
    return ids;
};

const handleKeyDown = (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.ctrlKey || e.metaKey) {
    switch(e.key.toLowerCase()) {
      case 'c': copy(); break;
      case 'x': cut(); break;
      case 'v': paste(); break;
      case 'd': 
        e.preventDefault();
        duplicate();
        break;
    }
  } else if (e.key === 'Delete') {
      remove();
  }
}

onMounted(() => {
  bus.on('entity:selected', onExternalSelect)
  bus.on('entity:deselected', onExternalDeselect)
  bus.on('entity:created', handlers.refresh)
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  bus.off('entity:selected', onExternalSelect)
  bus.off('entity:deselected', onExternalDeselect)
  bus.off('entity:created', handlers.refresh)
  window.removeEventListener('keydown', handleKeyDown)
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