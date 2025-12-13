<script setup>
import EditorLayout from "./components/layout/EditorLayout.vue";
import LeftPanel from "./components/panels/LeftPanel.vue"; // Asumsi ada
import RightPanel from "./components/panels/RightPanel.vue"; // Asumsi ada
import Canvas from "./components/core/Canvas.vue"; // Asumsi ada
import Topbar from "./components/layout/Topbar.vue"; // Asumsi ada
import BottomFloatingMenu from "./components/ui/FloatingMenu.vue"; // Asumsi ada
import PointerCoordsDisplay from "./components/ui/OverlayCoords.vue"; // Asumsi ada
import { ref } from "vue";

// State Sidebar Kiri
const isLeftSidebarCollapsed = ref(false);
const isRightSidebarCollapsed = ref(false);

// Handler opsional (untuk tombol toggle manual)
const toggleLeftSidebar = () => {
  isLeftSidebarCollapsed.value = !isLeftSidebarCollapsed.value;
};
const toggleRightSidebar = () => {
  isRightSidebarCollapsed.value = !isRightSidebarCollapsed.value;
};
</script>

<template>
  <EditorLayout 
    v-model:is-left-collapsed="isLeftSidebarCollapsed"
    v-model:is-right-collapsed="isRightSidebarCollapsed"
  >
    
    <template #canvas><Canvas class="w-full h-full bg-slate-100" /></template>
    <template #topbar><Topbar /></template>

    <template #left-panel>
      <LeftPanel 
        :collapsed="isLeftSidebarCollapsed" 
        @toggle="toggleLeftSidebar" 
      />
    </template>

    <template #right-panel>
      <RightPanel 
        :collapsed="isRightSidebarCollapsed"
        @toggle="toggleRightSidebar"
      />
    </template>

    <template #overlays>
      <div class="w-full h-full relative pointer-events-none">
        <PointerCoordsDisplay />
        <BottomFloatingMenu class="pointer-events-auto" />
      </div>
    </template>

  </EditorLayout>
</template>