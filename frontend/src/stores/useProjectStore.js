import { defineStore } from 'pinia';
import { fetchProjectById, fetchProjectResources } from '@/services/api/project.js';
import { normalizeProjectLoad } from '@/services/schema/schema.js';

// ... imports existing ...
import { useAssetStore } from './useAssetStore.js';
import { useSceneStore } from './scene/useSceneStore.js';
import { usePrefabStore } from './usePrefabStore.js';
import { useFolderStore } from './useFolderStore.js'; 
import { useEditorStore } from './useEditorStore.js';
import { useScriptStore } from './useScriptStore.js';

export const useProjectStore = defineStore('project', {
  state: () => ({
    project: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    isProjectLoaded: (state) => !!state.project,
    projectName: (state) => state.project?.name || 'Untitled Project',
    activeProject: (state) => state.project,
    
    // Helper getter untuk akses Tags dan Settings lebih mudah
    projectSettings: (state) => {
        if(!state.project) return {};
        return {
            name: state.project.name,
            tags: state.project.tags || ['Untagged'],
            ...state.project.settings
        }
    }
  },

  actions: {
    async loadProject(projectId) {
      // ... (kode loadProject sama persis seperti sebelumnya) ...
      this.isLoading = true;
      this.error = null;

      const assetStore = useAssetStore();
      const sceneStore = useSceneStore();
      const prefabStore = usePrefabStore();
      const folderStore = useFolderStore(); 
      const editorStore = useEditorStore();
      const scriptStore = useScriptStore();
      
      try {
        const [rawProject, serverResources] = await Promise.all([
          fetchProjectById(projectId),
          fetchProjectResources(projectId)
        ]);

        const normalizedData = normalizeProjectLoad(
          rawProject,
          serverResources.scenes,
          serverResources.assets,
          serverResources.prefabs,
          serverResources.folders,
          serverResources.scripts
        );

        this.project = normalizedData.project;
        
        sceneStore.initScenes(normalizedData.scenes);
        assetStore.initAssets(normalizedData.assets);
        prefabStore.initPrefabs(normalizedData.prefabs);
        folderStore.initFolders(normalizedData.folders); 
        scriptStore.initScripts(normalizedData.scripts);

        editorStore.resetCanvas();
        editorStore.setProjectId(this.project._id); 

      } catch (err) {
        console.error("Project Load Failed:", err);
        this.error = err.message;
      } finally {
        this.isLoading = false;
      }
    },

    addSceneToProject(sceneId) {
       // ... existing code ...
       if (this.project) {
        if (!this.project.scenes) this.project.scenes = [];
        if (!this.project.scenes.includes(sceneId)) {
          this.project.scenes.push(sceneId);
        }
      }
    },

    updateProject(projectId, updates) {
       // ... existing code ...
       if (this.project && this.project._id === projectId) {
        Object.assign(this.project, updates);
      }
    },

    // --- ACTIONS BARU UNTUK TAGS ---
    
    addTag(newTag) {
        if (!this.project) return;
        
        // Inisialisasi jika array belum ada
        if (!this.project.tags) this.project.tags = ['Untagged'];
        
        const cleanTag = newTag.trim();
        if(!cleanTag) return;

        // Cek duplikat (Case Insensitive)
        const exists = this.project.tags.some(t => t.toLowerCase() === cleanTag.toLowerCase());
        
        if (!exists) {
            this.project.tags.push(cleanTag);
            // TODO: Panggil API updateProject di sini untuk save ke DB
        }
    },

    removeTag(tagToRemove) {
        if (!this.project || !this.project.tags) return;
        
        // Jangan hapus tag default 'Untagged'
        if (tagToRemove === 'Untagged') return;

        this.project.tags = this.project.tags.filter(t => t !== tagToRemove);
        // TODO: Panggil API updateProject di sini untuk save ke DB
    }
  }
});