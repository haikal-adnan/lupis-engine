<template>
  <div 
    v-if="overlayConfig"
    class="absolute left-0 right-0 pointer-events-none flex items-center justify-center gap-4 transition-all duration-75 ease-out"
  >
    
    <div class="flex items-center gap-3 px-2 py-1.5 bg-background rounded-full border border-border shadow-lg pointer-events-auto">
      
      <div 
        v-if="overlayConfig.showCoords"
        class="flex items-center gap-2 px-2 border-r border-border pr-3"
      >
        <span class="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">X: {{ coords.x.toFixed(1) }}</span>
        <span class="font-mono text-[10px] text-rose-600 dark:text-rose-400 font-bold">Y: {{ coords.y.toFixed(1) }}</span>
      </div>

      <div class="flex items-center gap-1">
        
        <button 
          v-if="overlayConfig.showGrid"
          @click="toggleGrid"
          class="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Toggle Grid"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16M10 4v16M14 4v16M18 4v16M6 4v16" />
          </svg>
        </button>

        <button 
          v-if="overlayConfig.showPlay"
          @click="openOrUpdatePreview"
          class="flex items-center gap-1.5 pl-2 pr-3 py-1 rounded-full transition-all active:scale-95 shadow-sm"
          :class="isPreviewing 
            ? 'bg-amber-500 hover:bg-amber-600 text-white' 
            : 'bg-primary text-primary-foreground hover:bg-primary/90'"
        >
          <svg v-if="!isPreviewing" class="w-3 h-3 fill-current" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <svg v-else class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
          
          <span class="text-xs font-bold">
            {{ isPreviewing ? 'Update' : 'Play' }}
          </span>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { bus } from "@engines/Util/EventBus.js";
import { usePreview } from "@/composables/usePreview.js";
import { useTab } from "@/composables/useTab.js"; // Import useTab

const { isPreviewing, openOrUpdatePreview } = usePreview();
const { currentLayout } = useTab();

// Computed property untuk akses config overlay saat ini
const overlayConfig = computed(() => currentLayout.value.overlay || null);

const coords = ref({ x: 0, y: 0 });

function updateCoords(pos) {
  // Hanya update coords jika overlay aktif dan fitur coords dinyalakan (optimasi)
  if (overlayConfig.value?.showCoords) {
    coords.value = pos;
  }
}

function toggleGrid() {
  bus.emit("editor:grid:toggle");
}

onMounted(() => {
  bus.on("pointer:coords", updateCoords);
});

onBeforeUnmount(() => {
  bus.off("pointer:coords", updateCoords);
});
</script>