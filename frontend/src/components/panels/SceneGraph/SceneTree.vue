<script setup>
import { computed } from 'vue';
import SceneNode from './SceneNode.vue';

const props = defineProps({
  data: { type: Array, default: () => [] }, // Flat array dari backend
  selectedId: String
});

defineEmits(['select']);

// Transformasi Flat Array -> Nested Tree
const nestedEntities = computed(() => {
  if (!props.data || props.data.length === 0) return [];

  const map = {};
  const roots = [];

  // 1. Buat Map dan inisialisasi array children
  props.data.forEach(entity => {
    // Clone object agar tidak memutasi prop asli
    map[entity.id] = { ...entity, children: [] };
  });

  // 2. Susun relasi Parent-Child
  props.data.forEach(entity => {
    const node = map[entity.id];
    // Jika punya parentId dan parentnya ada di list
    if (entity.parentId && map[entity.parentId]) {
      map[entity.parentId].children.push(node);
    } else {
      // Jika tidak punya parent, berarti root
      roots.push(node);
    }
  });

  return roots;
});
</script>

<template>
  <div class="py-1">
    <div v-if="!nestedEntities || nestedEntities.length === 0" class="px-4 py-8 text-center">
      <div class="text-2xl mb-2 opacity-20">🧊</div>
      <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Scene is empty</p>
      <p class="text-[9px] text-muted-foreground/60 mt-1">Right-click to add Entity</p>
    </div>

    <SceneNode 
      v-else
      v-for="node in nestedEntities" 
      :key="node.id" 
      :node="node" 
      :selectedId="selectedId"
      @select="$emit('select', $event)"
    />
  </div>
</template>