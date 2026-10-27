// OPFS directory tree hierarchy, file viewer state, and storage I/O status.

import { defineStore } from 'pinia';
import { opfsSchema, opfsItemSchema, getFileTypeByExtension } from '@opfs/opfs.js';

export const useOPFSStore = defineStore('opfs', {
  state: () => opfsSchema(),

  getters: {
    hasActiveFile: (state) => Boolean(state.activeFile),
    
    activeFileName: (state) => {
      if (state.activeFile && state.activeFile.name) {
        return state.activeFile.name;
      }
      return '';
    },

    activeFileType: (state) => {
      if (state.activeFile && state.activeFile.name) {
        return getFileTypeByExtension(state.activeFile.name);
      }
      return null;
    }
  },

  actions: {
    setFileTree(tree) {
      this.fileTree = tree.map(opfsItemSchema);
    },

    // Sets active file node, revoking any previous image URL
    setActiveFile(fileItem, content = '', imgUrl = '') {
      if (this.imageUrl) {
        URL.revokeObjectURL(this.imageUrl);
      }
      this.activeFile = opfsItemSchema(fileItem);
      this.fileContent = content;
      this.imageUrl = imgUrl;
    },

    updateActiveContent(newContent) {
      this.fileContent = newContent;
    },

    // Closes active file and revokes preview image URL
    clearActiveFile() {
      if (this.imageUrl) {
        URL.revokeObjectURL(this.imageUrl);
      }
      this.activeFile = null;
      this.fileContent = '';
      this.imageUrl = '';
    },

    setLoading(status) {
      this.isLoading = status;
    },

    setSaving(status) {
      this.isSaving = status;
    },

    setError(message) {
      this.errorMessage = message;
    }
  }
});
