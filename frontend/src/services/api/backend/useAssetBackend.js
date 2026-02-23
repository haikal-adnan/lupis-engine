// src/composables/useAssetBackend.js
import { useBackend } from '@/services/api/useBackend.js';

export function useAssetBackend() {
  const { API_URL, fetchWithTimeout } = useBackend();

  const uploadAssetToServer = async (file, projectId) => {
    const formData = new FormData();
    // PENTING: projectId harus di-append sebelum file agar backend multer bisa membacanya duluan
    formData.append('projectId', projectId); 
    formData.append('file', file);

    // Timeout diset 10000 ms (10 detik)
    const response = await fetchWithTimeout(`${API_URL}/assets/upload`, {
      method: 'POST',
      body: formData
    }, 10000);

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Gagal mengupload asset ke server');
    }

    return result.data; // Mengembalikan data hasil hash dari backend
  };

  return {
    uploadAssetToServer
  };
}