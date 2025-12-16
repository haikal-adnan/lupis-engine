<template>
  <li>
    <div
      class="group relative flex items-center h-7 cursor-pointer border border-transparent transition-all duration-75"
      :class="[
        isSelected ? 'bg-[#37373d] border-[#094771]' : 'hover:bg-[#2a2d2e] border-transparent text-gray-400 hover:text-gray-200',
        isDragOver ? 'bg-blue-500/20 border-blue-500' : '' 
      ]"
      :style="{ paddingLeft: `${level * 14 + 4}px` }"
      
      draggable="true"
      @click.stop="handleClick"
      @dragstart.stop="onDragStart"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop.stop="onDrop"
    >
      
      <div 
        class="w-4 h-4 flex items-center justify-center shrink-0 hover:text-white"
        @click.stop="toggleExpand"
      >
        <template v-if="hasChildren">
           <svg v-if="isOpen" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
           <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
        </template>
      </div>

      <div class="flex items-center gap-2 overflow-hidden">
        <span v-if="node.type === 'scene'" class="text-orange-400">🌐</span>
        <span v-else-if="node.type === 'folder'" class="text-yellow-500">📁</span>
        <span v-else-if="node.type === 'camera'" class="text-green-400">🎥</span>
        <span v-else-if="node.type === 'character'" class="text-pink-400">👤</span>
        <span v-else class="text-blue-400">🧊</span>
        
        <span class="truncate">{{ node.name }}</span>
      </div>

    </div>

    <ul v-if="hasChildren && isOpen" class="border-l border-gray-700 ml-[11px]">
      <SceneNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :selectedId="selectedId"
        @select="$emit('select', $event)"
        @drag-drop="$emit('drag-drop', $event)"
      />
    </ul>
  </li>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  node: Object,
  level: { type: Number, default: 0 },
  selectedId: [String, Number]
});

const emit = defineEmits(['select', 'drag-drop']);

const isOpen = ref(true);
const isDragOver = ref(false);

const hasChildren = computed(() => props.node.children && props.node.children.length > 0);
const isSelected = computed(() => props.node.id === props.selectedId);

function toggleExpand() {
  if (hasChildren.value) isOpen.value = !isOpen.value;
}

function handleClick() {
  emit('select', props.node.id);
}

// --- DRAG & DROP LOGIC ---

function onDragStart(event) {
    // Set data ID node yang sedang ditarik
    event.dataTransfer.dropEffect = 'move';
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('nodeId', props.node.id);
    // Tambahkan visual opacity sedikit
    event.target.style.opacity = '0.5';
}

function onDragOver(event) {
    // Izinkan drop (default browser behavior menolak drop)
    // Highlight target
    isDragOver.value = true;
}

function onDragLeave() {
    isDragOver.value = false;
}

function onDrop(event) {
    isDragOver.value = false;
    const draggedId = event.dataTransfer.getData('nodeId');
    const targetId = props.node.id;

    // Reset opacity elemen asal (agak tricky di framework, tapi browser biasanya handle reset saat drag end)
    // Emit event ke atas
    emit('drag-drop', { draggedId, targetId });
}

// Reset opacity when drag ends (global fix)
window.addEventListener('dragend', (e) => {
    e.target.style.opacity = '1';
});

</script>