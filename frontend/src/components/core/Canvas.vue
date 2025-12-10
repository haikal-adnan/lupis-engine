<template>
  <div class="w-full h-full relative overflow-hidden flex flex-col">
    <div class="relative flex-1 overflow-hidden bg-canvas shadow-inner">
      <canvas id="glCanvas" class="absolute inset-0 w-full h-full"></canvas>
    </div>
  </div>
</template>

<script setup>
import { onMounted, nextTick } from "vue";
import { startEngine } from "@engine/main.js";

onMounted(async () => {
  await nextTick();
  startEngine("glCanvas", "editor", "/projects/template/");
});
</script>