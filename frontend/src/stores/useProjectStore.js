import { defineStore } from 'pinia'
import { toRaw } from 'vue'
import { fetchProjectById, fetchProjectResources } from '@/services/api/useFetchProjectById.js'
import { normalizeProjectLoad } from '@/services/schema/schema.js'
import { useProjectBackend } from '@/services/api/backend/useProjectBackend.js'
import { usePopAlert } from '@/composables/usePopAlert.js'
import { EngineBridge } from '@/services/engine/EngineBridge.js'
import { useAssetStore } from './useAssetStore.js'
import { useSceneStore } from './scene/useSceneStore.js'
import { usePrefabStore } from './usePrefabStore.js'
import { useFolderStore } from './useFolderStore.js'
import { useEditorStore } from './useEditorStore.js'
import { useScriptStore } from './useScriptStore.js'

export const useProjectStore = defineStore('project', {
  state: () => ({
    project: null,
    isLoading: false, 
    isSaving: false,
    syncStatus: 'synced',
    loadingMessage: ''
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
      if (this.isProjectLoaded && this.syncStatus !== 'dirty' && !this.isLoading && !this.isSaving) {
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
        useEditorStore().$reset();
    },

    async loadProject(projectId) {

      this.clearProjectData();

      this.isLoading = true
      this.loadingMessage = 'Memuat project data...'
      this.error = null

      const assetStore = useAssetStore()
      const sceneStore = useSceneStore()
      const prefabStore = usePrefabStore()
      const folderStore = useFolderStore()
      const editorStore = useEditorStore()
      const scriptStore = useScriptStore()

      try {
        const [rawProject, serverResources] = await Promise.all([
          fetchProjectById(projectId),
          fetchProjectResources(projectId)
        ])

        const normalizedData = normalizeProjectLoad(
          rawProject,
          serverResources.scenes,
          serverResources.assets,
          serverResources.prefabs,
          serverResources.folders,
          serverResources.scripts
        )

        this.project = normalizedData.project
        sceneStore.initScenes(normalizedData.scenes)
        assetStore.initAssets(normalizedData.assets)
        prefabStore.initPrefabs(normalizedData.prefabs)
        folderStore.initFolders(normalizedData.folders)
        scriptStore.initScripts(normalizedData.scripts)

        editorStore.resetCanvas()
        if (this.project) {
          editorStore.setProjectId(this.project._id)
        }
        this.syncStatus = 'synced'
      } catch (err) {
        this.error = err.message
      } finally {
        this.isLoading = false
        this.loadingMessage = ''
      }
    },

    async syncFromServer() {
      if (!this.project || !this.project._id) return
      
      this.isLoading = true
      this.loadingMessage = 'Menarik data terbaru dari server...'
      this.error = null
      
      const projectId = this.project._id
      const assetStore = useAssetStore()
      const sceneStore = useSceneStore()
      const prefabStore = usePrefabStore()
      const folderStore = useFolderStore()
      const editorStore = useEditorStore()
      const scriptStore = useScriptStore()
      const { showPop } = usePopAlert()

      try {
        const [rawProject, serverResources] = await Promise.all([
          fetchProjectById(projectId),
          fetchProjectResources(projectId)
        ])

        const normalizedData = normalizeProjectLoad(
          rawProject,
          serverResources.scenes,
          serverResources.assets,
          serverResources.prefabs,
          serverResources.folders,
          serverResources.scripts
        )

        this.project = normalizedData.project
        sceneStore.initScenes(normalizedData.scenes)
        assetStore.initAssets(normalizedData.assets)
        prefabStore.initPrefabs(normalizedData.prefabs)
        folderStore.initFolders(normalizedData.folders)
        scriptStore.initScripts(normalizedData.scripts)
        
        this.syncStatus = 'synced'

        if (editorStore.isEngineReady) {
            const rawPayload = {
                project: toRaw(this.project),
                scene: toRaw(sceneStore.activeScene), 
                prefabs: toRaw(prefabStore.prefabs),
                scripts: toRaw(scriptStore.scripts)
            }

            const cleanPayload = JSON.parse(JSON.stringify(rawPayload))

            EngineBridge.reloadScene(cleanPayload)
        }

        showPop({
          title: 'Sync Berhasil',
          message: 'Data terbaru berhasil ditarik dari server.',
          type: 'success'
        })

      } catch (err) {
        this.error = err.message
        showPop({
          title: 'Sync Gagal',
          message: err.message || 'Gagal menarik data dari server.',
          type: 'error'
        })
      } finally {
        this.isLoading = false
        this.loadingMessage = ''
      }
    },

    async saveProjectToServer() {
      if (!this.project) return

      this.isSaving = true 
      this.isLoading = true 
      this.loadingMessage = 'Menyimpan perubahan ke server...'

      const { syncProject } = useProjectBackend()
      const { showPop } = usePopAlert() 

      try {
        const sceneStore = useSceneStore()
        const prefabStore = usePrefabStore()
        const scriptStore = useScriptStore()
        
        const syncPayload = {
            project: JSON.parse(JSON.stringify(this.project)),
            scenes: sceneStore.scenes 
                ? JSON.parse(JSON.stringify(sceneStore.scenes)) 
                : [],
            prefabs: prefabStore.prefabs 
                ? JSON.parse(JSON.stringify(prefabStore.prefabs)) 
                : [],
            scripts: scriptStore.scripts 
                ? JSON.parse(JSON.stringify(scriptStore.scripts)) 
                : []
        }

        console.log( JSON.parse(JSON.stringify(prefabStore.prefabs)) )

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Koneksi timeout. Server tidak merespon dalam 10 detik.')), 10000)
        })

        await Promise.race([
          syncProject(this.project._id, syncPayload),
          timeoutPromise
        ])
        
        this.syncStatus = 'synced'
        
        showPop({
          title: 'Save Berhasil',
          message: 'Project berhasil disimpan ke server.',
          type: 'success'
        })

      } catch (err) {
        console.error("SAVE FAILED:", err)
        this.error = 'Failed to sync to server: ' + err.message
        
        showPop({
          title: 'Save Gagal',
          message: err.message || 'Gagal menyimpan data ke server.',
          type: 'error'
        })
      } finally {
        this.isSaving = false 
        this.isLoading = false 
        this.loadingMessage = ''
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
      if (this.project && this.project._id === projectId) {
        
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
  }
})