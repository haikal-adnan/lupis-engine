import { useProjectStore } from '@/stores/useProjectStore'
import { useSceneStore } from '@/stores/scene/useSceneStore'
import { useScriptStore } from '@/stores/useScriptStore'
import { useAssetStore } from '@/stores/useAssetStore'
import { usePrefabStore } from '@/stores/usePrefabStore'
import { useFolderStore } from '@/stores/useFolderStore'
// import { useEditorStore } from '@/stores/useEditorStore' // Tidak perlu di-watch

export function useProjectWatcher() {
  const projectStore = useProjectStore()
  
  // Daftar store yang akan dipantau
  const storesToWatch = {
    scene: useSceneStore(),
    script: useScriptStore(),
    asset: useAssetStore(),
    prefab: usePrefabStore(),
    folder: useFolderStore()
  }

  // State UI yang TIDAK boleh memicu status "Dirty" (Merah)
  const IGNORED_KEYS = [
    'isLoading', 
    'error', 
    // UI States dari Script Store
    'selectedNodeId',  
    // UI States dari Folder Store
    'activeFolderId',  
    // UI States dari Asset Store
    'selectedAssetId', 
    'searchQuery',
    'activeScript',
    'activeSceneId',
    'selectedEntityIds'
  ];

  const initWatchers = () => {
    console.log('Initializing Project Watchers...');

    // 1. Watch Project Store (Khusus)
    // Project store perlu perlakuan khusus karena dia yang memegang syncStatus
    projectStore.$subscribe((mutation, state) => {
      // Abaikan jika sedang loading
      if (state.isLoading) return;
      
      // Abaikan jika yang berubah adalah status sync itu sendiri (untuk mencegah loop)
      if (mutation.events && mutation.events.key === 'syncStatus') return;
      
      // Jika syncStatus bukan dirty, tapi ada perubahan data -> tandai Dirty
      if (state.syncStatus !== 'dirty' && state.project) {
        console.log('[Project Store] Change detected -> Marking Dirty');
        projectStore.markAsDirty();
      }
    });

    // 2. Watch Store Lainnya (Looping otomatis)
    Object.entries(storesToWatch).forEach(([storeName, store]) => {
      store.$subscribe((mutation, state) => {
        // Syarat A: Project harus sudah selesai loading
        if (projectStore.isLoading || !projectStore.isProjectLoaded) return;

        // Syarat B: Cek apakah key yang berubah ada di daftar IGNORED_KEYS
        // mutation.events bisa berupa array (jika operasi patch) atau object single
        const events = Array.isArray(mutation.events) ? mutation.events : [mutation.events];
        
        const shouldIgnore = events.every(event => {
            if (!event) return true; // Safety check
            return IGNORED_KEYS.includes(event.key);
        });

        if (shouldIgnore) return;

        // Syarat C: Jika belum dirty, tandai dirty
        if (projectStore.syncStatus !== 'dirty') {
          console.log(`[${storeName.toUpperCase()} Store] Change detected -> Marking Dirty`);
          projectStore.markAsDirty();
        }
      });
    });
  };

  return {
    initWatchers
  };
}