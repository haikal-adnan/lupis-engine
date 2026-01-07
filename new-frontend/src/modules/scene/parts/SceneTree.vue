<template>
  <div 
    class="flex flex-col h-full w-full relative outline-none pb-10"
    @dragover.prevent="allowDrop"
    @dragenter.prevent="allowDrop"
    @drop.prevent
  >
    <SceneNode 
      v-for="node in data" 
      :key="node.id || node._id" 
      :node="node" 
      :selected-ids="selectedIds"
      @select="$emit('select', $event)"
      @contextmenu="$emit('contextmenu', $event)"
      @node-drop="handleDrop"
    />
    
    <div 
      class="flex-1 min-h-[50px] w-full"
      @click.self="$emit('select', [])"
      @contextmenu.prevent="$emit('contextmenu', { event: $event, node: null })"
    ></div>
  </div>
</template>

<script setup>
import SceneNode from './SceneNode.vue';

defineProps({
  data: { type: Array, default: () => [] },
  selectedIds: { type: Array, default: () => [] }
});

const emit = defineEmits(['select', 'contextmenu', 'drop']);

const handleDrop = (payload) => {
  emit('drop', payload);
};

const allowDrop = (e) => {
  e.dataTransfer.dropEffect = 'move';
};
</script>