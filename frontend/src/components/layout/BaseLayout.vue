// src/components/layout/BaseLayout.vue
<template>
  <div class="w-screen h-screen relative bg-slate-900 text-slate-100 overflow-hidden">
    <Canvas ref="canvasRef" class="w-full h-full" />

    <PointerCoordsDisplay />

    <BottomFloatingMenu
      :isPreviewing="isPreviewing"
      @preview="handlePreview"
      @toggle-grid="toggleGrid"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Canvas from "./Canvas.vue";
import BottomFloatingMenu from "./BottomFloatingMenu.vue";
import PointerCoordsDisplay from "./PointerCoordsDisplay.vue";
import { bus } from "@engine/Util/EventBus.js";

const canvasRef = ref(null);
const isPreviewing = ref(false);

function handlePreview() {
  if (canvasRef.value) {
    canvasRef.value.openOrUpdatePreview();
    isPreviewing.value = true;
  }
}

function toggleGrid() {
  bus.emit("editor:grid:toggle");
}

onMounted(() => {
  canvasRef.value.onPreviewClosed(() => {
    isPreviewing.value = false;
  });
});
</script>
