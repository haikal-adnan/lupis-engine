<template>
  <div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">

    <button
      @click="$emit('toggle-grid')"
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
      @click="$emit('preview')"
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

// Import icons as components
import IconGrid from "@/assets/icons/ic_grid.svg?component";
import IconRefresh from "@/assets/icons/ic_play.svg?component";
import IconPlay from "@/assets/icons/ic_play.svg?component";

const props = defineProps({
  isPreviewing: Boolean
});

// Mengembalikan Object Component
const currentIcon = computed(() =>
  props.isPreviewing ? IconRefresh : IconPlay
);

const label = computed(() =>
  props.isPreviewing ? "Update" : "Preview"
);
</script>