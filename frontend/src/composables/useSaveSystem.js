import { ref } from 'vue';
import { useProjectStore } from '@/stores/useProjectStore';
import { updateSceneEntities, markSceneAsSynced, getDirtyEntities } from '@/services/db/useLocalSave.js';

export function useSaveSystem() {
  const isSavingLocal = ref(false);
  const isUploading = ref(false);
  const lastSavedTime = ref(null);
  
  const projectStore = useProjectStore();

  // --- 1. SAVE LOCAL (Memory -> IndexedDB) ---
  const saveLocal = async () => {
    if (!projectStore.activeSceneId) return;
    
    isSavingLocal.value = true;
    try {
      console.log('💾 [System] Saving changes to Local DB...');
      
      // Ambil scene aktif dari Store
      const currentScene = projectStore.currentScene;
      if (currentScene) {
        // Simpan entities ke IndexedDB
        // (Di real app, kita hanya simpan yang berubah, tapi untuk aman kita simpan state scene saat ini)
        await updateSceneEntities(currentScene.id, currentScene.entities);
      }
      
      lastSavedTime.value = new Date();
      
      // Simulasi delay agar loading spinner terlihat (UX)
      await new Promise(r => setTimeout(r, 500)); 
      
    } catch (error) {
      console.error('❌ Failed to save local:', error);
    } finally {
      isSavingLocal.value = false;
    }
  };

  // --- 2. CLOUD SYNC (IndexedDB -> API) ---
  const syncCloud = async () => {
    isUploading.value = true;
    try {
      console.log('☁️ [System] Syncing to Cloud...');

      // 1. Cek Entities yang "Dirty" di DB
      // const dirtyData = await getDirtyEntities(projectStore.activeSceneId);
      // if (dirtyData.length === 0) {
      //   console.log('✨ Nothing to sync.');
      //   return;
      // }

      // 2. (TODO) Panggil API Endpoint disini
      // await fetch(`${API_URL}/sync`, { method: 'POST', body: JSON.stringify(dirtyData) });

      // Simulasi Latency Network
      await new Promise(r => setTimeout(r, 1500));

      // 3. Jika sukses, tandai bersih di DB
      if (projectStore.activeSceneId) {
        await markSceneAsSynced(projectStore.activeSceneId);
      }
      
      console.log('✅ Cloud Sync Complete');

    } catch (error) {
      console.error('❌ Cloud Sync Failed:', error);
    } finally {
      isUploading.value = false;
    }
  };

  return {
    isSavingLocal,
    isUploading,
    lastSavedTime,
    saveLocal,
    syncCloud
  };
}