<script setup>
import EditorLayout from "./components/layout/EditorLayout.vue";
import LeftPanel from "./components/panels/LeftPanel.vue";
import RightPanel from "./components/panels/RightPanel.vue";
import Canvas from "./components/core/Canvas.vue"; 
import Topbar from "./components/layout/Topbar.vue"; 
import BottomFloatingMenu from "./components/ui/FloatingMenu.vue"; 
import PointerCoordsDisplay from "./components/ui/OverlayCoords.vue"; 
import { ref } from "vue";

// State Sidebar Kiri
const isLeftSidebarCollapsed = ref(false);
const toggleLeftSidebar = () => {
  isLeftSidebarCollapsed.value = !isLeftSidebarCollapsed.value;
};

// State Sidebar Kanan (BARU)
const isRightSidebarCollapsed = ref(false);
const toggleRightSidebar = () => {
  isRightSidebarCollapsed.value = !isRightSidebarCollapsed.value;
};
</script>

<template>
  <EditorLayout 
    :is-left-collapsed="isLeftSidebarCollapsed"
    :is-right-collapsed="isRightSidebarCollapsed"
  >
    
    <template #canvas><Canvas class="w-full h-full" /></template>
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