<script setup>
import { ref, computed, onUnmounted } from 'vue';

const props = defineProps({
  isLeftCollapsed: { type: Boolean, default: false },
  isRightCollapsed: { type: Boolean, default: false }
});

// -- KONFIGURASI UKURAN --
const HEADER_HEIGHT = 48; // (h-12 di Tailwind = 48px). Tetap/Fixed.
const MIN_WIDTH = 200;
const MAX_WIDTH = 600;
const COLLAPSED_WIDTH = 50; 
const DEFAULT_LEFT_WIDTH = 288;
const DEFAULT_RIGHT_WIDTH = 320;

// -- STATE UKURAN --
const leftWidth = ref(DEFAULT_LEFT_WIDTH);
const rightWidth = ref(DEFAULT_RIGHT_WIDTH);

const isResizingLeft = ref(false);
const isResizingRight = ref(false);

// -- COMPUTED --
const activeLeftWidth = computed(() => props.isLeftCollapsed ? COLLAPSED_WIDTH : leftWidth.value);
const activeRightWidth = computed(() => props.isRightCollapsed ? COLLAPSED_WIDTH : rightWidth.value);

// -- LOGIKA RESIZE --
// (Sama seperti sebelumnya, tidak ada perubahan logika di sini)
const startResizeLeft = () => {
  if (props.isLeftCollapsed) return;
  isResizingLeft.value = true;
  document.addEventListener('mousemove', handleMouseMoveLeft);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'col-resize';
};

const handleMouseMoveLeft = (e) => {
  let newWidth = e.clientX;
  if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
  if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
  leftWidth.value = newWidth;
};

const startResizeRight = () => {
  if (props.isRightCollapsed) return;
  isResizingRight.value = true;
  document.addEventListener('mousemove', handleMouseMoveRight);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'col-resize';
};

const handleMouseMoveRight = (e) => {
  let newWidth = window.innerWidth - e.clientX;
  if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
  if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
  rightWidth.value = newWidth;
};

const stopResize = () => {
  isResizingLeft.value = false;
  isResizingRight.value = false;
  document.removeEventListener('mousemove', handleMouseMoveLeft);
  document.removeEventListener('mousemove', handleMouseMoveRight);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
};

onUnmounted(() => stopResize());
</script>

<template>
  <div class="w-screen h-screen relative bg-background text-primary overflow-hidden font-sans">
    
    <header 
      class="absolute inset-x-0 top-0 z-30 border-b border-border bg-panel"
      :style="{ height: HEADER_HEIGHT + 'px' }"
    >
      <slot name="topbar" />
    </header>

    <div 
      class="absolute inset-x-0 bottom-0 z-0"
      :style="{ top: HEADER_HEIGHT + 'px' }"
    >
      
      <div 
        class="absolute inset-0 z-0 transition-[padding] duration-300 ease-in-out pl-[var(--left-width)] pr-[var(--right-width)]"
        :style="{ 
          '--left-width': activeLeftWidth + 'px',
          '--right-width': activeRightWidth + 'px'
        }"
      >
        <slot name="canvas" />
      </div>

      <aside 
        class="absolute top-0 bottom-0 left-0 z-20 bg-panel flex border-r border-border"
        :class="{ 'transition-width duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]': !isResizingLeft }"
        :style="{ width: activeLeftWidth + 'px' }"
      >
        <div class="flex-1 overflow-hidden h-full w-full">
           <slot name="left-panel" />
        </div>
        <div v-show="!isLeftCollapsed"
          class="w-1 h-full cursor-col-resize hover:bg-blue-500/50 active:bg-blue-500 transition-colors absolute right-0 top-0 z-50"
          @mousedown.prevent="startResizeLeft"
        ></div>
      </aside>

      <aside 
        class="absolute top-0 bottom-0 right-0 z-20 bg-panel flex border-l border-border"
        :class="{ 'transition-width duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]': !isResizingRight }"
        :style="{ width: activeRightWidth + 'px' }"
      >
        <div v-show="!isRightCollapsed"
          class="w-1 h-full cursor-col-resize hover:bg-blue-500/50 active:bg-blue-500 transition-colors absolute left-0 top-0 z-50"
          @mousedown.prevent="startResizeRight"
        ></div>

        <div class="flex-1 overflow-hidden h-full w-full">
           <slot name="right-panel" />
        </div>
      </aside>

      <div class="absolute inset-0 pointer-events-none z-40">
        <slot name="overlays" />
      </div>

    </div>

  </div>
</template>

<style scoped>
.transition-width {
  transition-property: width;
}
</style>