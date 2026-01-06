import { defineStore } from 'pinia';

export const useSceneStore = defineStore('scene', {
  state: () => ({
    scenes: [],      
    activeSceneId: null,
    selectedEntityIds: [] 
  }),

  getters: {
    getSceneById: (state) => (id) => {
        return state.scenes.find(s => s._id === id);
    },
    activeScene: (state) => {
        return state.scenes.find(s => s._id === state.activeSceneId);
    }
  },

  actions: {
    initScenes(sceneList) {
      this.scenes = Array.isArray(sceneList) ? sceneList : [];
      
      if (this.scenes.length > 0 && !this.activeSceneId) {
        const first = this.scenes[0];
        this.activeSceneId = first._id; 
      }
    },
    setActiveScene(sceneId) {
      // Cari scene berdasarkan _id
      const scene = this.scenes.find(s => s._id === sceneId);
      if (scene) {
        this.activeSceneId = scene._id; 
        this.selectedEntityIds = [];
      }
    },
    addEntityToActiveScene(entity) {
      const scene = this.activeScene;
      if (!scene) return;
      if (!scene.entities) scene.entities = [];
      scene.entities.push(entity);
    }
  }
});