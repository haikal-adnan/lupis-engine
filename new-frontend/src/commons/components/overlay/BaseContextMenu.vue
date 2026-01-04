<template>
  <transition name="fade-scale" appear>
    <div
      v-if="isVisible"
      ref="menuRef"
      class="min-w-[160px] p-1 bg-popover border border-border shadow-lg rounded-md flex flex-col gap-0.5 text-popover-foreground z-[9999]"
      :class="[
        position ? 'fixed' : 'absolute left-full top-0 -ml-1',
      ]"
      :style="styleObject"
      @contextmenu.prevent
      @mousedown.stop
      @click.stop
    >
      <template v-for="(item, index) in items" :key="index">
        <div v-if="item.separator" class="h-[1px] bg-border my-1 mx-1"></div>

        <div
          v-else
          class="group/item relative flex items-center justify-between px-2 py-1.5 text-xs rounded-sm cursor-pointer select-none transition-colors"
          :class="[
            item.disabled
              ? 'pointer-events-none text-muted-foreground'
              : 'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
          ]"
          @click.stop="handleAction(item)"
        >
          <div class="flex items-center gap-2">
            <component
              v-if="item.icon"
              :is="item.icon"
              class="w-3.5 h-3.5 opacity-70 group-hover/item:opacity-100"
            />
            <span>{{ item.label }}</span>
          </div>

          <div class="flex items-center gap-3 ml-4">
            <span v-if="item.shortcut" class="text-[10px] text-muted-foreground font-mono tracking-wider">
              {{ item.shortcut }}
            </span>

            <ChevronRight 
              v-if="item.children && item.children.length > 0"
              class="w-3.5 h-3.5 text-muted-foreground/70" 
            />
          </div>

          <div
            v-if="item.children && item.children.length > 0"
            class="hidden group-hover/item:block absolute left-full top-0 pl-1"
          >
            <BaseContextMenu
              :items="item.children"
              @close="$emit('close')"
            />
          </div>
        </div>
      </template>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { ChevronRight } from 'lucide-vue-next';

defineOptions({
  name: 'BaseContextMenu'
});

const props = defineProps({
  position: { type: Object, default: null }, // { x, y } or null for submenu
  items: { type: Array, default: () => [] }
});

const emit = defineEmits(['close']);
const menuRef = ref(null);
// Kita gunakan state internal untuk transisi agar smooth saat unmount
const isVisible = ref(false); 

const styleObject = computed(() => {
  if (props.position) {
    return {
      left: `${props.position.x}px`,
      top: `${props.position.y}px`
    };
  }
  return { marginTop: '-0.25rem' };
});

const handleClickOutside = (event) => {
  // Cek apakah click terjadi di luar menu ini
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    emit('close');
  }
};

const handleAction = (item) => {
  if (item.disabled) return;

  if (item.action) {
    item.action();
  }

  // Hanya close jika tidak punya children (bukan submenu trigger)
  if (!item.children || item.children.length === 0) {
    emit('close');
  }
};

onMounted(() => {
  // Trigger animation enter
  isVisible.value = true;

  if (props.position) {
    // Delay event listener agar tidak bentrok dengan event click trigger
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
      window.addEventListener('scroll', () => emit('close'), true);
      window.addEventListener('resize', () => emit('close'));
    }, 0);
  }
});

onUnmounted(() => {
  if (props.position) {
    document.removeEventListener('mousedown', handleClickOutside);
    document.removeEventListener('contextmenu', handleClickOutside);
    window.removeEventListener('scroll', () => emit('close'), true);
    window.removeEventListener('resize', () => emit('close'));
  }
});
</script>

<style scoped>
/* Copy Style Transisi dari BaseDropdown agar konsisten */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>