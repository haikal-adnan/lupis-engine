// src/components/BottomFloatingMenu.vue
<template>
  <div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">

    <button
      @click="$emit('toggle-grid')"
      class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition text-sm font-medium"
    >
      <img src="/src/assets/icons/ic_grid.svg" class="w-4 h-4 filter invert brightness-200" />
      <span>Grid</span>
    </button>

    <button
      @click="$emit('preview')"
      class="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition text-sm font-semibold"
    >
      <img :src="icon" class="w-4 h-4 filter invert brightness-200" />
      <span>{{ label }}</span>
    </button>

  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  isPreviewing: Boolean
});

const icon = computed(() =>
  props.isPreviewing ? "/src/assets/icons/ic_refresh.svg" : "/src/assets/icons/ic_play.svg"
);

const label = computed(() =>
  props.isPreviewing ? "Update" : "Preview"
);
</script>
