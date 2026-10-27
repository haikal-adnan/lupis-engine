// Folder tree state for organizing assets, prefabs, and scripts.

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
    
    // Builds slash-delimited breadcrumb path string (e.g. "Sprites/Player")
    getFolderPathString: (state) => (folderId) => {
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
      this.folders = folderList.map(f => ({
        id: f.id,
        name: f.name,
        section: f.section || null,
        parentId: f.parentId || null
      }));
    },

    setActiveFolder(folderId) {
      this.activeFolderId = folderId;
    },

    // Resolves OPFS workspace directory handle for active project
    async _getWorkspaceDirHandle() {
      const workspaceStore = useWorkspaceStore();
      const projectId = workspaceStore.activeProjectId;

      const root = await navigator.storage.getDirectory();
      const appDir = await root.getDirectoryHandle('lupis-engine', { create: true });
      const projectsDir = await appDir.getDirectoryHandle('projects', { create: true });

      const projectDir = await projectsDir.getDirectoryHandle(String(projectId), { create: true });
      return await projectDir.getDirectoryHandle('workspaces', { create: true });
    },

    // Serializes folder hierarchy to folders.json in OPFS
    async syncFoldersToOPFS() {
      const workspaceDir = await this._getWorkspaceDirHandle();

      const cleanFoldersPayload = this.folders.map(f => ({
        id: f.id,
        name: f.name,
        section: f.section,
        parentId: f.parentId
      }));

      const foldersFileHandle = await workspaceDir.getFileHandle('folders.json', { create: true });
      const writable = await foldersFileHandle.createWritable();
      await writable.write(JSON.stringify(cleanFoldersPayload, null, 2));
      await writable.close();
    },

    async createFolder(folder) {
      const normalizedFolder = {
        id: folder.id,
        name: folder.name,
        section: folder.section,
        parentId: folder.parentId
      };
      
      this.folders.push(normalizedFolder);
      await this.syncFoldersToOPFS();
    },

    async moveFolder(folderId, newParentId) {
      const folderIndex = this.folders.findIndex(f => f.id === folderId);
      if (folderIndex !== -1) {
        this.folders[folderIndex].parentId = newParentId;
        await this.syncFoldersToOPFS();
        return true;
      }
      return false;
    },

    async deleteFolder(folderId) {
      this.folders = this.folders.filter(f => f.id !== folderId);
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
