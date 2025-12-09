// src/components/PointerCoordsDisplay.vue
<template>
  <div
    class="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-md bg-black/40 text-white text-xs font-medium backdrop-blur-md border border-white/10 select-none"
  >
    X: {{ x.toFixed(2) }}   Y: {{ y.toFixed(2) }}
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { bus } from "@engine/Util/EventBus.js";

const x = ref(0);
const y = ref(0);

function updateCoords(pos) {
  x.value = pos.x;
  y.value = pos.y;
}

onMounted(() => {
  bus.on("pointer:coords", updateCoords);
});

onBeforeUnmount(() => {
  bus.off("pointer:coords", updateCoords);
});
</script>
