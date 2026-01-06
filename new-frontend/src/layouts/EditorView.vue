<script setup>
import { ref, shallowRef } from 'vue'
import { useLayoutState } from '@/composables/useLayoutState.js'

// Layouts
import EditorLayout from '@/layouts/EditorLayout.vue'
import TopBar from '@/layouts/parts/TopBar.vue'
import LeftPanel from '@/layouts/parts/LeftPanel.vue'
import RightPanel from '@/layouts/parts/RightPanel.vue'
import BottomBar from '@/layouts/parts/BottomBar.vue'

// Panels
import AssetPanel from '@/modules/assets/AssetPanel.vue'

// MODULES (Integrasi Canvas Disini)
import CanvasView from '@/modules/canvas/CanvasView.vue'

const {
  layoutRef,
  isLeftSidebarCollapsed,
  isRightSidebarCollapsed,
  toggleLeftSidebar,
  toggleRightSidebar
} = useLayoutState()

const currentBottomComponent = shallowRef(AssetPanel) 
const isBottomPanelOpen = ref(false) 

const handleComponentUpdate = (component) => {
  currentBottomComponent.value = component
}

const handleToggleRequest = (shouldOpen) => {
  isBottomPanelOpen.value = shouldOpen
  layoutRef.value?.setBottomPanel(shouldOpen)
}

const onLayoutClosePanel = () => {
  isBottomPanelOpen.value = false
}

const onLayoutDragOpen = () => {
  isBottomPanelOpen.value = true
}
</script>

<template>
  <EditorLayout 
    ref="layoutRef"
    v-model:is-left-collapsed="isLeftSidebarCollapsed"
    v-model:is-right-collapsed="isRightSidebarCollapsed"
    @close="onLayoutClosePanel"
    @drag-open="onLayoutDragOpen"
  >
    
    <template #canvas>
      <CanvasView /> 
    </template>

    <template #topbar>
      <TopBar />
    </template>

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
      <div class="h-full w-full bg-background flex flex-col overflow-hidden">
        <KeepAlive>
          <component 
            :is="currentBottomComponent" 
            @close="close" 
          />
        </KeepAlive>
      </div>
    </template>

    <template #bottom-bar>
      <BottomBar 
        :is-open="isBottomPanelOpen"
        @update:component="handleComponentUpdate"
        @toggle="handleToggleRequest"
      />
    </template>

  </EditorLayout>
</template>