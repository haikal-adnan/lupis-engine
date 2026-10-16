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
    isDirty: (state) => state.syncStatus === 'dirty',
    isSynced: (state) => state.syncStatus === 'synced',
    projectSettings: (state) => ({
      name: state.project?.name,
      description: state.project?.description,
      version: state.project?.version,
      tags: state.project?.tags,
      ...state.project?.settings
    })
  },

  actions: {
    markAsDirty() {
      this.syncStatus = 'dirty';
    },

    markAsSynced() {
      this.syncStatus = 'synced';
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

      workspaceStore.setLoading(true, 'Reloading project from storage...');
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
        title: 'Project Reloaded',
        message: 'Project data reloaded successfully from storage.',
        type: 'success'
      });

      workspaceStore.setLoading(false);
    },

    async saveProjectToServer(options = {}) {
      const workspaceStore = useWorkspaceStore();
      const { syncProject } = useProjectActions();
      const { showPop } = usePopAlert();

      const isAuto = !!options.isAutoSave;
      workspaceStore.setSaving(true, isAuto ? 'Auto-saving project...' : 'Saving project to storage...');

      // Capture last snapshot from scene canvas if available
      try {
        if (typeof document !== 'undefined') {
          const canvas = document.querySelector('canvas');
          if (canvas && canvas.width > 0 && canvas.height > 0) {
            const thumbCanvas = document.createElement('canvas');
            const targetW = 480;
            const targetH = Math.round((canvas.height / canvas.width) * targetW) || 300;
            thumbCanvas.width = targetW;
            thumbCanvas.height = targetH;
            const ctx = thumbCanvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(canvas, 0, 0, targetW, targetH);
              this.project.snapshotUrl = thumbCanvas.toDataURL('image/jpeg', 0.85);
            } else {
              this.project.snapshotUrl = canvas.toDataURL('image/jpeg', 0.85);
            }
          }
        }
      } catch {
        // Fallback gracefully in headless/mock test environments
      }

      const sceneStore = useSceneStore();
      const prefabStore = usePrefabStore();
      const scriptStore = useScriptStore();
      const assetStore = useAssetStore();
      const folderStore = useFolderStore();

      // Sync folder & asset structure data
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

      if (!options.silent) {
        showPop({
          title: isAuto ? 'Auto-Save Successful' : 'Save Successful',
          message: isAuto ? 'Project auto-saved successfully.' : 'Project saved successfully.',
          type: 'success'
        });
      }

      workspaceStore.setSaving(false);
    },

    async triggerAutoSave() {
      if (this.syncStatus === 'dirty' && this.project?.settings?.autoSave?.enabled) {
        await this.saveProjectToServer({ isAutoSave: true });
        return true;
      }
      return false;
    },

    addSceneToProject(sceneId) {
      this.project.scenes.push(sceneId);
      this.markAsDirty();
    },

    updateProject(updates) {
      if (!this.project) return;
      Object.assign(this.project, updates);
      this.markAsDirty();
    },

    updateProjectName(name) {
      if (!this.project) return;
      const cleanName = (name || '').trim();
      if (!cleanName) return;
      this.project.name = cleanName;
      this.markAsDirty();
    },

    updateProjectDescription(description) {
      if (!this.project) return;
      this.project.description = description ?? '';
      this.markAsDirty();
    },

    updateProjectVersion(version) {
      if (!this.project) return;
      this.project.version = (version || '').trim() || '1.0.0';
      this.markAsDirty();
    },

    updateProjectThumbnail(thumbnailUrl) {
      if (!this.project) return;
      this.project.thumbnailUrl = thumbnailUrl || null;
      this.markAsDirty();
    },

    updateProjectSnapshot(snapshotUrl) {
      if (!this.project) return;
      this.project.snapshotUrl = snapshotUrl || null;
      this.markAsDirty();
    },

    updateAutoSaveSettings(updates) {
      if (!this.project) return;
      if (!this.project.settings) this.project.settings = {};
      if (!this.project.settings.autoSave) {
        this.project.settings.autoSave = { enabled: false, interval: 10 };
      }
      Object.assign(this.project.settings.autoSave, updates);
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

    toggleSmartGuides() {
      const current = this.project?.settings?.ui?.smartGuides !== false;
      this.updateUISettings({ smartGuides: !current });
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