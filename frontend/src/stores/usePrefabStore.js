import { defineStore } from 'pinia';

export const usePrefabStore = defineStore('prefab', {
  state: () => ({
    prefabs: []
  }),

  getters: {
    getAllPrefabs: (state) => {
      return state.prefabs.map(p => ({
        id: p._id,
        name: p.name,
        thumbnailUrl: null, 
        originalData: p
      }));
    },
    
    getPrefabById: (state) => (id) => {
      return state.prefabs.find(p => p._id === id);
    }
  },

  actions: {
    initPrefabs(prefabList) {
      // Dipanggil oleh useProjectStore saat loadProject
      this.prefabs = prefabList || [];
    },

    addPrefab(prefab) {
      this.prefabs.push(prefab);
    },

    updatePrefab(id, updates) {
      const index = this.prefabs.findIndex(p => p._id === id);
      if (index !== -1) {
        this.prefabs[index] = { ...this.prefabs[index], ...updates };
      }
    },

    removePrefab(id) {
      this.prefabs = this.prefabs.filter(p => p._id !== id);
    },

    updateComponentProp(prefabId, compName, propName, value) {
      const prefab = this.prefabs.find(p => p._id === prefabId);
      if (prefab && prefab.data.components[compName]) {
        prefab.data.components[compName][propName] = value;
      }
    }
  }
});