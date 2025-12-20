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
      class="flex items-center py-1 px-2 cursor-pointer hover:bg-accent/20 group transition-colors text-xs select-none"
      :class="{ 'bg-primary/10 text-primary font-medium': selectedId === node.id }"
      :style="{ paddingLeft: `${(depth * 12) + 8}px` }"
      @click="emit('select', node.id)"
    >
      <span 
        class="w-4 flex justify-center shrink-0 mr-1" 
        @click.stop="toggle"
      >
        <svg v-if="node.children?.length" 
             xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" 
             stroke="currentColor" stroke-width="3" 
             class="transition-transform duration-200" 
             :class="{ '-rotate-90': !isOpen }">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </span>

      <span class="mr-2 opacity-70">
        <template v-if="node.type === 'group'">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
        </template>
        <template v-else>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>
        </template>
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