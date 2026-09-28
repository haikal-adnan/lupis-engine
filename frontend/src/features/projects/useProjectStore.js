import { defineStore } from 'pinia'
import { toRaw } from 'vue'
import { normalizer } from '@utils/utils.js'
import { useProjectActions } from '@projects/projects.js'
import { usePopAlert } from '@composables/composables.js'
import { engineBridge } from "@engines/engines.js";
import { useAssetStore } from '@assets/assets.js'
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
    projectName: (state) => state.project?.name || 'Untitled Project',
    activeProject: (state) => state.project,
    projectSettings: (state) => {
      if (!state.project) return {}
      return {
        name: state.project.name,
        tags: state.project.tags || ['Untagged'],
        ...state.project.settings
      }
    }
  },

  actions: {
    markAsDirty() {
      const workspaceStore = useWorkspaceStore()
      if (this.isProjectLoaded && this.syncStatus !== 'dirty' && !workspaceStore.isLoading && !workspaceStore.isSaving) {
        this.syncStatus = 'dirty'
      }
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

      try {
        const rawResult = await getProjectById(projectId);
        const { project, assets, scenes, prefabs, folders, scripts } = rawResult || {};

        const normalizedData = normalizer(
          project,
          scenes || [],
          assets || [],
          prefabs || [],
          folders || [], 
          scripts || []
        );

        this.project = normalizedData.project;
        sceneStore.initScenes(normalizedData.scenes);
        assetStore.initAssets(normalizedData.assets);
        prefabStore.initPrefabs(normalizedData.prefabs);
        folderStore.initFolders(normalizedData.folders || []);
        scriptStore.initScripts(normalizedData.scripts);

        workspaceStore.resetCanvas();
        if (this.project) {
          workspaceStore.setProjectId(this.project.id);
        }
        this.syncStatus = 'synced';

      } catch (err) {
        workspaceStore.setError(err.message);
        throw err;
      } finally {
        workspaceStore.setLoading(false);
      }
    },

    async syncFromServer() {
      if (!this.project || !this.project.id) return
      
      const workspaceStore = useWorkspaceStore()
      const assetStore = useAssetStore()
      const sceneStore = useSceneStore()
      const prefabStore = usePrefabStore()
      const folderStore = useFolderStore()
      const scriptStore = useScriptStore()
      const { showPop } = usePopAlert()
      const { getProjectById } = useProjectActions()

      workspaceStore.setLoading(true, 'Reloading from OPFS storage...')
      workspaceStore.clearError()

      const projectId = this.project.id

      try {
        const { project, assets, scenes, prefabs, folders, scripts } = await getProjectById(projectId)

        const normalizedData = normalizer(
          project,
          scenes || [],
          assets || [],
          prefabs || [],
          folders || [],
          scripts || []
        )

        this.project = normalizedData.project
        sceneStore.initScenes(normalizedData.scenes)
        assetStore.initAssets(normalizedData.assets)
        prefabStore.initPrefabs(normalizedData.prefabs)
        folderStore.initFolders(normalizedData.folders || [])
        scriptStore.initScripts(normalizedData.scripts)
        
        this.syncStatus = 'synced'

        if (workspaceStore.isEngineReady) {
            const rawPayload = {
                project: toRaw(this.project),
                scene: toRaw(sceneStore.activeScene), 
                prefabs: toRaw(prefabStore.prefabs),
                scripts: toRaw(scriptStore.scripts)
            }

            const cleanPayload = JSON.parse(JSON.stringify(rawPayload))
            engineBridge.reloadScene(cleanPayload)
        }

        showPop({
          title: 'Sync Successful',
          message: 'Project data reloaded successfully from OPFS.',
          type: 'success'
        })

      } catch (err) {
        workspaceStore.setError(err.message)
        showPop({
          title: 'Sync Failed',
          message: err.message || 'Failed to reload data from OPFS.',
          type: 'error'
        })
      } finally {
        workspaceStore.setLoading(false)
      }
    },

    async saveProjectToServer() {
      if (!this.project) return

      const workspaceStore = useWorkspaceStore()
      const { syncProject } = useProjectActions()
      const { showPop } = usePopAlert() 

      workspaceStore.setSaving(true, 'Saving changes to OPFS...')

      try {
        const sceneStore = useSceneStore()
        const prefabStore = usePrefabStore()
        const scriptStore = useScriptStore()
        const assetStore = useAssetStore()
        const folderStore = useFolderStore()
        
        if (typeof folderStore.commitFoldersToOPFS === 'function') {
          await folderStore.commitFoldersToOPFS();
        }
        if (typeof assetStore.commitStagedAssetsToOPFS === 'function') {
          await assetStore.commitStagedAssetsToOPFS();
        }

        const syncPayload = {
            project: JSON.parse(JSON.stringify(this.project)),
            assets: assetStore.assets ? JSON.parse(JSON.stringify(assetStore.assets)) : [],
            folders: folderStore.folders ? JSON.parse(JSON.stringify(folderStore.folders)) : [],
            scenes: sceneStore.scenes ? JSON.parse(JSON.stringify(sceneStore.scenes)) : [],
            prefabs: prefabStore.prefabs ? JSON.parse(JSON.stringify(prefabStore.prefabs)) : [],
            scripts: scriptStore.scripts ? JSON.parse(JSON.stringify(scriptStore.scripts)) : []
        }

        await syncProject(this.project.id, syncPayload)
        
        this.syncStatus = 'synced'
        
        showPop({
          title: 'Save Successful',
          message: 'Project saved successfully to OPFS.',
          type: 'success'
        })

      } catch (err) {
        const errMsg = 'Failed to save to OPFS: ' + err.message
        workspaceStore.setError(errMsg)
        
        showPop({
          title: 'Save Failed',
          message: err.message || 'Failed to save data to OPFS.',
          type: 'error'
        })
      } finally {
        workspaceStore.setSaving(false)
      }
    },

    addSceneToProject(sceneId) {
      if (this.project) {
        if (!this.project.scenes) this.project.scenes = []
        if (!this.project.scenes.includes(sceneId)) {
          this.project.scenes.push(sceneId)
          this.markAsDirty()
        }
      }
    },

    updateProject(projectId, updates) {
      if (this.project && this.project.id === projectId) {
        Object.assign(this.project, updates)
        this.markAsDirty()
      }
    },

    addTag(newTag) {
      if (!this.project) return
      if (!this.project.tags) this.project.tags = ['Untagged']

      const cleanTag = newTag.trim()
      if (!cleanTag) return

      const exists = this.project.tags.some(t => t.toLowerCase() === cleanTag.toLowerCase())
      if (!exists) {
        this.project.tags.push(cleanTag)
        this.markAsDirty()
      }
    },

    removeTag(tagToRemove) {
      if (!this.project || !this.project.tags) return
      if (tagToRemove === 'Untagged') return

      this.project.tags = this.project.tags.filter(t => t !== tagToRemove)
      this.markAsDirty()
    },

    setTickRate(rate) {
      if (this.project?.settings) {
        this.project.settings.tickRate = rate
        this.markAsDirty()
      }
    },

    toggleGrid() {
      if (this.project?.settings?.grid) {
        this.project.settings.grid.visible = !this.project.settings.grid.visible
        this.markAsDirty()
      }
    },

    toggleMagnet() {
      if (this.project?.settings?.grid) {
        this.project.settings.grid.snap = !this.project.settings.grid.snap
        this.markAsDirty()
      }
    },

    setGridSize(width, height) {
      if (this.project?.settings?.grid) {
        this.project.settings.grid.width = width
        this.project.settings.grid.height = height || width 
        this.markAsDirty()
      }
    },

    setGridColor(color) {
      if (this.project?.settings?.grid) {
        this.project.settings.grid.color = color
        this.markAsDirty()
      }
    },

    setGridOpacity(opacity) {
      if (this.project?.settings?.grid) {
        this.project.settings.grid.opacity = opacity
        this.markAsDirty()
      }
    },

    updateUISettings(updates) {
      if (this.project?.settings?.ui) {
        Object.assign(this.project.settings.ui, updates)
        this.markAsDirty()
      }
    },

    toggleUIBorder() {
      if (this.project?.settings?.ui) {
        this.project.settings.ui.showUIBorder = !this.project.settings.ui.showUIBorder
        this.markAsDirty()
      }
    },

    updateCameraSettings(updates) {
      if (this.project?.settings?.camera) {
        Object.assign(this.project.settings.camera, updates)
        this.markAsDirty()
      }
    },

    updateDebugSettings(updates) {
      if (this.project?.settings) {
        if (!this.project.settings.debug) {
          this.project.settings.debug = {
            active: true,
            position: 'top-right',
            width: 360,
            height: 220,
            maxLogs: 50
          }
        }
        Object.assign(this.project.settings.debug, updates)
        this.markAsDirty()
      }
    },
  }
})