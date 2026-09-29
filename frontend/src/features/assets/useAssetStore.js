import { defineStore } from 'pinia';
import { useWorkspaceStore } from '@workspaces/workspaces.js';

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
      this.assets = Array.isArray(assetList) ? assetList : [];
    },

    async _getOPFSDirectories() {
      const workspaceStore = useWorkspaceStore();
      const projectId = workspaceStore.activeProjectId;

      if (!projectId) return null;

      const root = await navigator.storage.getDirectory();
      const projectsDir = await root.getDirectoryHandle('projects', { create: true });
      const projectDir = await projectsDir.getDirectoryHandle(String(projectId), { create: true });
      const assetsDir = await projectDir.getDirectoryHandle('assets', { create: true });
      
      const workspacesDir = await projectDir.getDirectoryHandle('workspaces', { create: true });

      return { assetsDir, workspacesDir };
    },

    async syncAssetsToOPFS() {
      try {
        const dirs = await this._getOPFSDirectories();
        if (!dirs) return;

        const cleanPayload = this.assets.map(a => ({ ...a }));
        const fileHandle = await dirs.workspacesDir.getFileHandle('assets.json', { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(cleanPayload, null, 2));
        await writable.close();
      } catch (err) {
        console.error('Gagal menyinkronkan assets.json ke OPFS (workspaces):', err);
      }
    },

    async addAsset(asset, rawFile = null, extraFiles = []) {
      if (!asset.id) asset.id = `asset_${Date.now()}`;

      const dirs = await this._getOPFSDirectories();

      if (rawFile && dirs) {
        const ext = asset.meta?.extension || '';
        const savedFileName = `${asset.fileKey}${ext}`;

        const fileHandle = await dirs.assetsDir.getFileHandle(savedFileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(rawFile);
        await writable.close();
      }

      if (Array.isArray(extraFiles) && extraFiles.length > 0 && dirs) {
        for (const item of extraFiles) {
          if (item.file && item.fileName) {
            const extraHandle = await dirs.assetsDir.getFileHandle(item.fileName, { create: true });
            const writable = await extraHandle.createWritable();
            await writable.write(item.file);
            await writable.close();
          }
        }
      }

      this.assets.push(asset);
      await this.syncAssetsToOPFS();
    },

    async moveAsset(assetId, targetFolderId) {
      const asset = this.assets.find(a => a.id === assetId);
      if (asset) {
        asset.folderId = targetFolderId || null;
        await this.syncAssetsToOPFS();
        return true;
      }
      return false;
    },

    async removeAsset(assetId) {
      const asset = this.getAssetById(assetId);
      
      if (this.blobUrlCache.has(assetId)) {
        URL.revokeObjectURL(this.blobUrlCache.get(assetId));
        this.blobUrlCache.delete(assetId);
      }

      if (asset?.fileKey) {
        try {
          const dirs = await this._getOPFSDirectories();
          if (dirs) {
            const ext = asset.meta?.extension || '';
            const fileName = `${asset.fileKey}${ext}`;
            await dirs.assetsDir.removeEntry(fileName).catch(() => {});

            if (asset.meta?.hasBmFont) {
              if (asset.meta?.fntFile) {
                await dirs.assetsDir.removeEntry(asset.meta.fntFile).catch(() => {});
              }
              if (Array.isArray(asset.meta?.pngFiles)) {
                for (const pngName of asset.meta.pngFiles) {
                  await dirs.assetsDir.removeEntry(pngName).catch(() => {});
                }
              }
            }
          }
        } catch (err) {
          console.warn(`File OPFS tidak ditemukan saat menghapus asset: ${asset.fileKey}`, err);
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

      const newAsset = JSON.parse(JSON.stringify(original));
      newAsset.id = `asset_${Date.now()}_copy`;
      newAsset.name = `${original.name} (Copy)`;

      if (original.fileKey) {
        try {
          const dirs = await this._getOPFSDirectories();
          if (dirs) {
            const ext = original.meta?.extension || '';
            const originalFileName = `${original.fileKey}${ext}`;
            
            const randomHex = Math.random().toString(36).substring(2, 10);
            const newFileKey = `copy_${randomHex}_${original.fileKey}`;
            const newFileName = `${newFileKey}${ext}`;

            const oldFileHandle = await dirs.assetsDir.getFileHandle(originalFileName);
            const oldFile = await oldFileHandle.getFile();

            const newFileHandle = await dirs.assetsDir.getFileHandle(newFileName, { create: true });
            const writable = await newFileHandle.createWritable();
            await writable.write(oldFile);
            await writable.close();

            newAsset.fileKey = newFileKey;

            if (original.meta?.hasBmFont) {
              if (original.meta?.fntFile) {
                const oldFntHandle = await dirs.assetsDir.getFileHandle(original.meta.fntFile);
                const oldFntFile = await oldFntHandle.getFile();
                const newFntName = `${newFileKey}.fnt`;

                const newFntHandle = await dirs.assetsDir.getFileHandle(newFntName, { create: true });
                const fntWritable = await newFntHandle.createWritable();
                await fntWritable.write(oldFntFile);
                await fntWritable.close();

                newAsset.meta.fntFile = newFntName;
              }

              if (Array.isArray(original.meta?.pngFiles)) {
                newAsset.meta.pngFiles = [];
                for (let i = 0; i < original.meta.pngFiles.length; i++) {
                  const oldPngName = original.meta.pngFiles[i];
                  const oldPngHandle = await dirs.assetsDir.getFileHandle(oldPngName);
                  const oldPngFile = await oldPngHandle.getFile();

                  const newPngName = original.meta.pngFiles.length === 1 
                    ? `${newFileKey}.png` 
                    : `${newFileKey}_${i}.png`;

                  const newPngHandle = await dirs.assetsDir.getFileHandle(newPngName, { create: true });
                  const pngWritable = await newPngHandle.createWritable();
                  await pngWritable.write(oldPngFile);
                  await pngWritable.close();

                  newAsset.meta.pngFiles.push(newPngName);
                }
              }
            }
          }
        } catch (err) {
          console.error('Gagal menyalin file fisik OPFS saat duplikasi:', err);
        }
      }

      this.assets.push(newAsset);
      await this.syncAssetsToOPFS();
    },

    async getAssetUrlById(id) {
      const asset = this.getAssetById(id);
      if (!asset) return null;

      if (this.blobUrlCache.has(id)) {
        return this.blobUrlCache.get(id);
      }

      if (asset.fileKey) {
        try {
          const dirs = await this._getOPFSDirectories();
          if (!dirs) return null;

          const ext = asset.meta?.extension || '';
          const fileName = `${asset.fileKey}${ext}`;

          const fileHandle = await dirs.assetsDir.getFileHandle(fileName);
          const file = await fileHandle.getFile();
          
          const blobUrl = URL.createObjectURL(file);
          this.blobUrlCache.set(id, blobUrl);

          return blobUrl;
        } catch (err) {
          console.error(`Gagal membaca file OPFS untuk asset ID ${id}:`, err);
          return null;
        }
      }

      return asset.fileUrl || null;
    }
  }
});