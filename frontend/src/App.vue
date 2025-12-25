<script setup>
import EditorLayout from "./components/layout/EditorLayout.vue";
import LeftPanel from "./components/panels/LeftPanel.vue"; // Asumsi file ini ada
import RightPanel from "./components/panels/RightPanel.vue"; // Asumsi file ini ada
import Canvas from "./components/core/Canvas.vue";
import Topbar from "./components/layout/Topbar.vue";
import BottomBar from "./components/layout/BottomBar.vue";
import AssetPanel from "./components/panels/AssetPanel.vue";
import ConsolePanel from "./components/panels/ConsolePanel.vue";
import BottomOverlay from "./components/ui/BottomOverlay.vue";
import { ref } from "vue";
import LibraryPanel from "./components/panels/LibraryPanel.vue";

const layoutRef = ref(null);
const isLeftSidebarCollapsed = ref(false);
const isRightSidebarCollapsed = ref(false);

// State Bottom Panel
const activeBottomTab = ref(null);
const lastActiveBottomTab = ref('assets'); // Default menu

// Toggle Handlers untuk Sidebar
const toggleLeftSidebar = () => {
  isLeftSidebarCollapsed.value = !isLeftSidebarCollapsed.value;
};
const toggleRightSidebar = () => {
  isRightSidebarCollapsed.value = !isRightSidebarCollapsed.value;
};

// Toggle Handler untuk Bottom Panel
const toggleBottomTab = (tabId) => {
  if (activeBottomTab.value === tabId) {
    // Close
    activeBottomTab.value = null;
    layoutRef.value?.setBottomPanel(false);
  } else {
    // Open
    activeBottomTab.value = tabId;
    lastActiveBottomTab.value = tabId; // Simpan state terakhir
    layoutRef.value?.setBottomPanel(true);
  }
};

// Handler khusus saat user men-drag bottom bar dari posisi tertutup
const handleDragOpen = () => {
  if (!activeBottomTab.value) {
    activeBottomTab.value = lastActiveBottomTab.value;
  }
};
</script>

<template>
  <EditorLayout 
    ref="layoutRef"
    v-model:is-left-collapsed="isLeftSidebarCollapsed"
    v-model:is-right-collapsed="isRightSidebarCollapsed"
    @close="activeBottomTab = null"
    @drag-open="handleDragOpen"
  >
    
    <template #canvas><Canvas class="w-full h-full bg-slate-900" /></template>
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

    <template #bottom-panel="{ close }">
      <div class="h-full w-full bg-background">
        <KeepAlive>
          <AssetPanel 
            v-if="activeBottomTab === 'assets'" 
            @close="close" 
          />
          <ConsolePanel 
            v-else-if="activeBottomTab === 'console'" 
            @close="close" 
          />
          <LibraryPanel 
            v-else-if="activeBottomTab === 'library'" 
            @close="close" 
          />
        </KeepAlive>
      </div>
    </template>

    <template #bottom-bar>
      <BottomBar 
        :active-tab="activeBottomTab"
        @toggle="toggleBottomTab"
      />
    </template>

    <template #overlays>
       <BottomOverlay />
    </template>

  </EditorLayout>
</template>