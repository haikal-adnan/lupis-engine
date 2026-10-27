import { useProjectStore } from '@projects/projects.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useSceneStore } from '@scenes/scenes.js';
import { useScriptStore } from '@scripts/scripts.js';
import { useAssetStore } from '@assets/assets.js'
import { usePrefabStore } from '@prefabs/prefabs.js';
import { useFolderStore } from '@folders/folders.js';

export function useProjectWatcher() {
  const projectStore = useProjectStore()
  const workspaceStore = useWorkspaceStore()

  const storesToWatch = {
    project: projectStore,
    scene: useSceneStore(),
    script: useScriptStore(),
    asset: useAssetStore(),
    prefab: usePrefabStore(),
    folder: useFolderStore()
  }

  const IGNORED_KEYS = [
    'syncStatus',
    'isLoading',
    'isSaving',
    'loadingMessage',
    'error',
    'selectedNodeId',
    'activeFolderId',
    'selectedAssetId',
    'searchQuery',
    'activeScript',
    'activeSceneId',
    'selectedEntityIds',
    'isSettingsModalOpen',
    'isResizeModalOpen'
  ]

  let unsubscribeFunctions = []
  let autoSaveTimer = null
  let beforeUnloadHandler = null

  const checkAndRunAutoSave = async () => {
    if (
      projectStore.project?.settings?.autoSave?.enabled &&
      projectStore.syncStatus === 'dirty' &&
      !workspaceStore.isLoading &&
      !workspaceStore.isSaving &&
      workspaceStore.activeProjectId
    ) {
      try {
        await projectStore.saveProjectToServer({ isAutoSave: true })
      } catch (err) {
        console.error('[AutoSave] Failed:', err)
      }
    }
  }

  const setupAutoSaveTimer = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }

    const autoSaveConfig = projectStore.project?.settings?.autoSave
    if (autoSaveConfig?.enabled && projectStore.isProjectLoaded) {
      const minutes = Math.max(1, Number(autoSaveConfig.interval) || 10)
      const ms = minutes * 60 * 1000
      autoSaveTimer = setInterval(checkAndRunAutoSave, ms)
      if (autoSaveTimer?.unref) autoSaveTimer.unref()
    }
  }

  const initWatchers = () => {
    destroyWatchers()

    Object.entries(storesToWatch).forEach(([storeName, store]) => {
      const unsubscribe = store.$subscribe((mutation) => {
        if (workspaceStore.isLoading || workspaceStore.isSaving || !projectStore.isProjectLoaded) return

        const events = Array.isArray(mutation.events) ? mutation.events : [mutation.events]
        const shouldIgnore = events.every(event => {
          if (!event) return true
          return IGNORED_KEYS.includes(event.key)
        })

        if (shouldIgnore) return

        if (storeName === 'project') {
          setupAutoSaveTimer()
        }

        if (projectStore.syncStatus !== 'dirty') {
          projectStore.markAsDirty()
        }
      }, { flush: 'sync' })
      
      unsubscribeFunctions.push(unsubscribe)
    })

    setupAutoSaveTimer()

    if (typeof window !== 'undefined') {
      beforeUnloadHandler = (e) => {
        if (projectStore.syncStatus === 'dirty') {
          e.preventDefault()
          e.returnValue = ''
        }
      }
      window.addEventListener('beforeunload', beforeUnloadHandler)
    }
  }

  const destroyWatchers = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
    if (typeof window !== 'undefined' && beforeUnloadHandler) {
      window.removeEventListener('beforeunload', beforeUnloadHandler)
      beforeUnloadHandler = null
    }
    unsubscribeFunctions.forEach(unsubscribe => unsubscribe())
    unsubscribeFunctions = []
  }

  return {
    initWatchers,
    destroyWatchers,
    checkAndRunAutoSave,
    setupAutoSaveTimer
  }
}