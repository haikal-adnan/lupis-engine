<template>
  <div class="w-screen h-screen relative bg-background text-primary overflow-hidden font-sans transition-colors duration-200">
    
    <Canvas ref="canvasRef" class="w-full h-full" />

    <Topbar id="editor-topbar" class="absolute inset-x-0 top-0 z-30" />

    <div id="editor-sidebar-left" class="absolute top-12 bottom-0 left-0 w-72 z-20 border-r border-border">
      <Sidebar class="absolute inset-x-0 top-0 h-full">
        <h3 class="font-semibold mb-3 text-primary text-sm uppercase tracking-wide opacity-80">File System</h3>
        <div class="flex flex-col space-y-2 text-sm">
          <FileExplorer />
        </div>
      </Sidebar>
    </div>

    <div id="editor-sidebar-right" class="absolute top-12 bottom-0 right-0 w-80 z-20 border-l border-border">
      <Sidebar class="absolute inset-x-0 top-0 h-full">
        <h3 class="font-semibold mb-3 text-primary text-sm uppercase tracking-wide opacity-80">Property Inspector</h3>
        <div class="flex flex-col space-y-2 text-sm">
          <Property />
        </div>
      </Sidebar>
    </div>

    <PointerCoordsDisplay />

    <BottomFloatingMenu
      :isPreviewing="isPreviewing"
      @preview="handlePreview"
      @toggle-grid="toggleGrid"
    />
  </div>
</template>

<script setup>
// ... (Script setup tetap sama, tidak perlu diubah)
import { ref, onMounted } from "vue";
import Canvas from "./components/core/Canvas.vue"; 
import Topbar from "./components/layout/Topbar.vue"; 
import Sidebar from "./components/layout/Sidebar.vue"; 
import BottomFloatingMenu from "./components/ui/FloatingMenu.vue"; 
import PointerCoordsDisplay from "./components/ui/OverlayCoords.vue"; 
import FileExplorer from "./components/panels/FileExplorer/FileTree.vue"; 
import Property from "./components/panels/Inspector/PropertyPanel.vue";
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