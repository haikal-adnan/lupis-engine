<script setup>
import SceneNode from './SceneNode.vue';

const props = defineProps({
  data: { type: Array, default: () => [] },
  selectedId: String
});

defineEmits(['select']);
</script>

<template>
  <div class="py-1">
    <div v-if="!data || data.length === 0" class="px-4 py-8 text-center">
      <div class="text-2xl mb-2 opacity-20">🧊</div>
      <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Scene is empty</p>
      <p class="text-[9px] text-muted-foreground/60 mt-1">Right-click to add Entity</p>
    </div>

    <SceneNode 
      v-else
      v-for="node in data" 
      :key="node.id" 
      :node="node" 
      :selectedId="selectedId"
      @select="$emit('select', $event)"
    />
  </div>
</template>