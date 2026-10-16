import { defineStore } from 'pinia';
import { markRaw } from 'vue'; 
import { useSceneStore } from '@scenes/scenes.js'; 

const TAB_SPECIFIC_BOTTOM_TABS = {
  animator: ['timeline']
}

export const useWorkspaceStore = defineStore('workspace', {
  state: () => ({
    engine: null, 
    
    isLoading: false,
    isSaving: false,
    loadingMessage: '',
    error: null,

    // PERSISTENSI: Ambil fallback nilai awal dari localStorage
    activeProjectId: localStorage.getItem('lupis_activeProjectId') || null,
    
    clipboard: {
      type: null, 
      data: null, 
      mode: null,
      cutId: null,
      originalZIndex: null
    },
    config: {
      cdnUrl: import.meta.env.VITE_STORAGE_URL || '',
      backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000',
      isDebug: import.meta.env.VITE_GAME_DEBUG === 'true'
    },
    
    activeTool: 'select', 
    tileSelection: null,
    canvas: { zoom: 1 },

    tilemapContext: { showOthers: true, opacity: 0.3 },

    isResizeModalOpen: false, 
    isSettingsModalOpen: false,
    isPlayMode: false,
    isPaused: false,

    activeTabId: 'scene',
    tabs: [
      { id: 'scene', name: 'Scene Editor', type: 'scene', fixed: true },
    ],

    activeBottomTabId: 'assets', 
    isBottomBarOpen: false,
  }),

  getters: {
    isEngineReady: (state) => state.engine !== null, 
    assetBaseUrl: (state) => {
        if (!state.activeProjectId) return '';
        return `${state.config.cdnUrl}/projects/${state.activeProjectId}/`;
    },
    activeTab: (state) => {
        return state.tabs.find(t => t.id === state.activeTabId) || state.tabs[0];
    },
    currentBottomTab: (state) => state.activeBottomTabId,
    hasClipboardData: (state) => !!state.clipboard.data,
    hasTileSelection: (state) => !!state.tileSelection,
    backendBaseUrl: (state) => state.config.backendUrl,
  },

  actions: {
    setLoading(status, message = '') {
      this.isLoading = status;
      this.loadingMessage = status ? message : '';
    },

    setSaving(status, message = '') {
      this.isSaving = status;
      if (status) {
        this.isLoading = true;
        this.loadingMessage = message;
      } else {
        this.isLoading = false;
        this.loadingMessage = '';
      }
    },

    setError(errMessage) {
      this.error = errMessage;
    },

    clearError() {
      this.error = null;
    },

    setEngine(instance) {
      this.engine = instance ? markRaw(instance) : null;
    },

    setProjectId(id) {
      this.activeProjectId = id;
      if (id) {
        localStorage.setItem('lupis_activeProjectId', id);
      } else {
        localStorage.removeItem('lupis_activeProjectId');
      }
    },
    
    setTool(toolName) {
      if ((toolName === 'brush' || toolName === 'bucket') && !this.tileSelection) {
        return;
      }
      this.activeTool = toolName;
    },
    
    setZoom(value) {
      this.canvas.zoom = Math.max(0.1, Math.min(value, 5));
    },
    
    resetCanvas() {
      this.canvas.zoom = 1;
    },

    setActiveBottomTab(id) {
      this.activeBottomTabId = id;
      this.isBottomBarOpen = true; 
    },

    toggleBottomBar() {
      this.isBottomBarOpen = !this.isBottomBarOpen;
    },

    toggleContextVisibility() {
      this.tilemapContext.showOthers = !this.tilemapContext.showOthers;
    },

    setContextOpacity(val) {
      this.tilemapContext.opacity = Math.max(0, Math.min(val, 1));
    },

    openResizeModal() {
      this.isResizeModalOpen = true;
    },

    closeResizeModal() {
      this.isResizeModalOpen = false;
    },

    openSettingsModal() {
      this.isSettingsModalOpen = true;
    },

    closeSettingsModal() {
      this.isSettingsModalOpen = false;
    },

    toggleSettingsModal() {
      this.isSettingsModalOpen = !this.isSettingsModalOpen;
    },

    setActiveTab(id) {
      const currentTab = this.tabs.find(t => t.id === this.activeTabId)
      const nextTab = this.tabs.find(t => t.id === id)

      if (!nextTab) return

      if (nextTab.type === 'animator') {
        const sceneStore = useSceneStore()
        const entity = sceneStore.activeScene?.entities?.find(e => e.id === nextTab.id)
        if (!entity || entity.prefabId || !entity.components?.SpriteAnimator) {
          this.closeTab(nextTab.id)
          return
        }
      }

      // If switching between different tab types
      if (currentTab && currentTab.type !== nextTab.type) {
        const specificTabs = TAB_SPECIFIC_BOTTOM_TABS[currentTab.type] || []

        // If current bottom bar is specific to previous editor (e.g. timeline in animator)
        if (specificTabs.includes(this.activeBottomTabId)) {
          this.isBottomBarOpen = false
          this.activeBottomTabId = 'assets' // reset to general tab
        }
      }

      this.activeTabId = id
    },
  
    closeTab(id) {
      const index = this.tabs.findIndex(t => t.id === id);
      if (index !== -1 && !this.tabs[index].fixed) {
        if (this.activeTabId === id) {
          const nextTab = this.tabs[index - 1] || this.tabs[index + 1] || this.tabs[0];
          this.setActiveTab(nextTab.id);
        }
        this.tabs.splice(index, 1);
      }
    },
  
    openTab(tabData) {
      const existing = this.tabs.find(t => t.id === tabData.id);
      if (existing) {
        this.setActiveTab(existing.id);
      } else {
        this.tabs.push({
          id: tabData.id,
          name: tabData.name,
          type: tabData.type,
          fixed: false
        });
        this.setActiveTab(tabData.id);
      }
    },

    setTileSelection(rect) {
      this.tileSelection = rect;
      if (rect) this.activeTool = 'brush';
    },
    
    clearTileSelection() {
      this.tileSelection = null;
      if (this.activeTool === 'brush' || this.activeTool === 'bucket') {
        this.activeTool = 'select';
      }
    },

    setClipboard(type, data, mode = 'copy') {
      this.clipboard = {
        type,
        data: JSON.parse(JSON.stringify(data)), 
        mode
      };
    },

    clearClipboard() {
      this.clipboard = { type: null, data: null, mode: null };
    }
  }
});