<script setup>
import { computed, ref, provide, watch } from 'vue';
import SceneNode from './SceneNode.vue';
import SceneContextMenu from './SceneContextMenu.vue'; 
import { useBackend } from '@/composables/useBackend.js';
import { bus } from '@engine/Util/EventBus.js';
import { 
  Trash2, Edit2, Copy, FolderPlus, Image, Type, Box, 
  Layers, Plus, Scissors, Clipboard, Minimize2, 
  Maximize, FilePlus, Cuboid 
} from 'lucide-vue-next';

const props = defineProps({
  data: { type: Array, default: () => [] },
  selectedIds: { type: Array, default: () => [] }
});

const emit = defineEmits(['select']);
const { projectData } = useBackend();
const contextMenu = ref({ visible: false, x: 0, y: 0, items: [] });
const draggedNode = ref(null);

const dragHoverState = ref({ targetId: null, position: null });
provide('dragHoverState', dragHoverState);

const resetDragState = () => {
  dragHoverState.value = { targetId: null, position: null };
};

const closeContextMenu = () => { contextMenu.value.visible = false; };

const handleSelect = (id) => {
  closeContextMenu(); 
  const ids = Array.isArray(id) ? id : [id];
  emit('select', ids);
};

watch(() => props.selectedIds, () => {
   closeContextMenu();
});

// ==========================================
// 🕰️ LOGIC LAMA: SORTING (Active)
// ==========================================
const sortByZ = (a, b) => {
    const zA = Number(a.transform?.zIndex ?? 0);
    const zB = Number(b.transform?.zIndex ?? 0);
    
    if (zA !== zB) return zA - zB;
    
    return String(a._id).localeCompare(String(b._id));
};

const treeData = computed(() => {
  if (!projectData.value || !props.data) return [];
  
  const map = {};
  props.data.forEach(e => {
    // [BRIDGE] Inject Type agar Menu Baru bekerja
    const nodeType = e.type || 'entity';

    if (!e.transform) e.transform = { zIndex: 0 };
    map[e._id] = { 
        ...e, 
        id: e._id, 
        type: nodeType, 
        children: [] 
    };
  });

  const layerBuckets = {};

  props.data.forEach(e => {
    const node = map[e._id];
    
    if (e.parentId === e._id) e.parentId = null; 

    if (e.parentId && map[e.parentId]) {
      map[e.parentId].children.push(node);
    } else {
      if (!layerBuckets[e.layerId]) layerBuckets[e.layerId] = [];
      layerBuckets[e.layerId].push(node);
    }
  });

  // LOGIC LAMA: Paksa Sorting Children
  Object.values(map).forEach(node => {
      if (node.children.length > 0) node.children.sort(sortByZ);
  });

  return (projectData.value.layers || []).map(layer => ({
    id: layer.id,
    name: layer.name,
    order: layer.order,
    isLayer: true,
    // LOGIC LAMA: Paksa Sorting Layer Content
    children: (layerBuckets[layer.id] || []).sort(sortByZ)
  })).sort((a, b) => a.order - b.order);
});

// ==========================================
// 🕰️ LOGIC LAMA: DRAG & DROP
// ==========================================
const handleDrop = (payload) => {
  if (payload.isHovering) {
      dragHoverState.value = { targetId: payload.targetId, position: payload.position };
      return;
  }

  const { draggedId, targetNode, isLayer, position } = payload;
  resetDragState();

  if (draggedId === targetNode.id) return;

  let newParentId = null;
  let newLayerId = targetNode.layerId;

  if (position === 'inside') {
      if (isLayer) {
        newParentId = null;
        newLayerId = targetNode.id;
      } else {
        newParentId = targetNode.id;
        newLayerId = targetNode.layerId;
      }
  } else {
      newParentId = targetNode.parentId || null;
      newLayerId = targetNode.layerId;
  }

  bus.emit('entity:update-hierarchy', {
    _id: draggedId,
    parentId: newParentId,
    layerId: newLayerId,
    reorderInfo: { targetId: targetNode.id, position }
  });
};

const handleRootHover = () => {
  const layers = treeData.value;
  if (layers.length === 0) return;
  dragHoverState.value = { targetId: layers[layers.length - 1].id, position: 'inside' };
};

const handleRootDrop = (e) => {
  e.preventDefault();
  resetDragState();
  const dataString = e.dataTransfer.getData('application/json');
  if (!dataString) return;
  const { id: draggedId } = JSON.parse(dataString);
  const layers = treeData.value;
  if (layers.length === 0) return;
  
  bus.emit('entity:update-hierarchy', {
    _id: draggedId,
    parentId: null,
    layerId: layers[layers.length - 1].id,
    reorderInfo: { position: 'bottom', targetId: null }
  });
};

