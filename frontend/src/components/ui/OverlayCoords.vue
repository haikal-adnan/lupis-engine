<template>
  <div
    class="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-md 
           bg-black/40 backdrop-blur-md border border-white/10 shadow-sm
           text-white text-xs font-medium select-none pointer-events-none"
  >
    <span class="font-mono">X: {{ x.toFixed(2) }}</span>
    <span class="mx-2 text-white/30">|</span>
    <span class="font-mono">Y: {{ y.toFixed(2) }}</span>
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