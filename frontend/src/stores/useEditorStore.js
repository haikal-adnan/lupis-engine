import { defineStore } from 'pinia';
import { markRaw } from 'vue'; 

export const useEditorStore = defineStore('editor', {
  state: () => ({
    engine: null, 
    
    activeProjectId: null,
    clipboard: {
      type: null, 
      data: null, 
      mode: null,
      cutId: null,
      originalZIndex: null
    },
    config: {
      cdnUrl: import.meta.env.VITE_STORAGE_URL || '',
      isDebug: import.meta.env.VITE_GAME_DEBUG === 'true'
    },
    
    activeTool: 'select', 
    tileSelection: null,
    canvas: { zoom: 1 },

    tilemapContext: { showOthers: true, opacity: 0.3 },

    isResizeModalOpen: false, 
    isPlayMode: false,
    isPaused: false,

    activeTabId: 'scene',
    tabs: [
      { id: 'scene', name: 'Scene - Level 1 Demo', type: 'scene', fixed: true },
    ],

    
    // { id: '4pdh1UKOhoJDZsVy', name: 'animator', type: 'animator', fixed: true },

    activeBottomTabId: 'asset', 
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
  },

  actions: {
    setEngine(instance) {
      this.engine = instance ? markRaw(instance) : null;
    },

    setProjectId(id) {
        this.activeProjectId = id;
    },
    
    setTool(toolName) {
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

    setActiveTab(id) {
        this.activeTabId = id;
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
      this.activeTool = 'select';
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