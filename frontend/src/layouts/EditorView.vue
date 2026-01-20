<script setup>
import { ref, shallowRef, computed, watch } from 'vue'

// --- COMPOSABLES ---
import { useLayoutState } from '@/composables/useLayoutState.js'
import { useTab } from '@/composables/useTab.js' 

// --- STORES ---
import { useEditorStore } from '@/stores/useEditorStore'
import { useScriptStore } from '@/stores/useScriptStore'
import { useSceneStore } from '@/stores/scene/useSceneStore'

// --- LAYOUT PARTS ---
import EditorLayout from '@/layouts/EditorLayout.vue'
import TopBar from '@/layouts/parts/TopBar.vue'
import LeftPanel from '@/layouts/parts/LeftPanel.vue'
import RightPanel from '@/layouts/parts/RightPanel.vue'
import BottomBar from '@/layouts/parts/BottomBar.vue'
import BottomOverlay from '@/layouts/parts/BottomOverlay.vue'

// --- MODULES ---
import AssetPanel from '@/modules/assets/AssetPanel.vue'

// 1. INIT STATE & COMPOSABLES
const {
  layoutRef,
  isLeftSidebarCollapsed,
  isRightSidebarCollapsed,
  toggleLeftSidebar,
  toggleRightSidebar
} = useLayoutState()

const { currentLayout } = useTab() // Mengatur konten Center/Left/Right berdasarkan tipe Tab

// 2. BOTTOM PANEL STATE
const currentBottomComponent = shallowRef(AssetPanel) 
const isBottomPanelOpen = ref(false) 

// Computed Visibility (Berdasarkan konfigurasi Tab saat ini)
const isLeftHidden = computed(() => !currentLayout.value.left)
const isRightHidden = computed(() => !currentLayout.value.right)
const isBottomHidden = computed(() => !currentLayout.value.showBottom)

// 3. STORE SYNC LOGIC (THE BRIDGE)
const editorStore = useEditorStore()
const scriptStore = useScriptStore()
const sceneStore = useSceneStore()

watch(
  () => editorStore.activeTabId, 
  (newTabId) => {
    const currentTab = editorStore.activeTab;
    
    // Safety check
    if (!currentTab) return;

    // --- CASE A: GRAPH NODE EDITOR (Script) ---
    if (currentTab.type === 'diagram') {
      const targetScript = scriptStore.getScriptById(newTabId);

      if (targetScript) {
        scriptStore.setActiveScript(targetScript);
        scriptStore.setSelectedNode(null); // Reset seleksi node
        console.log(`[Editor] Switched to Script: ${targetScript.name}`);
      } else {
        console.warn(`[Editor] Script ID ${newTabId} not found.`);
        scriptStore.setActiveScript(null);
      }
    } 
    
    // --- CASE B: TILEMAP EDITOR (Entity) ---
    else if (currentTab.type === 'tilemap') {
      // ID Tab = ID Entity
      const entityId = newTabId; 

      // Sinkronisasi seleksi di Scene agar Property Inspector Tilemap aktif
      // Cek apakah entity ini sudah terpilih, jika belum, pilih dia.
      if (!sceneStore.selectedEntityIds.includes(entityId)) {
         sceneStore.setSelectedEntities([entityId]);
      }
      
      // Matikan active script agar tidak tumpang tindih state
      scriptStore.setActiveScript(null);
      console.log(`[Editor] Switched to Tilemap Entity: ${entityId}`);
    }

    // --- CASE C: SCENE EDITOR (Default) ---
    else if (currentTab.type === 'scene') {
      // Bersihkan state script active karena kita kembali ke Scene View
      scriptStore.setActiveScript(null);
      console.log(`[Editor] Switched to Main Scene`);
    }
  },
  { immediate: true }
);

// 4. BOTTOM PANEL HANDLERS
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