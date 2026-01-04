// src/services/db/useLocalSave.js
import { ref } from 'vue'

export function useLocalSave() {
  const isSavingLocal = ref(false)
  const lastSavedAt = ref(null)

  async function saveLocal(data) {
    isSavingLocal.value = true
    
    // Simulate DB operation
    console.log('[DB] Saving locally...', data)
    await new Promise(resolve => setTimeout(resolve, 800))
    
    lastSavedAt.value = new Date()
    isSavingLocal.value = false
    return true
  }

  return {
    isSavingLocal,
    lastSavedAt,
    saveLocal
  }
}