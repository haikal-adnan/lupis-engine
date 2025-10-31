<template>
  <div class="flex flex-col items-center justify-center h-full w-full bg-gray-900 text-white">
    <div class="flex gap-2 mb-2">
      <button
        @click="handlePlay"
        class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
      >
        ▶️ Play
      </button>
      <button
        @click="handleStop"
        class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
      >
        ⏹ Stop
      </button>
    </div>

    <canvas ref="canvasRef" class="border border-white/20 rounded w-[800px] h-[480px]"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { EngineRuntime } from "@/runtime/EngineRuntime";

const canvasRef = ref(null);
let runtime = null;

onMounted(async () => {
  runtime = new EngineRuntime(canvasRef.value);
  await runtime.load();
  runtime.resize();
});

onBeforeUnmount(() => {
  runtime?.stop();
});

function handlePlay() {
  runtime?.start();
}

function handleStop() {
  runtime?.stop();
}
</script>

<style scoped>
canvas {
  image-rendering: pixelated;
}
</style>
