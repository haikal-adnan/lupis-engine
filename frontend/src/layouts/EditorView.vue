<script setup>
import { ref, shallowRef, computed, watch } from 'vue'

import { useLayoutState } from '@/composables/useLayoutState.js'
import { useTab } from '@/composables/useTab.js' 

import { useEditorStore } from '@/stores/useEditorStore'
import { useScriptStore } from '@/stores/useScriptStore'
import { useSceneStore } from '@/stores/scene/useSceneStore'

import EditorLayout from '@/layouts/EditorLayout.vue'
import TopBar from '@/layouts/parts/TopBar.vue'
import LeftPanel from '@/layouts/parts/LeftPanel.vue'
import RightPanel from '@/layouts/parts/RightPanel.vue'
import BottomBar from '@/layouts/parts/BottomBar.vue'
import BottomOverlay from '@/layouts/parts/BottomOverlay.vue'

import AssetPanel from '@/modules/assets/AssetPanel.vue'

const {
  layoutRef,
  isLeftSidebarCollapsed,
  isRightSidebarCollapsed,
  toggleLeftSidebar,
  toggleRightSidebar
} = useLayoutState()

const { currentLayout } = useTab()

const currentBottomComponent = shallowRef(AssetPanel) 
// Hapus isBottomPanelOpen lokal, kita gunakan store

const isLeftHidden = computed(() => !currentLayout.value.left)
const isRightHidden = computed(() => !currentLayout.value.right)
const isBottomHidden = computed(() => !currentLayout.value.showBottom)

const editorStore = useEditorStore()
const scriptStore = useScriptStore()
const sceneStore = useSceneStore()

// --- LOGIKA TOP BAR TAB (Script/Scene switching) ---
watch(
  () => editorStore.activeTabId, 
  (newTabId) => {
    const currentTab = editorStore.activeTab
    if (!currentTab) return

    if (currentTab.type === 'diagram') {
      const targetScript = scriptStore.getScriptById(newTabId)
      if (targetScript) {
        scriptStore.setActiveScript(targetScript)
        scriptStore.setSelectedNode(null)
      } else {
        scriptStore.setActiveScript(null)
      }
    } 
    else if (currentTab.type === 'tilemap') {
      const entityId = newTabId

      if (!sceneStore.selectedEntityIds.includes(entityId)) {
         sceneStore.selectedEntityIds = [entityId] 
      }
      
      scriptStore.setActiveScript(null)
    }
    else if (currentTab.type === 'scene') {
      scriptStore.setActiveScript(null)
    }
    
    // Tambahkan logika handle UI jika perlu
    else if (currentTab.type === 'ui') {
        scriptStore.setActiveScript(null)
        // Opsional: Select entity UI-nya jika newTabId merepresentasikan entity ID
    }
  },
  { immediate: true }
)

// --- LOGIKA BOTTOM BAR (Store Sync) ---

// Menerima komponen dari BottomBar berdasarkan Tab ID yang aktif
const handleComponentUpdate = (component) => {
  currentBottomComponent.value = component
}

// Sinkronisasi Layout dengan Store: Ketika Store berubah, buka/tutup Layout
watch(
  () => editorStore.isBottomBarOpen,
  (isOpen) => {
    // Panggil method di EditorLayout untuk animasi buka/tutup
    layoutRef.value?.setBottomPanel(isOpen)
  }
)

// Sinkronisasi Layout ke Store: Ketika user menutup manual (drag handle)
const onLayoutClosePanel = () => {
  if (editorStore.isBottomBarOpen) {
    editorStore.toggleBottomBar() // atau set false
  }
}

// Sinkronisasi Layout ke Store: Ketika user membuka manual (drag handle)
const onLayoutDragOpen = () => {
  if (!editorStore.isBottomBarOpen) {
    editorStore.toggleBottomBar() // atau set true
  }
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
        @update:component="handleComponentUpdate"
      />
    </template>

    <template #overlays>
      <BottomOverlay v-if="currentLayout.overlay" />
    </template>
  </EditorLayout>
</template>