<template>
  <div 
    class="flex flex-col h-full bg-background select-none" 
    @click="closeMenu"
    data-testid="hierarchy-container"
    :data-selected-count="sceneStore.selectedEntityIds.length"
  >
    <HierarchyToolbar 
      v-model="searchQuery" 
      :is-refreshing="isRefreshing"
      @add-layer="handlers.addLayer"
      @refresh="handlers.refresh"
    />

    <div
      class="flex-1 min-h-0 relative w-full"
      data-section="tree-viewport"
      data-testid="hierarchy-tree-viewport"
    >
      <ScrollArea orientation="both">
        <div class="px-1 pt-2 pb-32 min-w-max w-full"> 
          <!-- data-testid intentionally NOT attached here: would override SceneTree root testid -->
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
import { usePrompt, useClipboard } from '@composables/composables.js'
import { bus } from '@core/Util/EventBus.js'

import { 
  BaseContextMenu,
  ScrollArea
} from "@components/components.js";

import { 
  useHierarchyLogic,
  useHierarchyFilter,
  useHierarchyMenu,
  HierarchyToolbar,
  SceneTree,
  useSceneStore
} from '@scenes/scenes.js'

import { engineBridge } from "@engines/engines.js";
import { usePrefabActions } from '@prefabs/prefabs.js';

const sceneStore = useSceneStore()
const { prompt } = usePrompt() 
const { treeData, moveEntity } = useHierarchyLogic()
const { searchQuery, filteredData } = useHierarchyFilter(treeData)
const { copy, cut, paste, duplicate, remove } = useClipboard()

const { createPrefab, linkPrefabToEntities } = usePrefabActions()

const isRefreshing = ref(false)

const handlers = {
  addLayer: async () => {
    const name = await prompt({ title: 'New Layer', message: 'Enter layer name:', defaultValue: 'New Layer', confirmText: 'Create' })
    if (name) sceneStore.addLayer(name)
  },
  renameLayer: async (layerId) => {
    const layer = sceneStore.activeLayers.find(l => l.id === layerId)
    if (!layer) return
    const newName = await prompt({ title: 'Rename Layer', defaultValue: layer.scriptId, confirmText: 'Rename' })
    if (newName?.trim()) sceneStore.updateLayerScriptId(layerId, newName)
  },
  changeZIndex: async (layerId) => {
    const layer = sceneStore.activeLayers.find(l => l.id === layerId)
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
    const entity = sceneStore.activeEntities.find(e => e.id === entityId)
    if (!entity) return
    const title = 'Rename Entity'
    const newName = await prompt({ title, defaultValue: entity.scriptId, confirmText: 'Rename' })
    if (newName?.trim()) sceneStore.updateEntityScriptId(entityId, newName)
  },
  
  useAsPrefab: async (entityId) => {
    const entity = sceneStore.activeScene.entities.find(e => e.id === entityId)
    if (!entity) return
    
    const prefabName = await prompt({ 
      title: 'Create Prefab', 
      message: 'Enter name for the new prefab:', 
      defaultValue: `${entity.scriptId}_Prefab`, 
      confirmText: 'Create' 
    })

    if (prefabName?.trim()) {
      const newPrefab = await createPrefab(
        prefabName.trim(), 
        null, 
        entity.type || 'world', 
        entity
      )
      
      if (newPrefab) {
        await linkPrefabToEntities(newPrefab.id, [entityId])
      }
    }
  },

  refresh: () => { isRefreshing.value = true; setTimeout(() => (isRefreshing.value = false), 300) }
}

const { contextMenu, openMenu, closeMenu } = useHierarchyMenu(handlers)

const handleSelect = (payload) => {
  const nodeId = typeof payload === 'object' && payload.id ? payload.id : payload;
  const event = typeof payload === 'object' ? payload.event : null;
  
  const isLayer = sceneStore.activeLayers.some(l => l.id === nodeId);

  if (isLayer) {
    sceneStore.selectedEntityIds = [nodeId]; 
    
    engineBridge.clearSelection(); 
    engineBridge.selectEntity([nodeId]); 
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
  engineBridge.selectEntity(newSelection);
}

const onExternalSelect = (entities) => {
  if (!entities || entities.length === 0) {
    sceneStore.selectedEntityIds = []
    return
  }
  const ids = entities.map(e => e.id)
  const isSame = ids.length === sceneStore.selectedEntityIds.length &&
                 ids.every(id => sceneStore.selectedEntityIds.includes(id))
  if (!isSame) {
    sceneStore.selectedEntityIds = ids
  }
}

const onExternalDeselect = () => {
  if (sceneStore.selectedEntityIds.length === 0) return;
  const currentId = sceneStore.selectedEntityIds[0];
  const entity = sceneStore.activeEntities.find(e => e.id === currentId);
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
        ids.push(child.id);
        ids = [...ids, ...getAllDescendantIds(child.id, allEntities)];
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
  if (node && !sceneStore.selectedEntityIds.includes(node.id)) {
    handleSelect(node.id)
  }
  openMenu(event, node)
}

const handleDrop = ({ draggedId, targetNode, position }) => {
  moveEntity(draggedId, targetNode, position)
}
</script>
