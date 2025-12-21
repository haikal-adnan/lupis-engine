// 1. Tambahkan import toRaw
import { ref, computed, toRaw } from "vue"; 
import { useLocalDB } from "@/composables/useLocalDB.js";
import { getDirtyEntities, markSceneAsSynced } from "@/services/sceneService.js";

const unsavedChanges = ref([]);
const isSavingLocal = ref(false);
const isUploading = ref(false);
const hasPendingCloudSync = ref(false);

export function useSyncManager() {
  const { saveEntitiesToLocal } = useLocalDB();

  const syncStatus = computed(() => {
    if (unsavedChanges.value.length > 0) return 'RED';
    if (hasPendingCloudSync.value) return 'BLUE';
    return 'GREEN';
  });

  const indicatorColor = computed(() => {
    switch (syncStatus.value) {
      case 'RED': return 'bg-rose-500';
      case 'BLUE': return 'bg-blue-500';
      case 'GREEN': return 'bg-emerald-500';
      default: return 'bg-gray-400';
    }
  });

  const registerChange = (entityUpdate) => {
    const existingIndex = unsavedChanges.value.findIndex(u => u._id === entityUpdate._id);
    if (existingIndex !== -1) {
      unsavedChanges.value[existingIndex] = entityUpdate;
    } else {
      unsavedChanges.value.push(entityUpdate);
    }
  };

  const saveLocal = async (sceneId) => {
    if (unsavedChanges.value.length === 0 || !sceneId) return;

    try {
      isSavingLocal.value = true;
      
      const rawData = toRaw(unsavedChanges.value);
      
      const changesToSave = structuredClone(rawData); 
      
      await saveEntitiesToLocal(sceneId, changesToSave);
      
      unsavedChanges.value = [];
      hasPendingCloudSync.value = true;
    } catch (error) {
      console.error("Local Save Failed:", error);
    } finally {
      isSavingLocal.value = false;
    }
  };

  const syncCloud = async (sceneId) => {
    if (!sceneId) return;
    try {
      isUploading.value = true;
      const dirtyEntities = await getDirtyEntities(sceneId);
      if (dirtyEntities.length > 0) {
        await new Promise(r => setTimeout(r, 800)); 
        await markSceneAsSynced(sceneId);
      }
      hasPendingCloudSync.value = false;
    } catch (error) {
      console.error("Cloud Sync Failed:", error);
      alert("Sync Failed!");
    } finally {
      isUploading.value = false;
    }
  };

  const setInitialSyncStatus = (status) => {
    hasPendingCloudSync.value = status;
    unsavedChanges.value = [];
  };

  return {
    syncStatus,
    indicatorColor,
    isSavingLocal,
    isUploading,
    registerChange,
    saveLocal,
    syncCloud,
    setInitialSyncStatus
  };
}