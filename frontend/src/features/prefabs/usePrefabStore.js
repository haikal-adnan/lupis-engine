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
        folderId: p.folderId || null,
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
      this.prefabs = Array.isArray(prefabList) 
        ? prefabList.map(p => ({
            ...p,
            folderId: p.folderId || null
          }))
        : [];
    },

    addPrefab(prefab) {
      if (!prefab.folderId) prefab.folderId = null;
      this.prefabs.push(prefab);
    },

    async movePrefab(prefabId, targetFolderId) {
      const prefab = this.prefabs.find(p => p.id === prefabId);
      if (prefab) {
        prefab.folderId = targetFolderId || null;
        return true;
      }
      return false;
    },

    updatePrefab(id, updates) {
      const index = this.prefabs.findIndex(p => p.id === id);
      if (index !== -1) {
        this.prefabs[index] = { ...this.prefabs[index], ...updates };
      }
    },

    removePrefab(id) {
      this.prefabs = this.prefabs.filter(p => p.id !== id);
    },

    updateComponentProp(prefabId, compName, propName, value) {
      const prefab = this.prefabs.find(p => p.id === prefabId);
      if (prefab && prefab.data?.components?.[compName]) {
        prefab.data.components[compName][propName] = value;
      }
    }
  }
});