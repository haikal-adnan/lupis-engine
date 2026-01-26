import { defineStore } from 'pinia';
import { fetchProjectById, fetchProjectResources } from '@/services/api/project.js';
import { normalizeProjectLoad } from '@/services/schema/schema.js';

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
       if (this.project) {
        if (!this.project.scenes) this.project.scenes = [];
        if (!this.project.scenes.includes(sceneId)) {
          this.project.scenes.push(sceneId);
        }
      }
    },

    updateProject(projectId, updates) {
       if (this.project && this.project._id === projectId) {
        Object.assign(this.project, updates);
      }
    },

    
    addTag(newTag) {
        if (!this.project) return;
        
        if (!this.project.tags) this.project.tags = ['Untagged'];
        
        const cleanTag = newTag.trim();
        if(!cleanTag) return;

        const exists = this.project.tags.some(t => t.toLowerCase() === cleanTag.toLowerCase());
        
        if (!exists) {
            this.project.tags.push(cleanTag);
        }
    },

    removeTag(tagToRemove) {
        if (!this.project || !this.project.tags) return;
        
        if (tagToRemove === 'Untagged') return;

        this.project.tags = this.project.tags.filter(t => t !== tagToRemove);
    }
  }
});