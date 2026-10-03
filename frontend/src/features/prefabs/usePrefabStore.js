import { defineStore } from 'pinia';

export const usePrefabStore = defineStore('prefab', {
  state: () => ({
    prefabs: []
  }),

  getters: {
    getAllPrefabs: (state) => {
      return state.prefabs.map(p => ({
        id: p.id,
        name: p.name,
        folderId: p.folderId,
        thumbnailUrl: null, 
        originalData: p
      }));
    },
    
    getPrefabById: (state) => (id) => {
      return state.prefabs.find(p => p.id === id);
    }
  },

  actions: {
    initPrefabs(prefabList) {
      this.prefabs = prefabList.map(p => ({
        ...p,
        folderId: p.folderId
      }));
    },

    addPrefab(prefab) {
      this.prefabs.push(prefab);
    },

    async movePrefab(prefabId, targetFolderId) {
      const prefab = this.prefabs.find(p => p.id === prefabId);
      prefab.folderId = targetFolderId;
      return true;
    },

    updatePrefab(id, updates) {
      const index = this.prefabs.findIndex(p => p.id === id);
      this.prefabs[index] = { ...this.prefabs[index], ...updates };
    },

    removePrefab(id) {
      this.prefabs = this.prefabs.filter(p => p.id !== id);
    },

    updateComponentProp(prefabId, compName, propName, value) {
      const prefab = this.prefabs.find(p => p.id === prefabId);
      prefab.data.components[compName][propName] = value;
    }
  }
});