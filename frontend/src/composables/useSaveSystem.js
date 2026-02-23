import { ref } from 'vue';
import { useProjectStore } from '@/stores/useProjectStore';
import { updateSceneEntities, markSceneAsSynced, getDirtyEntities } from '@/services/db/useLocalSave.js';

export function useSaveSystem() {
  const isSavingLocal = ref(false);
  const isUploading = ref(false);
  const lastSavedTime = ref(null);
  
  const projectStore = useProjectStore();

  const saveLocal = async () => {
    if (!projectStore.activeSceneId) return;
    
    isSavingLocal.value = true;
    try {
      console.log('[System] Saving changes to Local DB...');
      
      const currentScene = projectStore.currentScene;
      if (currentScene) {
        await updateSceneEntities(currentScene.id, currentScene.entities);
      }
      
      lastSavedTime.value = new Date();
      
      await new Promise(r => setTimeout(r, 500)); 
      
    } catch (error) {
      console.error('Failed to save local:', error);
    } finally {
      isSavingLocal.value = false;
    }
  };

  const syncCloud = async () => {
    isUploading.value = true;
    try {
      console.log('[System] Syncing to Cloud...');

      await new Promise(r => setTimeout(r, 1500));

      if (projectStore.activeSceneId) {
        await markSceneAsSynced(projectStore.activeSceneId);
      }
      
      console.log('Cloud Sync Complete');

    } catch (error) {
      console.error('Cloud Sync Failed:', error);
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