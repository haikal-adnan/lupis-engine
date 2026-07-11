<template>
  <Teleport to="body">
    <Transition name="menu-scale" @after-leave="$emit('close')">
      <div
        v-if="visible"
        ref="menuRef"
        class="base-context-menu-fixed fixed min-w-[160px] max-w-[240px] p-1 bg-popover border border-border shadow-lg rounded-md flex flex-col gap-0.5 text-popover-foreground z-[9999] max-h-[85vh] overflow-y-auto overflow-x-hidden scrollbar-thin"
        :style="menuStyle"
        @contextmenu.prevent
        @mousedown.stop
        @click.stop
      >
        <template v-for="(item, index) in items" :key="index">
          <div v-if="item.separator" class="h-[1px] bg-border my-1 mx-1"></div>

          <div
            v-else
            class="relative flex items-center justify-between px-2 py-1.5 text-xs rounded-sm cursor-pointer select-none transition-colors"
            :class="[
              item.disabled ? 'pointer-events-none text-muted-foreground' : 'hover:bg-accent hover:text-accent-foreground',
              activeSubmenuIndex === index ? 'bg-accent text-accent-foreground' : ''
            ]"
            @click.stop="handleAction(item)"
            @mouseenter="onItemEnter(index, $event)"
            @mouseleave="onItemLeave(item)"
          >
            <div class="flex items-center gap-2">
              <component v-if="item.icon" :is="item.icon" class="w-3.5 h-3.5 opacity-70" />
              <span>{{ item.label }}</span>
            </div>

            <div class="flex items-center gap-3 ml-4">
              <span v-if="item.shortcut" class="text-[10px] text-muted-foreground font-mono tracking-wider">{{ item.shortcut }}</span>
              <ChevronRight v-if="item.children?.length" class="w-3.5 h-3.5 text-muted-foreground/70" />
            </div>

            <BaseContextMenu
              v-if="item.children?.length && activeSubmenuIndex === index"
              :items="item.children"
              :position="submenuPos" 
              @close="$emit('close')"
            />
          </div>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { ChevronRight } from 'lucide-vue-next';

defineOptions({ name: 'BaseContextMenu' });

const props = defineProps({
  position: { type: Object, default: null },
  items: { type: Array, default: () => [] }
});

const emit = defineEmits(['close']);
const menuRef = ref(null);

const visible = ref(false);
const coords = ref({ x: 0, y: 0 });

const activeSubmenuIndex = ref(null);
const submenuPos = ref({ x: 0, y: 0 });

watch(() => props.position, async (newPos) => {
  if (newPos) {
    coords.value = { x: newPos.x, y: newPos.y };
    visible.value = true;
    
    await nextTick();
    
    if (menuRef.value) {
      const rect = menuRef.value.getBoundingClientRect();
      const { innerWidth, innerHeight } = window;
      let { x, y } = newPos;

      if (x + rect.width > innerWidth) x -= rect.width; if (x < 0) x = 0;
      if (y + rect.height > innerHeight) y = innerHeight - rect.height - 10; if (y < 0) y = 0;

      coords.value = { x, y };
    }
  }
}, { immediate: true });

const menuStyle = computed(() => ({
  left: `${coords.value.x}px`,
  top: `${coords.value.y}px`
}));

const onItemEnter = (index, event) => {
  activeSubmenuIndex.value = index;
  const itemEl = event.currentTarget;
  const rect = itemEl.getBoundingClientRect();
  const { innerWidth } = window;

  let childX = rect.right; 
  let childY = rect.top - 4; 

  if (childX + 200 > innerWidth) {
    childX = rect.left - 200; 
  }
  submenuPos.value = { x: childX, y: childY };
};

const onItemLeave = (item) => {
  if (!item.children?.length) {
    activeSubmenuIndex.value = null;
  }
};

const handleAction = (item) => {
  if (item.disabled) return;
  if (item.action) item.action();
  if (!item.children?.length) emit('close');
};

const handleClickOutside = (event) => {
  if (event.target?.closest?.('.base-context-menu-fixed')) return;
  emit('close');
};

const handleScroll = (event) => {
  if (event.target?.closest?.('.base-context-menu-fixed')) return;
  
  emit('close');
};

const handleResize = () => {
  emit('close');
};

onMounted(() => {
  setTimeout(() => {
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
  }, 50);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  window.removeEventListener('scroll', handleScroll, true);
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.menu-scale-enter-active,
.menu-scale-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease-out;
}
.menu-scale-enter-from,
.menu-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.scrollbar-thin::-webkit-scrollbar {
  width: 5px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 20px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.8);
}
</style>