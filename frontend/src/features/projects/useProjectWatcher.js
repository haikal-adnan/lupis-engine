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
    scene: useSceneStore(),
    script: useScriptStore(),
    asset: useAssetStore(),
    prefab: usePrefabStore(),
    folder: useFolderStore()
  }

  const IGNORED_KEYS = [
    'isLoading',
    'isSaving',
    'error',
    'selectedNodeId',
    'activeFolderId',
    'selectedAssetId',
    'searchQuery',
    'activeScript',
    'activeSceneId',
    'selectedEntityIds'
  ]

  let unsubscribeFunctions = []

  const initWatchers = () => {
    destroyWatchers()

    Object.entries(storesToWatch).forEach(([storeName, store]) => {
      const unsubscribe = store.$subscribe((mutation) => {
        if (workspaceStore.isLoading || projectStore.isSaving || !projectStore.isProjectLoaded) return

        const events = Array.isArray(mutation.events) ? mutation.events : [mutation.events]
        const shouldIgnore = events.every(event => {
          if (!event) return true
          return IGNORED_KEYS.includes(event.key)
        })

        if (shouldIgnore) return

        if (projectStore.syncStatus !== 'dirty') {
          projectStore.markAsDirty()
        }
      })
      
      unsubscribeFunctions.push(unsubscribe)
    })
  }

  const destroyWatchers = () => {
    unsubscribeFunctions.forEach(unsubscribe => unsubscribe())
    unsubscribeFunctions = []
  }

  return {
    initWatchers,
    destroyWatchers 
  }
}