import { defineStore } from 'pinia';

export const usePrefabStore = defineStore('prefab', {
  state: () => ({
    prefabs: []
  }),

  actions: {
    initPrefabs(prefabList) {
      this.prefabs = prefabList;
    },
    addPrefab(prefab) {
      this.prefabs.push(prefab);
    }
  }
});