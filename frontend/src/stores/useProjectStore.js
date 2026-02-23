import { defineStore } from 'pinia'
import { fetchProjectById, fetchProjectResources } from '@/services/api/useFetchProjectById.js'
import { normalizeProjectLoad } from '@/services/schema/schema.js'
import { getProjectFromLocalDB, saveProjectToLocalDB } from '@/services/db/index.js'

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
    error: null,
    syncStatus: 'synced'
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

    async loadProject(projectId) {
      this.isLoading = true
      this.error = null

      const assetStore = useAssetStore()
      const sceneStore = useSceneStore()
      const prefabStore = usePrefabStore()
      const folderStore = useFolderStore()
      const editorStore = useEditorStore()
      const scriptStore = useScriptStore()

      try {
        const localData = await getProjectFromLocalDB(projectId)

        if (localData) {
          this.project = localData.project
          sceneStore.initScenes(localData.scenes || [])
          assetStore.initAssets(localData.assets || [])
          prefabStore.initPrefabs(localData.prefabs || [])
          folderStore.initFolders(localData.folders || [])
          scriptStore.initScripts(localData.scripts || [])
          this.syncStatus = 'local'
        } else {
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
        }

        editorStore.resetCanvas()
        if (this.project) {
          editorStore.setProjectId(this.project._id)
        }
      } catch (err) {
        this.error = err.message
      } finally {
        this.isLoading = false
      }
    },

    async saveProject() {
      if (!this.project) return

      this.isSaving = true 

      try {
        const assetStore = useAssetStore()
        const sceneStore = useSceneStore()
        const prefabStore = usePrefabStore()
        const folderStore = useFolderStore()
        const scriptStore = useScriptStore()
        
        const cleanPayload = {
            project: JSON.parse(JSON.stringify(this.project)),
            
            scenes: sceneStore.scenes 
                ? JSON.parse(JSON.stringify(sceneStore.scenes)) 
                : [],
            
            assets: assetStore.assets 
                ? JSON.parse(JSON.stringify(assetStore.assets)) 
                : [],
            
            prefabs: prefabStore.prefabs 
                ? JSON.parse(JSON.stringify(prefabStore.prefabs)) 
                : [],
            
            folders: folderStore.folders 
                ? JSON.parse(JSON.stringify(folderStore.folders)) 
                : [],

            scripts: scriptStore.scripts 
                ? JSON.parse(JSON.stringify(scriptStore.scripts)) 
                : []
        };

        await saveProjectToLocalDB(cleanPayload)
        this.syncStatus = 'local'
      } catch (err) {
        console.error("SAVE FAILED:", err);
        this.error = 'Failed to save locally'
      } finally {
        this.isSaving = false 
      }
    },

    async saveProjectToServer() {
      if (!this.project) return

      this.isSaving = true 
      try {
        await new Promise(resolve => setTimeout(resolve, 800))
        this.syncStatus = 'synced'
      } catch (err) {
        this.error = 'Failed to sync to server'
      } finally {
        this.isSaving = false 
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
    }
  }
})