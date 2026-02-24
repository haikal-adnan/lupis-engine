import { useBackend } from '@/services/api/useBackend.js';

export function useAssetBackend() {
  const { API_URL, fetchWithTimeout } = useBackend();

  const uploadAssetToServer = async (file, projectId) => {
    const formData = new FormData();
    formData.append('projectId', projectId); 
    formData.append('file', file);

    const response = await fetchWithTimeout(`${API_URL}/assets/upload`, {
      method: 'POST',
      body: formData
    }, 10000);

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Gagal mengupload asset ke server');
    }

    return result.data; 
  };

  return {
    uploadAssetToServer
  };
}