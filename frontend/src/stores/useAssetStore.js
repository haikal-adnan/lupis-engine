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
    getAssetById: (state) => (id) => state.assets.find(a => a._id === id)
  },

  actions: {
    initAssets(assetList) {
      this.assets = assetList;
    },

    addAsset(asset) {
      if(!asset._id) asset._id = `asset_${Date.now()}`;
      this.assets.push(asset);
    },

    removeAsset(assetId) {
      this.assets = this.assets.filter(a => a._id !== assetId);
    },

    updateAsset(assetId, updates) {
      const asset = this.assets.find(a => a._id === assetId);
      if (asset) {
        Object.assign(asset, updates);
      }
    },

    // [BARU] Action untuk duplicate asset
    duplicateAsset(assetId) {
      const original = this.assets.find(a => a._id === assetId);
      if (!original) return;

      // Clone object asset
      const newAsset = JSON.parse(JSON.stringify(original));
      newAsset._id = `asset_${Date.now()}_copy`; // ID Baru
      newAsset.name = `${original.name} (Copy)`; // Nama default duplicate
      newAsset.isSynced = true; // Asumsi duplikat langsung synced
      
      this.assets.push(newAsset);
    }
  }
});