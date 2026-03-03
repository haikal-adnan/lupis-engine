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

  // Array untuk menyimpan fungsi unsubscribe dari setiap store
  let unsubscribeFunctions = []

  const initWatchers = () => {
    // Pastikan watcher lama dibersihkan sebelum membuat yang baru
    // agar aman jika initWatchers tidak sengaja terpanggil dua kali
    destroyWatchers()

    Object.entries(storesToWatch).forEach(([storeName, store]) => {
      // $subscribe mengembalikan fungsi untuk berhenti memantau
      const unsubscribe = store.$subscribe((mutation) => {
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
      
      // Simpan ke dalam array
      unsubscribeFunctions.push(unsubscribe)
    })
  }

  const destroyWatchers = () => {
    // Eksekusi semua fungsi unsubscribe yang tersimpan
    unsubscribeFunctions.forEach(unsubscribe => unsubscribe())
    // Kosongkan array setelah dibersihkan
    unsubscribeFunctions = []
  }

  return {
    initWatchers,
    destroyWatchers // Export fungsi ini agar bisa dipanggil oleh useAppInit
  }
}