import { defineStore } from 'pinia';
import { fetchProjectById, fetchProjectResources } from '@/services/api/project.js';
import { normalizeProjectLoad } from '@/services/schema/schema.js';
import { useAssetStore } from './useAssetStore.js';
import { useSceneStore } from './scene/useSceneStore.js';
import { usePrefabStore } from './usePrefabStore.js';
import { useEditorStore } from './useEditorStore.js';

export const useProjectStore = defineStore('project', {
  state: () => ({
    project: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    isProjectLoaded: (state) => !!state.project,
    projectName: (state) => state.project?.name || 'Untitled Project',
  },

  actions: {
    async loadProject(projectId) {
      this.isLoading = true;
      this.error = null;

      const assetStore = useAssetStore();
      const sceneStore = useSceneStore();
      const prefabStore = usePrefabStore();
      const editorStore = useEditorStore();
      
      try {
        const [rawProject, serverResources] = await Promise.all([
          fetchProjectById(projectId),
          fetchProjectResources(projectId)
        ]);

        const normalizedData = normalizeProjectLoad(
          rawProject,
          serverResources.scenes,
          serverResources.assets,
          serverResources.prefabs
        );

        this.project = normalizedData.project;
        
        sceneStore.initScenes(normalizedData.scenes);
        assetStore.initAssets(normalizedData.assets);
        prefabStore.initPrefabs(normalizedData.prefabs);

        editorStore.resetCanvas();
        editorStore.setTool('select');
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
        if (!this.project.scenes) {
          this.project.scenes = [];
        }
        if (!this.project.scenes.includes(sceneId)) {
          this.project.scenes.push(sceneId);
        }
      }
    }
  }
});