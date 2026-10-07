import { defineStore } from 'pinia';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useOPFSActions } from '@opfs/opfs.js';

export const useAssetStore = defineStore('asset', {
  state: () => ({
    assets: [],
    selectedAssetId: null,
    searchQuery: '',
    isUploading: false,
    blobUrlCache: new Map()
  }),

  getters: {
    textures: (state) => state.assets.filter(a => ['texture', 'sprite', 'image'].includes(a.type)),
    fonts: (state) => state.assets.filter(a => a.type === 'font'),
    getAssetById: (state) => (id) => state.assets.find(a => a.id === id)
  },

  actions: {
    setUploading(status) {
      this.isUploading = status;
    },

    initAssets(assetList) {
      this.assets = assetList;
    },

    /**
     * DOMAIN LOGIC: Menentukan struktur path lanjutan spesifik Asset & Workspaces
     */
    async _getAssetDirectories() {
      const workspaceStore = useWorkspaceStore();
      const opfs = useOPFSActions();
      
      const projectId = String(workspaceStore.activeProjectId);

      // 1. Ambil Root Directory "lupis-engine/projects/"
      const projectsRootDir = await opfs.getProjectsRootDirectory();

      // 2. Tentukan path lanjutan internal domain
      const assetsDir = await opfs.resolveDirectoryPath(projectsRootDir, `${projectId}/assets`);
      const workspacesDir = await opfs.resolveDirectoryPath(projectsRootDir, `${projectId}/workspaces`);

      return { assetsDir, workspacesDir };
    },

    async syncAssetsToOPFS() {
      const opfs = useOPFSActions();
      const { workspacesDir } = await this._getAssetDirectories();

      const cleanPayload = this.assets.map(a => ({ ...a }));
      const jsonContent = JSON.stringify(cleanPayload, null, 2);

      await opfs.writeFileToHandle(workspacesDir, 'assets.json', jsonContent);
    },

    async addAsset(asset, rawFile, extraFiles) {
      const opfs = useOPFSActions();
      const { assetsDir } = await this._getAssetDirectories();

      const ext = asset.meta.extension;
      const savedFileName = `${asset.fileKey}${ext}`;

      // Simpan file utama
      await opfs.writeFileToHandle(assetsDir, savedFileName, rawFile);

      // Simpan extra files (seperti .fnt dan .png pada BMFont)
      for (const item of extraFiles) {
        await opfs.writeFileToHandle(assetsDir, item.fileName, item.file);
      }

      this.assets.push(asset);
      await this.syncAssetsToOPFS();
    },

    async moveAsset(assetId, targetFolderId) {
      const asset = this.assets.find(a => a.id === assetId);
      if (asset) {
        asset.folderId = targetFolderId;
        await this.syncAssetsToOPFS();
      }
      return true;
    },

    async removeAsset(assetId) {
      const asset = this.getAssetById(assetId);
      if (!asset) return;

      const opfs = useOPFSActions();
      const { assetsDir } = await this._getAssetDirectories();

      if (this.blobUrlCache.has(assetId)) {
        URL.revokeObjectURL(this.blobUrlCache.get(assetId));
        this.blobUrlCache.delete(assetId);
      }

      const ext = asset.meta.extension;
      const fileName = `${asset.fileKey}${ext}`;
      await opfs.removeFileFromHandle(assetsDir, fileName);

      if (asset.meta.hasBmFont) {
        await opfs.removeFileFromHandle(assetsDir, asset.meta.fntFile);
        for (const pngName of (asset.meta.pngFiles || [])) {
          await opfs.removeFileFromHandle(assetsDir, pngName);
        }
      }

      this.assets = this.assets.filter(a => a.id !== assetId);
      await this.syncAssetsToOPFS();
    },

    async updateAsset(assetId, updates) {
      const asset = this.assets.find(a => a.id === assetId);
      if (asset) {
        Object.assign(asset, updates);
        await this.syncAssetsToOPFS();
      }
    },

    async duplicateAsset(assetId) {
      const original = this.getAssetById(assetId);
      if (!original) return;

      const opfs = useOPFSActions();
      const { assetsDir } = await this._getAssetDirectories();

      const newAsset = JSON.parse(JSON.stringify(original));
      newAsset.id = `asset_${Date.now()}_copy`;
      newAsset.name = `${original.name} (Copy)`;

      const ext = original.meta.extension;
      const originalFileName = `${original.fileKey}${ext}`;

      const randomHex = Math.random().toString(36).substring(2, 10);
      const newFileKey = `copy_${randomHex}_${original.fileKey}`;
      const newFileName = `${newFileKey}${ext}`;

      const oldFileHandle = await assetsDir.getFileHandle(originalFileName);
      const oldFile = await oldFileHandle.getFile();
      await opfs.writeFileToHandle(assetsDir, newFileName, oldFile);

      newAsset.fileKey = newFileKey;

      if (original.meta.hasBmFont) {
        const oldFntHandle = await assetsDir.getFileHandle(original.meta.fntFile);
        const oldFntFile = await oldFntHandle.getFile();
        const newFntName = `${newFileKey}.fnt`;

        await opfs.writeFileToHandle(assetsDir, newFntName, oldFntFile);
        newAsset.meta.fntFile = newFntName;
        newAsset.meta.pngFiles = [];

        for (let i = 0; i < original.meta.pngFiles.length; i++) {
          const oldPngName = original.meta.pngFiles[i];
          const oldPngHandle = await assetsDir.getFileHandle(oldPngName);
          const oldPngFile = await oldPngHandle.getFile();

          const newPngName = original.meta.pngFiles.length === 1
            ? `${newFileKey}.png`
            : `${newFileKey}_${i}.png`;

          await opfs.writeFileToHandle(assetsDir, newPngName, oldPngFile);
          newAsset.meta.pngFiles.push(newPngName);
        }
      }

      this.assets.push(newAsset);
      await this.syncAssetsToOPFS();
    },

    async getAssetUrlById(id) {
      if (this.blobUrlCache.has(id)) {
        return this.blobUrlCache.get(id);
      }

      const asset = this.getAssetById(id);
      if (!asset) return '';

      const opfs = useOPFSActions();
      const { assetsDir } = await this._getAssetDirectories();

      const ext = asset.meta.extension;
      const fileName = `${asset.fileKey}${ext}`;

      const blobUrl = await opfs.getFileBlobUrlFromHandle(assetsDir, fileName);
      this.blobUrlCache.set(id, blobUrl);

      return blobUrl;
    }
  }
});