import { useProjectStore } from '@/stores/useProjectStore'
import { useSceneStore } from '@/stores/scene/useSceneStore'
import { useScriptStore } from '@/stores/useScriptStore'
import { useAssetStore } from '@/stores/useAssetStore'
import { usePrefabStore } from '@/stores/usePrefabStore'
import { useFolderStore } from '@/stores/useFolderStore'

export function useProjectWatcher() {
  const projectStore = useProjectStore()

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

  const initWatchers = () => {

    Object.entries(storesToWatch).forEach(([storeName, store]) => {
      store.$subscribe((mutation) => {
        if (projectStore.isLoading || projectStore.isSaving || !projectStore.isProjectLoaded) return

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
    })
  }

  return {
    initWatchers
  }
}