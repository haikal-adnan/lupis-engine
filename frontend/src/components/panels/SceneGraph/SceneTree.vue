<template>
  <div class="text-xs select-none font-sans pb-10">
    <ul class="space-y-[1px]">
      <SceneNode
        v-for="node in data"
        :key="node.id"
        :node="node"
        :level="0"
        :selectedId="selectedId"
        @select="$emit('select', $event)"
        @drag-start="handleDragStart"
        @drag-drop="handleDrop"
      />
    </ul>
  </div>
</template>

<script setup>
import SceneNode from './SceneNode.vue';

// Menerima data dari Parent (LeftPanel)
const props = defineProps({
  data: Array,
  selectedId: [String, Number]
});

const emit = defineEmits(['select', 'move-node']);

// --- DRAG & DROP HANDLERS ---
const handleDragStart = (nodeId) => {
    // Kita simpan ID node yang sedang ditarik di DataTransfer
    // Tapi karena Vue event handling, kita bisa pass lewat event emit juga
    // Untuk HTML5 DnD standar, kita set di SceneNode.vue
};

const handleDrop = (payload) => {
    const { draggedId, targetId } = payload;
    
    // Prevent dropping to self
    if (draggedId === targetId) return;

    // Emit ke LeftPanel untuk memproses perpindahan data
    emit('move-node', { draggedId, targetId });
};
</script>