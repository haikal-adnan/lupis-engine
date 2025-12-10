<template>
  <div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">

    <button
      @click="toggleGrid"
      class="flex items-center gap-2 px-3 py-2 rounded-lg 
             bg-black/60 hover:bg-black/80 backdrop-blur-md 
             border border-white/10 shadow-lg hover:shadow-black/50
             transition-all duration-200 group active:scale-95"
    >
      <IconGrid class="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
      <span class="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
        Grid
      </span>
    </button>

    <button
      @click="openOrUpdatePreview"
      class="flex items-center gap-2 px-4 py-2 rounded-lg 
             bg-black/60 hover:bg-black/80 backdrop-blur-md 
             border border-white/10 shadow-lg hover:shadow-black/50
             transition-all duration-200 group active:scale-95"
    >
      <component 
        :is="currentIcon" 
        class="w-4 h-4 text-white transition-colors" 
      />
      <span class="text-sm font-semibold text-white">
        {{ label }}
      </span>
    </button>

  </div>
</template>

<script setup>
import { computed } from "vue";
import { bus } from "@engine/Util/EventBus.js";
import { usePreview } from "@/composables/usePreview.js";

import IconGrid from "@/assets/icons/ic_grid.svg?component";
import IconRefresh from "@/assets/icons/ic_play.svg?component";
import IconPlay from "@/assets/icons/ic_play.svg?component";

const { isPreviewing, openOrUpdatePreview } = usePreview();

function toggleGrid() {
  bus.emit("editor:grid:toggle");
}

const currentIcon = computed(() =>
  isPreviewing.value ? IconRefresh : IconPlay
);

const label = computed(() =>
  isPreviewing.value ? "Update" : "Preview"
);
</script>