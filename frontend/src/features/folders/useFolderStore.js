import { defineStore } from 'pinia';
import { useWorkspaceStore } from '@workspaces/workspaces.js';

export const useFolderStore = defineStore('folder', {
  state: () => ({
    folders: [],
    activeFolderId: null
  }),

  getters: {
    getFolderById: (state) => (id) => state.folders.find(f => f.id === id),
    projectFolders: (state) => state.folders,
    
    getFolderPathString: (state) => (folderId) => {
      if (!folderId) return '';
      const pathParts = [];
      let current = state.folders.find(f => f.id === folderId);
      
      while (current) {
        pathParts.unshift(current.name);
        current = state.folders.find(f => f.id === current.parentId);
      }
      
      return pathParts.join('/');
    }
  },

  actions: {
    initFolders(folderList) {
      this.folders = Array.isArray(folderList) 
        ? folderList.map(f => ({
            id: f.id,
            name: f.name || 'Untitled Folder',
            section: f.section || 'assets',
            parentId: f.parentId || null
          }))
        : [];
    },

    setActiveFolder(folderId) {
      this.activeFolderId = folderId;
    },

    async _getWorkspaceDirHandle() {
      const workspaceStore = useWorkspaceStore();
      const projectId = workspaceStore.activeProjectId;

      if (!projectId) return null;

      const root = await navigator.storage.getDirectory();
      const projectsDir = await root.getDirectoryHandle('projects', { create: true });
      const projectDir = await projectsDir.getDirectoryHandle(String(projectId), { create: true });
      
      return await projectDir.getDirectoryHandle('workspaces', { create: true });
    },

    async syncFoldersToOPFS() {
      try {
        const workspaceDir = await this._getWorkspaceDirHandle();
        if (!workspaceDir) return;

        const cleanFoldersPayload = this.folders.map(f => ({
          id: f.id,
          name: f.name,
          section: f.section || 'assets',
          parentId: f.parentId || null
        }));

        const foldersFileHandle = await workspaceDir.getFileHandle('folders.json', { create: true });
        const writable = await foldersFileHandle.createWritable();
        await writable.write(JSON.stringify(cleanFoldersPayload, null, 2));
        await writable.close();
      } catch (error) {
        console.error('Gagal menyinkronkan folders.json ke OPFS (workspaces):', error);
      }
    },

    async createFolder(folder) {
      const normalizedFolder = {
        id: folder.id,
        name: folder.name,
        section: folder.section || 'assets',
        parentId: folder.parentId || null
      };
      
      this.folders.push(normalizedFolder);
      await this.syncFoldersToOPFS();
    },

    async moveFolder(folderId, newParentId) {
      if (folderId === newParentId) return false;

      let current = this.getFolderById(newParentId);
      while (current) {
        if (current.id === folderId) {
          console.warn('Cannot move folder into its own child directory.');
          return false;
        }
        current = this.getFolderById(current.parentId);
      }

      const folderIndex = this.folders.findIndex(f => f.id === folderId);
      if (folderIndex !== -1) {
        this.folders[folderIndex].parentId = newParentId || null;
        await this.syncFoldersToOPFS();
        return true;
      }
      return false;
    },

    async deleteFolder(folderId) {
      this.folders = this.folders.filter(f => f.id !== folderId);
      if (this.activeFolderId === folderId) {
        this.activeFolderId = null;
      }
      await this.syncFoldersToOPFS();
    },

    async updateFolder(folderId, updates) {
      const folderIndex = this.folders.findIndex(f => f.id === folderId);
      if (folderIndex !== -1) {
        this.folders[folderIndex] = {
          ...this.folders[folderIndex],
          ...updates
        };
        await this.syncFoldersToOPFS();
      }
    }
  }
});