// ==========================================
// ✨ LOGIC BARU: CONTEXT MENU
// ==========================================
const openContextMenu = ({ event, node, isLayer }) => {
  if (!props.selectedIds.includes(node.id)) {
      handleSelect(node.id);
  }

  const items = [];
  const createEntity = (subType) => {
      bus.emit('entity:create', { type: subType, parentId: isLayer ? null : node.id, layerId: isLayer ? node.id : node.layerId });
  };
  
  const menuCreateEntity = {
      label: 'Add Child Entity', icon: Plus,
      children: [
          { label: 'Create Empty', icon: Cuboid, action: () => createEntity('empty') },
          { label: 'Create Sprite', icon: Image, action: () => createEntity('sprite') },
          { label: 'Create Text', icon: Type, action: () => createEntity('text') },
          { label: 'Create Shape', icon: Box, action: () => createEntity('shape') }
      ]
  };
  const menuCreateGroup = { label: 'Add Child Group', icon: FolderPlus, action: () => createEntity('group') };

  if (isLayer) {
    items.push({ label: 'Rename Layer', icon: Edit2, action: () => bus.emit('layer:rename', node.id) });
    items.push({ label: 'Duplicate Layer', icon: Copy, action: () => bus.emit('layer:duplicate', node.id) });
    items.push({ label: 'Delete Layer', icon: Trash2, action: () => bus.emit('layer:delete', node.id) });
    items.push({ separator: true });
    items.push({ label: 'Add New Layer', icon: Layers, action: () => bus.emit('layer:create') });
    items.push({ separator: true });
    items.push({ label: 'Create Group', icon: FolderPlus, action: () => createEntity('group') });
    items.push({ ...menuCreateEntity, label: 'Create Entity' });
  } 
  else {
    const isGroup = node.type === 'group';
    if (isGroup) {
        items.push({ label: 'Rename Group', icon: Edit2, action: () => bus.emit('entity:rename', node.id) });
        items.push({ label: 'Duplicate Group', icon: FilePlus, action: () => bus.emit('entity:duplicate', node.id) });
        items.push({ label: 'Delete Group', icon: Trash2, action: () => bus.emit('entity:delete', node.id) });
        items.push({ separator: true });
        items.push({ label: 'Cut', icon: Scissors, action: () => bus.emit('clipboard:cut', node.id) });
        items.push({ label: 'Copy', icon: Copy, action: () => bus.emit('clipboard:copy', node.id) });
        items.push({ label: 'Paste', icon: Clipboard, action: () => bus.emit('clipboard:paste', node.id) });
        items.push({ separator: true });
        items.push(menuCreateGroup);
        items.push(menuCreateEntity);
        items.push({ separator: true });
        items.push({ label: 'Ungroup', icon: Minimize2, action: () => bus.emit('group:ungroup', node.id) });
    } 
    else {
        items.push({ label: 'Rename Entity', icon: Edit2, action: () => bus.emit('entity:rename', node.id) });
        items.push({ label: 'Duplicate Entity', icon: FilePlus, action: () => bus.emit('entity:duplicate', node.id) });
        items.push({ label: 'Delete Entity', icon: Trash2, action: () => bus.emit('entity:delete', node.id) });
        items.push({ separator: true });
        items.push({ label: 'Cut', icon: Scissors, action: () => bus.emit('clipboard:cut', node.id) });
        items.push({ label: 'Copy', icon: Copy, action: () => bus.emit('clipboard:copy', node.id) });
        items.push({ label: 'Paste', icon: Clipboard, action: () => bus.emit('clipboard:paste', node.id) });
        items.push({ separator: true });
        items.push(menuCreateGroup);
        items.push(menuCreateEntity);
        items.push({ separator: true });
        items.push({ label: 'Focus View', icon: Maximize, action: () => bus.emit('editor:focus', node.id) });
    }
  }

  setTimeout(() => {
    contextMenu.value = { visible: true, x: event.clientX, y: event.clientY, items };
  }, 0);
};
</script>

<template>
  <div class="flex flex-col h-full relative" 
       @mouseleave="resetDragState" 
       @dragend="resetDragState"
  >
    <div class="py-1">
      <SceneNode 
        v-for="layerNode in treeData" 
        :key="layerNode.id" 
        :node="layerNode" 
        :isLayer="true"
        :selectedIds="selectedIds"
        @select="handleSelect" 
        @contextmenu="openContextMenu"
        @drag-start="(n) => draggedNode = n"
        @drop-on="handleDrop"
      />
    </div>
    
    <div 
      class="flex-1 w-full min-h-[50px]"
      @dragover.prevent="handleRootHover"
      @drop="handleRootDrop"
    ></div>

    <SceneContextMenu 
      v-if="contextMenu.visible"
      :position="{ x: contextMenu.x, y: contextMenu.y }"
      :menuItems="contextMenu.items"
      @close="closeContextMenu"
    />
  </div>
</template>