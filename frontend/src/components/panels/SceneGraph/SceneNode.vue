<template>
  <li>
    <div
      class="flex items-center gap-1 cursor-pointer select-none hover:bg-accent/50 rounded-sm px-1 py-0.5 transition-colors duration-200 group"
      :style="{ paddingLeft: `${level * 12}px` }"
      @click="toggle"
    >
      <div class="flex items-center justify-center w-4 h-4 shrink-0">
        <span v-if="hasChildren" class="text-muted-foreground group-hover:text-primary transition-colors">
            <svg v-if="isOpen" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </span>
      </div>

      <div class="flex items-center justify-center w-4 h-4 mr-1 text-primary">
         <svg v-if="node.type === 'camera'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
         
         <svg v-else-if="node.type === 'mesh'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
         
         <svg v-else-if="node.type === 'folder'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
         
         <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>
      </div>

      <span class="text-primary truncate">{{ node.name }}</span>
    </div>

    <ul v-if="hasChildren && isOpen" class="mt-0.5 space-y-0.5">
      <SceneNode
        v-for="(child, index) in node.children"
        :key="index"
        :node="child"
        :level="level + 1"
      />
    </ul>
  </li>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  node: Object,
  level: { type: Number, default: 0 }
});

const isOpen = ref(true); // Default open agar terlihat semua hierarki

const hasChildren = computed(() => props.node.children && props.node.children.length > 0);

function toggle() {
  if (hasChildren.value) {
    isOpen.value = !isOpen.value;
  }
}
</script>