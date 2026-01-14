// src/services/api/useCloudSync.js
import { ref } from 'vue'

export function useSyncManager() {
  const isUploading = ref(false)
  const cloudStatus = ref('idle') // idle, syncing, synced, error

  async function syncCloud(data) {
    isUploading.value = true
    cloudStatus.value = 'syncing'
    
    // Simulate API Call
    console.log('[API] Syncing to cloud...', data)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    cloudStatus.value = 'synced'
    isUploading.value = false
    return true
  }

  return {
    isUploading,
    cloudStatus,
    syncCloud
  }
}