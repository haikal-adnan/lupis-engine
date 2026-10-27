import { defineStore } from 'pinia';

export const useFolderStore = defineStore('folder', {
  state: () => ({
    folders: [],
    activeFolderId: null
  }),

  getters: {
    getFolderById: (state) => (id) => state.folders.find(f => f._id === id),
    projectFolders: (state) => state.folders
  },

  actions: {
    initFolders(folderList) {
      this.folders = folderList;
    },
    
    setActiveFolder(folderId) {
      this.activeFolderId = folderId;
    },
    
    createFolder(folder) {
      this.folders.push(folder);
    },
    
    deleteFolder(folderId) {
      this.folders = this.folders.filter(f => f._id !== folderId);
      if (this.activeFolderId === folderId) {
        this.activeFolderId = null;
      }
    },
    
    updateFolder(folderId, updates) {
      const folderIndex = this.folders.findIndex(f => f._id === folderId);
      if (folderIndex !== -1) {
        this.folders[folderIndex] = {
          ...this.folders[folderIndex],
          ...updates
        };
      }
    }
  }
});