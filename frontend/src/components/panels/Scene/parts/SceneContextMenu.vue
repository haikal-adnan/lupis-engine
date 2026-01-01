<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { ChevronRight } from 'lucide-vue-next';

defineOptions({
  name: 'SceneContextMenu'
});

const props = defineProps({
  position: { type: Object, default: null }, // {x, y} hanya untuk Root Menu
  menuItems: { type: Array, default: () => [] }
});

const emit = defineEmits(['close']);
const menuRef = ref(null);

const handleClickOutside = (event) => {
  if (props.position && menuRef.value && !menuRef.value.contains(event.target)) {
    emit('close');
  }
};

onMounted(() => {
  if (props.position) {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('contextmenu', handleClickOutside);
  }
});

onUnmounted(() => {
  if (props.position) {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('contextmenu', handleClickOutside);
  }
});

const handleAction = (item) => {
  if (item.action) {
    item.action();
    emit('close');
  }
};

const rootStyle = computed(() => {
  if (props.position) {
    return {
      position: 'fixed',
      left: `${props.position.x}px`,
      top: `${props.position.y}px`,
      zIndex: 9999
    };
  }
  return {}; 
});
</script>

<template>
  <div 
    ref="menuRef"
    class="min-w-[180px] bg-background border border-border shadow-lg rounded-md p-1 flex flex-col gap-0.5"
    :class="{ 'fixed': position }"
    :style="rootStyle"
    @contextmenu.prevent
  >
    <template v-for="(item, index) in menuItems" :key="index">
      
      <div v-if="item.separator" class="h-[1px] bg-border my-1 mx-1"></div>

      <div 
        v-else 
        class="group/item relative flex items-center justify-between px-2 py-1.5 text-xs rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground select-none transition-colors"
        :class="{ 'pointer-events-none opacity-50': item.disabled }"
        @click.stop="handleAction(item)"
      >
        <div class="flex items-center gap-2">
          <component v-if="item.icon" :is="item.icon" class="w-3.5 h-3.5 opacity-70" />
          <span>{{ item.label }}</span>
        </div>

        <div class="flex items-center gap-2 ml-4">
          <span v-if="item.shortcut" class="text-[10px] text-muted-foreground font-mono">{{ item.shortcut }}</span>
          <ChevronRight v-if="item.children" class="w-3 h-3 opacity-50" />
        </div>

        <div 
          v-if="item.children && item.children.length > 0"
          class="hidden group-hover/item:block absolute left-full top-0 pl-1 -mt-1.5"
        >
          <SceneContextMenu 
            :menuItems="item.children" 
            @close="emit('close')" 
          />
        </div>

      </div>
    </template>
  </div>
</template>