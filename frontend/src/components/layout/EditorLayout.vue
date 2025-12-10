<template>
  <div class="w-screen h-screen relative bg-[color:var(--bg)] text-[color:var(--text)] overflow-hidden">
    <Canvas ref="canvasRef" class="w-full h-full" />

    <Topbar id="editor-topbar" class="absolute inset-x-0 top-0 z-30" />

    <div id="editor-sidebar-left" class="absolute top-12 bottom-0 left-0 w-72 z-20">
      <Sidebar class="absolute inset-x-0 top-0 z-30">
        <h3 class="font-semibold mb-3">File System</h3>
        <div class="flex flex-col space-y-5 text-sm">
          <FileExplorer />
        </div>
      </Sidebar>
    </div>

    <div id="editor-sidebar-right" class="absolute top-12 bottom-0 right-0 w-80 z-20">
      <Sidebar class="absolute inset-x-0 top-0 z-30">
        <h3 class="font-semibold mb-3">Property Inspector</h3>
        <div class="flex flex-col space-y-5 text-sm">
          <Property />
        </div>
      </Sidebar>
    </div>

    <FloatingMenu />

    <OverlayCoords
      :isPreviewing="isPreviewing"
      @preview="handlePreview"
      @toggle-grid="toggleGrid"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Canvas from "../core/Canvas.vue";
import Topbar from "./Topbar.vue";
import Sidebar from "./Sidebar.vue";
import FloatingMenu from "../ui/FloatingMenu.vue";
import OverlayCoords from "../ui/OverlayCoords.vue";
import FileExplorer from "../panels/FileExplorer/FileTree.vue";
import Property from "../panels/Inspector/PropertyPanel.vue";
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
  if (canvasRef.value && typeof canvasRef.value.onPreviewClosed === "function") {
    canvasRef.value.onPreviewClosed(() => {
      isPreviewing.value = false;
    });
  }
});
</script>
