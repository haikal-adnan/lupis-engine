<script setup>
import { ref, shallowRef, computed } from 'vue'
import { useLayoutState } from '@/composables/useLayoutState.js'
import { useTab } from '@/composables/useTab.js' 

// Layouts
import EditorLayout from '@/layouts/EditorLayout.vue'
import TopBar from '@/layouts/parts/TopBar.vue'
import LeftPanel from '@/layouts/parts/LeftPanel.vue'
import RightPanel from '@/layouts/parts/RightPanel.vue'
import BottomBar from '@/layouts/parts/BottomBar.vue'
import BottomOverlay from '@/layouts/parts/BottomOverlay.vue'
// Panels
import AssetPanel from '@/modules/assets/AssetPanel.vue'

// --- Setup ---
const {
  layoutRef,
  isLeftSidebarCollapsed,
  isRightSidebarCollapsed,
  toggleLeftSidebar,
  toggleRightSidebar
} = useLayoutState()

const { currentLayout } = useTab()

const currentBottomComponent = shallowRef(AssetPanel) 
const isBottomPanelOpen = ref(false) 

// --- COMPUTED FOR VISIBILITY ---
// Cek apakah panel ada di config. Jika null, berarti HIDDEN.
const isLeftHidden = computed(() => !currentLayout.value.left)
const isRightHidden = computed(() => !currentLayout.value.right)
const isBottomHidden = computed(() => !currentLayout.value.showBottom)

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
    
    :is-left-collapsed="isLeftSidebarCollapsed"
    @update:is-left-collapsed="val => isLeftSidebarCollapsed = val"
    
    :is-right-collapsed="isRightSidebarCollapsed"
    @update:is-right-collapsed="val => isRightSidebarCollapsed = val"
    
    :hide-left="isLeftHidden"
    :hide-right="isRightHidden"
    :hide-bottom="isBottomHidden"

    @close="onLayoutClosePanel"
    @drag-open="onLayoutDragOpen"
  >
    
    <template #canvas>
      <KeepAlive>
        <component :is="currentLayout.center" />
      </KeepAlive>
    </template>

    <template #topbar>
      <TopBar />
    </template>

    <template #left-panel>
      <LeftPanel 
        v-if="!isLeftHidden" 
        :collapsed="isLeftSidebarCollapsed"
        :title="currentLayout.leftTitle"
        @toggle="toggleLeftSidebar" 
      >
         <component :is="currentLayout.left" />
      </LeftPanel>
    </template>

    <template #right-panel>
      <RightPanel 
        v-if="!isRightHidden"
        :collapsed="isRightSidebarCollapsed"
        :title="currentLayout.rightTitle"
        @toggle="toggleRightSidebar" 
      >
         <component :is="currentLayout.right" />
      </RightPanel>
    </template>

    <template #bottom-panel="{ close }">
      <div v-if="!isBottomHidden" class="h-full w-full bg-background flex flex-col overflow-hidden">
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
        v-if="!isBottomHidden"
        :is-open="isBottomPanelOpen"
        @update:component="handleComponentUpdate"
        @toggle="handleToggleRequest"
      />
    </template>

    <template #overlays>
      <BottomOverlay v-if="currentLayout.overlay" />
    </template>

  </EditorLayout>
</template>