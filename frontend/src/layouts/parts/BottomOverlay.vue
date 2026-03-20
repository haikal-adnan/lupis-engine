<template>
  <div 
    v-if="overlayConfig"
    class="absolute left-0 right-0 pointer-events-none flex items-center justify-center z-50 transition-all duration-300 ease-out"
    :class="{ 'translate-y-10 opacity-0': !overlayConfig.showGrid && !overlayConfig.showPlay }"
  >
    <div class="flex items-center p-1 bg-background rounded-xl border border-border shadow-lg pointer-events-auto gap-1">
      
      <div v-if="overlayConfig.showCoords" class="flex items-center gap-3 px-3 mr-1">
        <span class="font-mono text-[10px] font-bold flex items-center gap-1 text-muted-foreground">
          <span class="text-emerald-500">X</span> {{ coords.x.toFixed(0) }}
        </span>
        <span class="font-mono text-[10px] font-bold flex items-center gap-1 text-muted-foreground">
          <span class="text-rose-500">Y</span> {{ coords.y.toFixed(0) }}
        </span>
      </div>

      <div v-if="overlayConfig.showCoords" class="h-4 w-[1px] bg-border"></div>

      <IconButton 
        v-if="overlayConfig.showGrid && projectStore.project"
        @click="projectStore.toggleMagnet()"
        :active="projectStore.project.settings.grid.snap"
        :tooltip="projectStore.project.settings.grid.snap ? 'Snap On' : 'Snap Off'"
        class="w-8 h-8"
      >
        <Magnet class="w-4 h-4" />
      </IconButton>

      <IconButton 
        v-if="overlayConfig.showGrid && projectStore.project"
        @click="projectStore.toggleGrid()"
        :active="projectStore.project.settings.grid.visible"
        tooltip="Toggle Grid"
        class="w-8 h-8"
      >
        <Grid3X3 class="w-4 h-4" />
      </IconButton>

      <div v-if="overlayConfig.showPlay" class="h-4 w-[1px] bg-border mx-1"></div>
      <BaseButton 
        v-if="overlayConfig.showPlay"
        @click="openOrUpdatePreview"
        :active="isPreviewing" 
        class="h-8 rounded-full px-4 gap-2 text-xs font-bold"
      >
        <RefreshCw v-if="isPreviewing" class="w-3.5 h-3.5 animate-spin-slow" />
        <Play v-else class="w-3.5 h-3.5 fill-current" />
        <span>{{ isPreviewing ? 'Update' : 'Play' }}</span>
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { Magnet, Grid3X3, Play, RefreshCw } from 'lucide-vue-next';
import { bus } from "@engines/Util/EventBus.js";
import { usePreview } from "@/composables/usePreview.js";
import { useTab } from "@/composables/useTab.js"; 
import { useEditorStore } from "@/stores/useEditorStore.js";
import { useProjectStore } from "@/stores/useProjectStore.js"; 

import IconButton from '@/commons/components/buttons/IconButton.vue';
import BaseButton from '@/commons/components/buttons/BaseButton.vue';

const { isPreviewing, openOrUpdatePreview } = usePreview();
const { currentLayout } = useTab();
const editorStore = useEditorStore();
const projectStore = useProjectStore(); 

const overlayConfig = computed(() => currentLayout.value.overlay || null);
const coords = ref({ x: 0, y: 0 });

function updateCoords(pos) {
  if (overlayConfig.value?.showCoords) {
    coords.value = pos;
  }
}

onMounted(() => {
  bus.on("pointer:coords", updateCoords);
});

onBeforeUnmount(() => {
  bus.off("pointer:coords", updateCoords);
});
</script>