import { defineStore } from 'pinia';

export const useOPFSStore = defineStore('opfs', {
  state: () => ({
    fileTree: [],        
    activeFile: null,    
    fileContent: '',      
    imageUrl: '',        
    
    isLoading: false,
    isSaving: false,
    errorMessage: '',
    
    allowedExtensions: ['js', 'json', 'png', 'jpg', 'jpeg', 'webp', 'scene', 'prefab']
  }),

getters: {
    hasActiveFile: (state) => !!state.activeFile,
    activeFileName: (state) => state.activeFile?.name || '',
    
    activeFileType: (state) => {
      if (!state.activeFile || state.activeFile.kind !== 'file') return 'none';
      const ext = state.activeFile.name.split('.').pop().toLowerCase();
      if (['js', 'json', 'scene', 'prefab'].includes(ext)) return 'code';
      if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return 'image';
      return 'unsupported';
    }
  },

  actions: {
    setFileTree(tree) {
      this.fileTree = tree;
    },

    setActiveFile(fileItem, content = '', imgUrl = '') {
      if (this.imageUrl) {
        URL.revokeObjectURL(this.imageUrl);
        this.imageUrl = '';
      }

      this.activeFile = fileItem;
      this.fileContent = content;
      this.imageUrl = imgUrl;
    },

    updateActiveContent(newContent) {
      this.fileContent = newContent;
    },

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