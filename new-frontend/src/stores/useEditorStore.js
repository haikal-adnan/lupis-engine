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
      offsetX: 0,
      offsetY: 0,
      gridEnabled: true,
      gridSize: 32,
      snapToGrid: true
    },
    isPlayMode: false,
    isPaused: false
  }),

  getters: {
    assetBaseUrl: (state) => {
        if (!state.activeProjectId) return '';
        return `${state.config.cdnUrl}/projects/${state.activeProjectId}/`;
    }
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
      this.canvas.offsetX = 0;
      this.canvas.offsetY = 0;
    }
  }
});