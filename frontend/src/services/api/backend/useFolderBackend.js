import { useBackend } from '@/services/api/useBackend.js';

export function useFolderBackend() {
  const { API_URL, fetchWithTimeout } = useBackend();

  const createFolderToServer = async (folderData) => {
    const response = await fetchWithTimeout(`${API_URL}/folders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(folderData)
    }, 10000);

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Gagal membuat folder di server');
    }

    return result.data;
  };

  const getFoldersByProjectId = async (projectId) => {
    const response = await fetchWithTimeout(`${API_URL}/folders/project/${projectId}`, {
      method: 'GET'
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Gagal mengambil data folder');
    }

    return result.data;
  };

  const updateFolderToServer = async (folderId, updateData) => {
    const response = await fetchWithTimeout(`${API_URL}/folders/${folderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Gagal mengupdate folder');
    }

    return result.data;
  };

  const deleteFolderFromServer = async (folderId) => {
    const response = await fetchWithTimeout(`${API_URL}/folders/${folderId}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Gagal menghapus folder');
    }

    return result.success;
  };

  return {
    createFolderToServer,
    getFoldersByProjectId,
    updateFolderToServer,
    deleteFolderFromServer
  };
}