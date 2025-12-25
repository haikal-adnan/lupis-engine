<script setup>
import { computed } from 'vue';
import SceneNode from './SceneNode.vue';

const props = defineProps({
  data: { type: Array, default: () => [] },
  selectedIds: { type: Array, default: () => [] } // Ubah jadi Array
});

const emit = defineEmits(['select']);

// Transformasi Data ke Tree
const nestedEntities = computed(() => {
  if (!props.data || !props.data.length) return [];
  const map = {};
  const roots = [];

  props.data.forEach(e => {
    const id = e._id || e.id;
    if (!id) return;
    map[id] = { ...e, id, children: [] };
  });

  props.data.forEach(e => {
    const id = e._id || e.id;
    const node = map[id];
    if (!node) return;
    
    if (e.parentId && map[e.parentId]) {
      map[e.parentId].children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
});

// --- RECURSIVE HELPER ---
// Mengumpulkan semua ID (Self + Descendants)
const collectIds = (node, result = []) => {
  result.push(node.id);
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => collectIds(child, result));
  }
  return result;
};

// Mencari Node di dalam Tree yang sudah computed
const findNode = (nodes, id) => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

// Handler Klik
const handleSelect = (clickedId) => {
  const targetNode = findNode(nestedEntities.value, clickedId);
  
  if (targetNode) {
    // Kumpulkan ID dari node ini dan semua anaknya
    const allIds = collectIds(targetNode);
    emit('select', allIds); // Emit Array of IDs
  } else {
    emit('select', [clickedId]);
  }
};
</script>

<template>
  <div class="py-1">
    <div v-if="!nestedEntities || nestedEntities.length === 0" class="px-4 py-8 text-center select-none">
      <div class="text-2xl mb-2 opacity-20">🧊</div>
      <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Scene is empty</p>
    </div>

    <SceneNode 
      v-else
      v-for="node in nestedEntities" 
      :key="node.id" 
      :node="node" 
      :selectedIds="selectedIds"
      @select="handleSelect" 
    />
  </div>
</template>