import { defineStore } from 'pinia';

export const useAssetStore = defineStore('asset', {
  state: () => ({
    assets: [],
    selectedAssetId: null,
    searchQuery: ''
  }),

  getters: {
    // Filter untuk tekstur (support berbagai naming convention)
    textures: (state) => state.assets.filter(a => ['texture', 'sprite', 'image'].includes(a.type)),
    
    // Filter untuk font
    fonts: (state) => state.assets.filter(a => a.type === 'font'),
    
    // Helper ambil asset by ID
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
    },

    /**
     * Memperbarui properti asset yang sudah ada.
     * Berguna untuk mengubah status isSynced: true setelah upload selesai,
     * atau mengupdate nama asset.
     */
    updateAsset(assetId, updates) {
      const asset = this.assets.find(a => a._id === assetId);
      if (asset) {
        // Menggabungkan object updates ke dalam asset asli secara reaktif
        Object.assign(asset, updates);
      }
    }
  }
});