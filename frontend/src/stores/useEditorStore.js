import { defineStore } from 'pinia';

export const useEditorStore = defineStore('editor', {
  state: () => ({
    activeProjectId: null,
    config: {
      cdnUrl: import.meta.env.VITE_STORAGE_URL || '',
      isDebug: import.meta.env.VITE_GAME_DEBUG === 'true'
    },
    
    activeTool: 'select', 

    canvas: {
      zoom: 1,
    },

    // NEW: Context untuk Grid & Magnet
    gridContext: {
        display: true, // Show/Hide Grid
        width: 50,     // Default Width
        height: 50,    // Default Height
        magnet: true   // Snap Enabled
    },

    tilemapContext: {
      showOthers: true,  
      opacity: 0.3  
    },
    
    isResizeModalOpen: false, 
    isPlayMode: false,
    isPaused: false,

    activeTabId: 'ent_main_tilemap',
    tabs: [
      { id: 'scene', name: 'Main Scene', type: 'scene', fixed: true },
      { id: 'ent_main_tilemap', name: 'Tilemap', type: 'tilemap', fixed: false },
      // { id: 'player-script', name: 'Player.js', type: 'script', fixed: false },
      // { id: 'ai-behavior', name: 'Graph Node', type: 'diagram', fixed: false }
    ]
  }),

  getters: {
    assetBaseUrl: (state) => {
        if (!state.activeProjectId) return '';
        return `${state.config.cdnUrl}/projects/${state.activeProjectId}/`;
    },
    activeTab: (state) => {
        return state.tabs.find(t => t.id === state.activeTabId) || state.tabs[0];
    }
  },

  actions: {
    setProjectId(id) {
        this.activeProjectId = id;
    },
    
    setTool(toolName) {
      this.activeTool = toolName;
      // Sinkronisasi ditangani oleh useEditorToEngine
    },
    
    setZoom(value) {
      this.canvas.zoom = Math.max(0.1, Math.min(value, 5));
    },
    
    resetCanvas() {
      this.canvas.zoom = 1;
      this.canvas.offsetX = 0;
      this.canvas.offsetY = 0;
    },

    toggleContextVisibility() {
      this.tilemapContext.showOthers = !this.tilemapContext.showOthers;
    },

    setContextOpacity(val) {
      const opacity = Math.max(0, Math.min(val, 1));
      this.tilemapContext.opacity = opacity;
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

    toggleGrid() {
      this.gridContext.display = !this.gridContext.display;
    },

    toggleMagnet() {
      this.gridContext.magnet = !this.gridContext.magnet;
    },

    setGridSize(size) {
        this.gridContext.width = size;
        this.gridContext.height = size;
    },
  }
});