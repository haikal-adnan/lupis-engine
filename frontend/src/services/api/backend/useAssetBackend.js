import { useBackend } from '@/services/api/useBackend.js';

export function useAssetBackend() {
  const { API_URL, fetchWithTimeout } = useBackend();

  const handleResponse = async (response, defaultErrorMsg) => {
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const errorText = await response.text();
      console.error(`[Asset Error] ${response.status} Non-JSON Response:`, errorText);
      throw new Error(`Server Error ${response.status}: Terjadi kesalahan pada server.`);
    }

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || defaultErrorMsg);
    }
    return result;
  };

  const createAssetToServer = async (file, projectId, folderId = null, dimensions = null, finalName = null, duration = 0) => {
    const formData = new FormData();
    formData.append('projectId', projectId);
    if (folderId) formData.append('folderId', folderId);
    if (dimensions && (dimensions.w > 0 || dimensions.h > 0)) {
      formData.append('width', dimensions.w);
      formData.append('height', dimensions.h);
    }
    if (duration > 0) formData.append('duration', duration);
    if (finalName) formData.append('name', finalName);
    formData.append('file', file);

    const response = await fetchWithTimeout(`${API_URL}/assets/createAsset`, {
      method: 'POST',
      body: formData
    }, 10000);

    const result = await handleResponse(response, 'Gagal membuat asset di server');
    return result.data; 
  };

  const updateAssetToServer = async (assetId, updateData) => {
    const response = await fetchWithTimeout(`${API_URL}/assets/updateAsset/${assetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    const result = await handleResponse(response, 'Gagal mengupdate asset');
    return result.data;
  };

  const deleteAssetFromServer = async (assetId) => {
    const response = await fetchWithTimeout(`${API_URL}/assets/deleteAsset/${assetId}`, {
      method: 'DELETE'
    });

    const result = await handleResponse(response, 'Gagal menghapus asset');
    return result.success;
  };

  const duplicateAssetOnServer = async (assetId, targetFolderId = null) => {
    const response = await fetchWithTimeout(`${API_URL}/assets/duplicateAsset/${assetId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetFolderId })
    });

    const result = await handleResponse(response, 'Gagal menduplikasi asset');
    return result.data;
  };

  return {
    createAssetToServer,
    updateAssetToServer,
    deleteAssetFromServer,
    duplicateAssetOnServer 
  };
}