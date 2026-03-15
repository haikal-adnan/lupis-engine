<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="state.isOpen" 
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6"
        @click.self="closeImage"
      >
        <div 
          class="bg-background border border-border rounded-lg shadow-2xl flex flex-col transform transition-all max-w-3xl w-full"
          :class="{ 'scale-100': state.isOpen, 'scale-95': !state.isOpen }"
        >
          <div class="px-4 py-3 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h3 class="text-sm font-semibold text-foreground truncate pr-4">
              {{ state.title }}
            </h3>
            <button 
              @click="closeImage"
              class="text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive p-1 rounded transition-colors"
              title="Close (Esc)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>

          <div 
            class="relative w-full aspect-square overflow-hidden bg-black/50 bg-checkerboard flex items-center justify-center rounded-b-lg group"
            :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
            @wheel.prevent="handleZoom"
            @mousedown.prevent="startDrag"
            @mousemove="onDrag"
            @mouseup="stopDrag"
            @mouseleave="stopDrag"
            @dblclick="resetView"
          >
            <img 
              :src="state.imageUrl" 
              class="max-w-full max-h-full object-contain pixelated pointer-events-none transition-transform duration-75 ease-out"
              :style="{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})` }"
              draggable="false"
            />

            <div class="absolute top-4 left-4 text-[10px] text-white/50 bg-black/40 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Scroll to zoom • Drag to pan • Double click to reset
            </div>

            <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background/80 backdrop-blur-md p-1 rounded-md border border-border shadow-lg" @mousedown.stop>
              <button @click="zoomOut" class="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors" title="Zoom Out">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>
              </button>
              
              <div class="w-16 text-center text-xs font-bold text-foreground tabular-nums cursor-pointer hover:text-primary transition-colors" @click="resetView">
                 {{ Math.round(scale * 100) }}%
               </div>

              <button @click="zoomIn" class="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors" title="Zoom In">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { usePopImage } from '@/composables/usePopImage';

const { state, closeImage } = usePopImage();

const scale = ref(1);
const position = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });

const MIN_SCALE = 0.1; 
const MAX_SCALE = 30;  

const resetView = () => {
  scale.value = 1;
  position.value = { x: 0, y: 0 };
};

watch(() => state.value.isOpen, (newVal) => {
  if (newVal) resetView();
});

const handleZoom = (e) => {
  const zoomSensitivity = 0.15;
  const delta = e.deltaY < 0 ? 1 : -1;
  
  let newScale = scale.value * (1 + delta * zoomSensitivity);
  newScale = Math.max(MIN_SCALE, Math.min(newScale, MAX_SCALE));
  
  scale.value = newScale;
};

const zoomIn = () => { scale.value = Math.min(scale.value * 1.5, MAX_SCALE); };
const zoomOut = () => { scale.value = Math.max(scale.value / 1.5, MIN_SCALE); };

const startDrag = (e) => {
  isDragging.value = true;
  dragStart.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  };
};

const onDrag = (e) => {
  if (!isDragging.value) return;
  position.value = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y
  };
};

const stopDrag = () => {
  isDragging.value = false;
};

const handleKeydown = (e) => {
  if (e.key === 'Escape' && state.value.isOpen) {
    closeImage();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.pixelated { 
  image-rendering: pixelated; 
  /* Fallback untuk beberapa browser lama */
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.aspect-square {
  aspect-ratio: 1 / 1;
}

/* Pola papan catur untuk background transparan */
.bg-checkerboard {
  background-image: 
    linear-gradient(45deg, #1e1e1e 25%, transparent 25%), 
    linear-gradient(-45deg, #1e1e1e 25%, transparent 25%), 
    linear-gradient(45deg, transparent 75%, #1e1e1e 75%), 
    linear-gradient(-45deg, transparent 75%, #1e1e1e 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}
</style>