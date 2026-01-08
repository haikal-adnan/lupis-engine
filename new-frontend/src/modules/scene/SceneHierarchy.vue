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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useSceneStore } from '@/stores/scene/useSceneStore.js'
import { useEditorStore } from '@/stores/useEditorStore.js'
import { usePrompt } from '@/composables/usePrompt'
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

const selectedIds = ref([])
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

// --- SELECTION LOGIC ---

const findNodeRecursive = (nodes, id) => {
  for (const node of nodes) {
    if ((node._id || node.id) === id) return node
    if (node.children?.length) {
      const found = findNodeRecursive(node.children, id)
      if (found) return found
    }
  }
  return null
}

const findAllDescendantIds = (node) => {
  let ids = [node._id || node.id]
  if (node.children?.length) {
    for (const child of node.children) {
      ids = ids.concat(findAllDescendantIds(child))
    }
  }
  return ids
}

// Logika "Pintar" / Konsolidasi
const resolveParentSelection = (nodes, currentSelectedIds) => {
  const validIds = new Set(currentSelectedIds)
  
  const checkNode = (node) => {
    const nodeId = node._id || node.id
    
    // Recursive check ke bawah dulu
    let allKidsSelected = true
    let hasChildren = node.children && node.children.length > 0
    
    if (hasChildren) {
      for (const child of node.children) {
        const isChildSelected = checkNode(child)
        if (!isChildSelected) allKidsSelected = false
      }
    } else {
        allKidsSelected = false
    }

    if (hasChildren && allKidsSelected) {
      if (node.type === 'group') {
        if (!validIds.has(nodeId)) validIds.add(nodeId)
        return true 
      } 

      return validIds.has(nodeId)
    }

    return validIds.has(nodeId)
  }

  nodes.forEach(layer => checkNode(layer))
  return Array.from(validIds)
}

const handleSelect = (idOrIds) => {
  const inputIds = Array.isArray(idOrIds) ? idOrIds : [idOrIds]
  let newSelection = new Set() 

  inputIds.forEach(id => {
    const node = findNodeRecursive(treeData.value, id)
    if (node) {
       // PERBAIKAN: Selalu ambil semua descendants (Top-Down Logic)
       // Ini memastikan saat Parent Entity diklik, anak-anaknya ikut masuk seleksi awal.
       if(node.children && node.children.length > 0) {
           const allIds = findAllDescendantIds(node)
           allIds.forEach(i => newSelection.add(i))
       } else {
           newSelection.add(id)
       }
    } else {
       newSelection.add(id)
    }
  })


  const resolvedIds = resolveParentSelection(
    treeData.value,
    Array.from(newSelection)
  )

  selectedIds.value = resolvedIds
  sceneStore.selectedEntityIds = resolvedIds
  bus.emit('ui:select-by-id', resolvedIds)
}

const onExternalSelect = (entities) => {
  if (!entities || entities.length === 0) {
    selectedIds.value = []
    sceneStore.selectedEntityIds = []
    return
  }
  const ids = entities.map(e => e.id || e._id)
  selectedIds.value = ids
  sceneStore.selectedEntityIds = ids
}

const onExternalDeselect = () => {
  selectedIds.value = []
  sceneStore.selectedEntityIds = []
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
  if (node && !selectedIds.value.includes(node._id)) handleSelect(node._id)
  openMenu(event, node)
}

const handleDrop = ({ draggedId, targetNode, position }) => moveEntity(draggedId, targetNode, position)
</script>