import { defineStore } from 'pinia';
import { fetchProjectById, fetchProjectResources } from '@/services/api/project.js';
import { normalizeProjectLoad } from '@/services/schema/schema.js';

// Import semua store terkait
import { useAssetStore } from './useAssetStore.js';
import { useSceneStore } from './scene/useSceneStore.js';
import { usePrefabStore } from './usePrefabStore.js';
import { useFolderStore } from './useFolderStore.js'; // <--- Import baru
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

      // Inisialisasi instance store
      const assetStore = useAssetStore();
      const sceneStore = useSceneStore();
      const prefabStore = usePrefabStore();
      const folderStore = useFolderStore(); // <--- Instance baru
      const editorStore = useEditorStore();
      
      try {
        // Asumsi: fetchProjectResources mengembalikan { scenes, assets, prefabs, folders }
        const [rawProject, serverResources] = await Promise.all([
          fetchProjectById(projectId),
          fetchProjectResources(projectId)
        ]);

        // Lakukan Normalisasi
        const normalizedData = normalizeProjectLoad(
          rawProject,
          serverResources.scenes,
          serverResources.assets,
          serverResources.prefabs,
          serverResources.folders // <--- Pass raw folders
        );

        // Set State Project Utama
        this.project = normalizedData.project;
        
        // Distribusikan data ke Store masing-masing
        sceneStore.initScenes(normalizedData.scenes);
        assetStore.initAssets(normalizedData.assets);
        prefabStore.initPrefabs(normalizedData.prefabs);
        folderStore.initFolders(normalizedData.folders); // <--- Init folders

        // Setup Editor
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