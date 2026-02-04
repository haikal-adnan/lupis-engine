import { defineStore } from 'pinia';

export const useEditorStore = defineStore('editor', {
  state: () => ({
    activeProjectId: null,
    config: {
      cdnUrl: import.meta.env.VITE_STORAGE_URL || '',
      isDebug: import.meta.env.VITE_GAME_DEBUG === 'true'
    },
    
    activeTool: 'select', 
    tileSelection: null,
    canvas: {
      zoom: 1,
    },

    tilemapContext: {
      showOthers: true,  
      opacity: 0.3  
    },

    showUIBorder: true,
    isResizeModalOpen: false, 
    isPlayMode: false,
    isPaused: false,

    activeTabId: 'scene',
    tabs: [
      { id: 'scene', name: 'Scene - Level 1 Demo', type: 'scene', fixed: true },
    ],

    activeBottomTabId: 'asset', 
    isBottomBarOpen: false,
  }),

  getters: {
    assetBaseUrl: (state) => {
        if (!state.activeProjectId) return '';
        return `${state.config.cdnUrl}/projects/${state.activeProjectId}/`;
    },
    activeTab: (state) => {
        return state.tabs.find(t => t.id === state.activeTabId) || state.tabs[0];
    },
    currentBottomTab: (state) => state.activeBottomTabId
  },

  actions: {
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

    toggleUIBorder() {
        this.showUIBorder = !this.showUIBorder;
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
    }
  }
});