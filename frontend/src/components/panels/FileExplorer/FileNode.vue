<script setup>
import { ref } from 'vue';

const props = defineProps({
  item: Object,
  depth: { type: Number, default: 0 }
});

const isOpen = ref(false);

const getIcon = (type) => {
  switch (type) {
    case 'folder': return '📁';
    case 'texture': return '🖼️';
    case 'script': return '📜';
    case 'sound': return '🔊';
    case 'font': return '🔤';
    default: return '📄';
  }
};

const toggle = () => {
  if (props.item.children?.length) {
    isOpen.value = !isOpen.value;
  }
}
</script>

<template>
  <div>
    <div 
      class="flex items-center py-1 px-2 cursor-pointer hover:bg-accent/20 text-[11px] text-muted-foreground hover:text-foreground select-none"
      :style="{ paddingLeft: `${(depth * 12) + 8}px` }"
      @click="toggle"
    >
      <span class="w-4 flex justify-center shrink-0 mr-1">
        <svg v-if="item.children?.length" 
             xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" 
             stroke="currentColor" stroke-width="3" 
             class="transition-transform duration-200"
             :class="{ '-rotate-90': !isOpen }">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </span>
      <span class="mr-2 text-xs">{{ getIcon(item.type) }}</span>
      <span class="truncate">{{ item.name }}{{ item.meta?.extension || '' }}</span>
    </div>

    <div v-if="isOpen && item.children?.length">
      <FileNode 
        v-for="child in item.children" 
        :key="child._id" 
        :item="child" 
        :depth="depth + 1"
      />
    </div>
  </div>
</template>