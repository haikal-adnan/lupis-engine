<template>
  <div class="absolute left-0 right-0 pointer-events-none flex items-center justify-center gap-4 transition-all duration-75 ease-out">
    
    <div class="flex items-center gap-3 px-2 py-1.5 bg-background rounded-full border border-border shadow-lg pointer-events-auto">
      
      <div class="flex items-center gap-2 px-2 border-r border-border pr-3">
        <span class="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">X: {{ coords.x.toFixed(1) }}</span>
        <span class="font-mono text-[10px] text-rose-600 dark:text-rose-400 font-bold">Y: {{ coords.y.toFixed(1) }}</span>
      </div>

      <div class="flex items-center gap-1">
        <button 
          @click="toggleGrid"
          class="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Toggle Grid"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16M10 4v16M14 4v16M18 4v16M6 4v16" />
          </svg>
        </button>

        <button 
          @click="openOrUpdatePreview"
          class="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
        >
          <svg v-if="!isPreviewing" class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          <svg v-else class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm-6 8c0-1.65.52-3.17 1.3-4.43l-1.47-1.47C4.69 7.74 4 9.79 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3c-3.31 0-6-2.69-6-6z"/></svg>
          <span class="text-xs font-bold">{{ isPreviewing ? 'Reload' : 'Play' }}</span>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { bus } from "@engine/Util/EventBus.js";
import { usePreview } from "@/composables/usePreview.js";

const { isPreviewing, openOrUpdatePreview } = usePreview();
const coords = ref({ x: 0, y: 0 });

function updateCoords(pos) {
  coords.value = pos;
}

function toggleGrid() {
  bus.emit("editor:grid:toggle");
}

onMounted(() => bus.on("pointer:coords", updateCoords));
onBeforeUnmount(() => bus.off("pointer:coords", updateCoords));
</script>