import { defineStore } from 'pinia';
import { toRaw } from 'vue';
import { normalizer } from '@utils/utils.js';
import { useProjectActions } from '@projects/projects.js';
import { usePopAlert } from '@composables/composables.js';
import { engineBridge } from "@engines/engines.js";
import { useAssetStore } from '@assets/assets.js';
import { useSceneStore } from '@scenes/scenes.js';
import { usePrefabStore } from '@prefabs/prefabs.js';
import { useFolderStore } from '@folders/folders.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useScriptStore } from '@scripts/scripts.js';

export const useProjectStore = defineStore('project', {
  state: () => ({
    project: null,
    syncStatus: 'synced',
  }),

  getters: {
    isProjectLoaded: (state) => !!state.project,
    projectName: (state) => state.project?.name || '',
    activeProject: (state) => state.project,
    projectSettings: (state) => ({
      name: state.project?.name,
      tags: state.project?.tags,
      ...state.project?.settings
    })
  },

  actions: {
    markAsDirty() {
      this.syncStatus = 'dirty';
    },

    clearProjectData() {
      this.$reset();
      useSceneStore().$reset();
      useAssetStore().$reset();
      usePrefabStore().$reset();
      useFolderStore().$reset();
      useScriptStore().$reset();
      useWorkspaceStore().$reset();
    },

    async loadProject(projectId) {
      this.clearProjectData();
      const workspaceStore = useWorkspaceStore();
      const assetStore = useAssetStore();
      const sceneStore = useSceneStore();
      const prefabStore = usePrefabStore();
      const folderStore = useFolderStore();
      const scriptStore = useScriptStore();
      const { getProjectById } = useProjectActions();

      workspaceStore.setLoading(true, 'Loading project...');
      workspaceStore.clearError();

      const rawResult = await getProjectById(projectId);
      const { project, assets, scenes, prefabs, folders, scripts } = rawResult;

      const normalizedData = normalizer(
        project,
        scenes,
        assets,
        prefabs,
        folders,
        scripts
      );

      this.project = normalizedData.project;
      sceneStore.initScenes(normalizedData.scenes);
      assetStore.initAssets(normalizedData.assets);
      prefabStore.initPrefabs(normalizedData.prefabs);
      folderStore.initFolders(normalizedData.folders);
      scriptStore.initScripts(normalizedData.scripts);

      workspaceStore.resetCanvas();
      workspaceStore.setProjectId(this.project.id);
      this.syncStatus = 'synced';
      workspaceStore.setLoading(false);
    },

    async syncFromServer() {
      const workspaceStore = useWorkspaceStore();
      const assetStore = useAssetStore();
      const sceneStore = useSceneStore();
      const prefabStore = usePrefabStore();
      const folderStore = useFolderStore();
      const scriptStore = useScriptStore();
      const { showPop } = usePopAlert();
      const { getProjectById } = useProjectActions();

      workspaceStore.setLoading(true, 'Reloading from OPFS storage...');
      workspaceStore.clearError();

      const projectId = this.project.id;
      const { project, assets, scenes, prefabs, folders, scripts } = await getProjectById(projectId);

      const normalizedData = normalizer(
        project,
        scenes,
        assets,
        prefabs,
        folders,
        scripts
      );

      this.project = normalizedData.project;
      sceneStore.initScenes(normalizedData.scenes);
      assetStore.initAssets(normalizedData.assets);
      prefabStore.initPrefabs(normalizedData.prefabs);
      folderStore.initFolders(normalizedData.folders);
      scriptStore.initScripts(normalizedData.scripts);

      this.syncStatus = 'synced';

      const rawPayload = {
        project: toRaw(this.project),
        scene: toRaw(sceneStore.activeScene),
        prefabs: toRaw(prefabStore.prefabs),
        scripts: toRaw(scriptStore.scripts)
      };

      const cleanPayload = JSON.parse(JSON.stringify(rawPayload));
      engineBridge.reloadScene(cleanPayload);

      showPop({
        title: 'Sync Successful',
        message: 'Project data reloaded successfully from OPFS.',
        type: 'success'
      });

      workspaceStore.setLoading(false);
    },

    async saveProjectToServer() {
      const workspaceStore = useWorkspaceStore();
      const { syncProject } = useProjectActions();
      const { showPop } = usePopAlert();

      workspaceStore.setSaving(true, 'Saving changes to OPFS...');

      const sceneStore = useSceneStore();
      const prefabStore = usePrefabStore();
      const scriptStore = useScriptStore();
      const assetStore = useAssetStore();
      const folderStore = useFolderStore();

      // Sync folder & asset structure data to their respective JSON files in OPFS
      await folderStore.syncFoldersToOPFS();
      await assetStore.syncAssetsToOPFS();

      const syncPayload = {
        project: JSON.parse(JSON.stringify(this.project)),
        assets: JSON.parse(JSON.stringify(assetStore.assets)),
        folders: JSON.parse(JSON.stringify(folderStore.folders)),
        scenes: JSON.parse(JSON.stringify(sceneStore.scenes)),
        prefabs: JSON.parse(JSON.stringify(prefabStore.prefabs)),
        scripts: JSON.parse(JSON.stringify(scriptStore.scripts))
      };

      await syncProject(this.project.id, syncPayload);

      this.syncStatus = 'synced';

      showPop({
        title: 'Save Successful',
        message: 'Project saved successfully to OPFS.',
        type: 'success'
      });

      workspaceStore.setSaving(false);
    },

    addSceneToProject(sceneId) {
      this.project.scenes.push(sceneId);
      this.markAsDirty();
    },

    updateProject(updates) {
      Object.assign(this.project, updates);
      this.markAsDirty();
    },

    setInitialSceneId(sceneId) {
      if (this.project?.settings) {
        this.project.settings.initialSceneId = sceneId;
        this.markAsDirty();
      }
    },

    addTag(newTag) {
      const cleanTag = newTag.trim();
      const exists = this.project.tags.some(t => t.toLowerCase() === cleanTag.toLowerCase());
      if (!exists) {
        this.project.tags.push(cleanTag);
        this.markAsDirty();
      }
    },

    removeTag(tagToRemove) {
      this.project.tags = this.project.tags.filter(t => t !== tagToRemove);
      this.markAsDirty();
    },

    setTickRate(rate) {
      this.project.settings.tickRate = rate;
      this.markAsDirty();
    },

    toggleGrid() {
      this.project.settings.grid.visible = !this.project.settings.grid.visible;
      this.markAsDirty();
    },

    toggleMagnet() {
      this.project.settings.grid.snap = !this.project.settings.grid.snap;
      this.markAsDirty();
    },

    setGridSize(width, height) {
      this.project.settings.grid.width = width;
      this.project.settings.grid.height = height || width;
      this.markAsDirty();
    },

    setGridColor(color) {
      this.project.settings.grid.color = color;
      this.markAsDirty();
    },

    setGridOpacity(opacity) {
      this.project.settings.grid.opacity = opacity;
      this.markAsDirty();
    },

    updateUISettings(updates) {
      Object.assign(this.project.settings.ui, updates);
      this.markAsDirty();
    },

    toggleUIBorder() {
      this.project.settings.ui.showUIBorder = !this.project.settings.ui.showUIBorder;
      this.markAsDirty();
    },

    updateCameraSettings(updates) {
      Object.assign(this.project.settings.camera, updates);
      this.markAsDirty();
    },

    updateDebugSettings(updates) {
      Object.assign(this.project.settings.debug, updates);
      this.markAsDirty();
    }
  }
});