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
      class="flex-1 min-h-[50px] w-full transition-colors"
      :class="{ 'bg-blue-500/10': isDragOverEmpty }"
      @click.self="$emit('select', [])"
      @contextmenu.prevent="$emit('contextmenu', { event: $event, node: null })"
      @dragenter.prevent="isDragOverEmpty = true"
      @dragover.prevent="allowDrop"
      @dragleave.prevent="isDragOverEmpty = false"
      @drop.prevent="handleEmptyDrop"
    ></div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import SceneNode from './SceneNode.vue';

defineProps({
  data: { type: Array, default: () => [] },
  selectedIds: { type: Array, default: () => [] }
});

const emit = defineEmits(['select', 'contextmenu', 'drop']);
const isDragOverEmpty = ref(false); 

const handleDrop = (payload) => {
  emit('drop', payload);
};

const handleEmptyDrop = (e) => {
  isDragOverEmpty.value = false;
  const draggedId = e.dataTransfer.getData('nodeId');
  if (draggedId) {
    emit('drop', {
      draggedId,
      targetNode: null,
      position: 'root'
    });
  }
};

const allowDrop = (e) => {
  e.dataTransfer.dropEffect = 'move';
};
</script>