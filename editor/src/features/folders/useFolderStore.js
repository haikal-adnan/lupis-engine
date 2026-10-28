// Folder tree state for organizing assets, prefabs, and scripts.

import { defineStore } from 'pinia';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useProjectStore } from '@projects/projects.js';

export const useFolderStore = defineStore('folder', {
  state: () => ({
    folders: [],
    activeFolderId: null,
    sectionActiveFolderId: {
      assets: null,
      scripts: null,
      prefabs: null,
      'prefabs-world': null,
      'prefabs-ui': null
    },
    lastPrefabSection: 'prefabs-world'
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
      this.activeFolderId = null;
      this.sectionActiveFolderId = {
        assets: null,
        scripts: null,
        prefabs: null,
        'prefabs-world': null,
        'prefabs-ui': null
      };
      this.lastPrefabSection = 'prefabs-world';
    },

    getActiveFolder(section = null) {
      const targetSection = section || this._resolveCurrentSection();
      if (this.sectionActiveFolderId && targetSection in this.sectionActiveFolderId) {
        const folderId = this.sectionActiveFolderId[targetSection];
        if (folderId && !this.folders.some(f => f.id === folderId)) {
          this.sectionActiveFolderId[targetSection] = null;
          return null;
        }
        return folderId;
      }
      return this.activeFolderId;
    },

    setActiveFolder(folderId, section = null) {
      this.activeFolderId = folderId;
      const targetSection = section || this._resolveCurrentSection(folderId);
      if (!this.sectionActiveFolderId) {
        this.sectionActiveFolderId = {};
      }
      this.sectionActiveFolderId[targetSection] = folderId;
      if (targetSection && targetSection.startsWith('prefabs-')) {
        this.lastPrefabSection = targetSection;
        this.sectionActiveFolderId['prefabs'] = folderId;
      } else if (targetSection === 'prefabs') {
        const sub = this.lastPrefabSection || 'prefabs-world';
        this.sectionActiveFolderId[sub] = folderId;
      }
    },

    switchSection(newSection, oldSection = null) {
      if (!this.sectionActiveFolderId) {
        this.sectionActiveFolderId = {};
      }

      if (oldSection) {
        let saveKey = oldSection;
        if (saveKey === 'prefabs' && this.lastPrefabSection) {
          saveKey = this.lastPrefabSection;
        }
        this.sectionActiveFolderId[saveKey] = this.activeFolderId;
        if (oldSection === 'prefabs') {
          this.sectionActiveFolderId['prefabs'] = this.activeFolderId;
        }
      }

      let loadKey = newSection;
      if (loadKey === 'prefabs' && this.lastPrefabSection) {
        loadKey = this.lastPrefabSection;
      }
      if (newSection && newSection.startsWith('prefabs-')) {
        this.lastPrefabSection = newSection;
      }

      let restored = this.sectionActiveFolderId[loadKey] ?? null;
      if (restored && !this.folders.some(f => f.id === restored)) {
        this.sectionActiveFolderId[loadKey] = null;
        restored = null;
      }

      this.activeFolderId = restored;
      return this.activeFolderId;
    },

    _resolveCurrentSection(folderId = null) {
      if (folderId) {
        const folder = this.getFolderById(folderId);
        if (folder && folder.section) {
          return folder.section;
        }
      }
      try {
        const workspaceStore = useWorkspaceStore();
        const tab = workspaceStore.activeBottomTabId || 'assets';
        if (tab === 'prefabs') {
          return this.lastPrefabSection || 'prefabs-world';
        }
        return tab;
      } catch (_) {
        return 'assets';
      }
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

    _markDirtyIfReady() {
      const workspaceStore = useWorkspaceStore();
      const projectStore = useProjectStore();
      if (!workspaceStore.isLoading && !workspaceStore.isSaving && projectStore.isProjectLoaded) {
        projectStore.markAsDirty();
      }
    },

    async createFolder(folder) {
      const normalizedFolder = {
        id: folder.id,
        name: folder.name,
        section: folder.section,
        parentId: folder.parentId
      };
      
      this.folders.push(normalizedFolder);
      this._markDirtyIfReady();
      await this.syncFoldersToOPFS();
    },

    async moveFolder(folderId, newParentId) {
      const folderIndex = this.folders.findIndex(f => f.id === folderId);
      if (folderIndex !== -1) {
        this.folders[folderIndex].parentId = newParentId;
        this._markDirtyIfReady();
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
      if (this.sectionActiveFolderId) {
        for (const sec in this.sectionActiveFolderId) {
          if (this.sectionActiveFolderId[sec] === folderId) {
            this.sectionActiveFolderId[sec] = null;
          }
        }
      }
      this._markDirtyIfReady();
      await this.syncFoldersToOPFS();
    },

    async updateFolder(folderId, updates) {
      const folderIndex = this.folders.findIndex(f => f.id === folderId);
      if (folderIndex !== -1) {
        this.folders[folderIndex] = {
          ...this.folders[folderIndex],
          ...updates
        };
        this._markDirtyIfReady();
        await this.syncFoldersToOPFS();
      }
    }
  }
});
