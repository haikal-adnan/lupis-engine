<script setup>
import { ref } from 'vue';

const props = defineProps({
  node: Object,
  depth: { type: Number, default: 0 },
  selectedId: String
});

const emit = defineEmits(['select']);
const isOpen = ref(true);

const toggle = () => {
  if (props.node.children && props.node.children.length) {
    isOpen.value = !isOpen.value;
  }
};
</script>

<template>
  <div>
    <div 
      class="flex items-center py-1 px-2 cursor-pointer hover:bg-accent/20 group transition-colors text-xs"
      :class="{ 'bg-primary/10 text-primary font-medium': selectedId === node.id }"
      :style="{ paddingLeft: `${(depth * 12) + 8}px` }"
      @click="emit('select', node.id)"
    >
      <span class="w-4 flex justify-center shrink-0" @click.stop="toggle">
        <svg v-if="node.children?.length" 
             xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" 
             stroke="currentColor" stroke-width="3" 
             class="transition-transform" :class="{ '-rotate-90': !isOpen }">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </span>

      <span class="mr-1.5 opacity-70">
        <template v-if="node.type === 'folder'">📁</template>
        <template v-else-if="node.type === 'character'">👤</template>
        <template v-else-if="node.type === 'camera'">📷</template>
        <template v-else>🔸</template>
      </span>

      <span class="truncate">{{ node.name }}</span>
    </div>

    <div v-if="isOpen && node.children?.length">
      <SceneNode 
        v-for="child in node.children" 
        :key="child.id" 
        :node="child" 
        :depth="depth + 1"
        :selectedId="selectedId"
        @select="emit('select', $event)"
      />
    </div>
  </div>
</template>