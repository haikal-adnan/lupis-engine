import { defineStore } from 'pinia';

export const useAssetStore = defineStore('asset', {
  state: () => ({
    assets: [],
    selectedAssetId: null,
    searchQuery: ''
  }),

  getters: {
    textures: (state) => state.assets.filter(a => ['texture', 'sprite', 'image'].includes(a.type)),
    fonts: (state) => state.assets.filter(a => a.type === 'font'),
    getAssetById: (state) => (id) => {
      return state.assets.find(a => a._id === id);
    }
  },

  actions: {
    initAssets(assetList) {
      this.assets = assetList;
    },
    addAsset(asset) {
      this.assets.push(asset);
    },
    removeAsset(assetId) {
      this.assets = this.assets.filter(a => a._id !== assetId);
    }
  }
});