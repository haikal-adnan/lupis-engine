<!-- EditorView.vue -->
<script setup>
import { ref, shallowRef, computed, watch, onMounted, onUnmounted } from 'vue';

import { 
  useLayoutState,
  useTab,
  useAppInit
} from '@composables/composables.js';

import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useScriptStore } from '@scripts/scripts.js';
import { useSceneStore } from '@scenes/scenes.js';

import EditorLayout from '@layouts/EditorLayout.vue';
import TopBar from '@layouts/parts/TopBar.vue';
import LeftPanel from '@layouts/parts/LeftPanel.vue';
import RightPanel from '@layouts/parts/RightPanel.vue';
import BottomBar from '@layouts/parts/BottomBar.vue';
import BottomOverlay from '@layouts/parts/BottomOverlay.vue';
import { useHistory } from '@historys/historys.js'

import { AssetPanel } from '@assets/assets.js';
import { AppLoading } from '@components/components.js';
import { EditorSettingsModal } from '@settings/settings.js';

const { setupListeners, cleanupListeners } = useHistory();

onMounted(() => {
  setupListeners();
});

onUnmounted(() => {
  cleanupListeners();
});

const isSettingsModalOpen = ref(false);

const handleOpenSettings = () => {
  isSettingsModalOpen.value = true;
};

const { isLoading } = useAppInit();

const {
  layoutRef,
  isLeftSidebarCollapsed,
  isRightSidebarCollapsed,
  toggleLeftSidebar,
  toggleRightSidebar
} = useLayoutState();

const { currentLayout } = useTab();

const currentBottomComponent = shallowRef(AssetPanel);

const isLeftHidden = computed(() => !currentLayout.value.left);
const isRightHidden = computed(() => !currentLayout.value.right);
const isBottomHidden = computed(() => !currentLayout.value.showBottom);

const workspaceStore = useWorkspaceStore();
const scriptStore = useScriptStore();
const sceneStore = useSceneStore();

watch(
  () => workspaceStore.activeTabId, 
  (newTabId) => {
    const currentTab = workspaceStore.activeTab;
    if (!currentTab) return;

    if (currentTab.type === 'diagram') {
      const targetScript = scriptStore.getScriptById(newTabId);
      if (targetScript) {
        scriptStore.setActiveScript(targetScript);
        scriptStore.setSelectedNode(null);
      } else {
        scriptStore.setActiveScript(null);
      }
    } 
    else if (currentTab.type === 'tilemap') {
      const entityId = newTabId;

      if (!sceneStore.selectedEntityIds.includes(entityId)) {
         sceneStore.selectedEntityIds = [entityId];
      }
      
      scriptStore.setActiveScript(null);
    }
    else if (currentTab.type === 'scene') {
      scriptStore.setActiveScript(null);
    }
    else if (currentTab.type === 'ui') {
        scriptStore.setActiveScript(null);
    }
  },
  { immediate: true }
);

const handleComponentUpdate = (component) => {
  currentBottomComponent.value = component;
};

watch(
  () => workspaceStore.isBottomBarOpen,
  (isOpen) => {
    layoutRef.value?.setBottomPanel(isOpen);
  }
);

const onLayoutClosePanel = () => {
  if (workspaceStore.isBottomBarOpen) {
    workspaceStore.toggleBottomBar();
  }
};

const onLayoutDragOpen = () => {
  if (!workspaceStore.isBottomBarOpen) {
    workspaceStore.toggleBottomBar();
  }
};
</script>

<template>
  <div class="relative w-full h-full"> 
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
        <TopBar @settings="handleOpenSettings" />
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

    <EditorSettingsModal 
      :is-open="isSettingsModalOpen" 
      @close="isSettingsModalOpen = false" 
    />

    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div 
        v-if="isLoading" 
        class="absolute inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <AppLoading />
      </div>
    </transition>
  </div>
</template>