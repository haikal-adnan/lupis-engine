import { useBackend } from '@/services/api/useBackend.js';

export function useProjectBackend() {
  const { API_URL, fetchWithTimeout } = useBackend();

  const handleResponse = async (response, defaultErrorMsg) => {
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const errorText = await response.text();
      console.error(`[Project Error] ${response.status} Non-JSON Response:`, errorText);
      throw new Error(`Server Error ${response.status}: Terjadi kesalahan pada server.`);
    }

    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || defaultErrorMsg);
    return result;
  };

  const getProjectsByOwnerId = async (ownerId) => {
    const response = await fetchWithTimeout(`${API_URL}/projects/owner/${ownerId}`, {
      method: 'GET'
    });
    const result = await handleResponse(response, 'Gagal mengambil data project dari server');
    return result.data; 
  };

  const createProject = async ({ userId, projectName, description = "", type = "empty" }) => {
    const response = await fetchWithTimeout(`${API_URL}/projects/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, projectName, description, type })
    });
    const result = await handleResponse(response, 'Gagal membuat project baru');
    return result.data; 
  };

  const updateProject = async (projectId, updateData) => {
    const response = await fetchWithTimeout(`${API_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    const result = await handleResponse(response, 'Gagal mengupdate project');
    return result.data;
  };

  const deleteProject = async (projectId) => {
    const response = await fetchWithTimeout(`${API_URL}/projects/${projectId}`, {
      method: 'DELETE'
    });
    const result = await handleResponse(response, 'Gagal menghapus project');
    return result.success;
  };

  const syncProject = async (projectId, syncPayload) => {
    const payloadString = JSON.stringify(syncPayload);
    const sizeInBytes = new Blob([payloadString]).size;
    const sizeInKb = (sizeInBytes / 1024).toFixed(2);
    
    console.log(`[Sync] Mengirim data sebesar: ${sizeInKb} KB`);

    const response = await fetchWithTimeout(`${API_URL}/projects/${projectId}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payloadString 
    });

    if (!response.ok) {
      if (response.status === 413) {
        throw new Error(`Data terlalu besar (${sizeInKb} KB). Server menolak permintaan.`);
      }
    }

    const result = await handleResponse(response, 'Gagal sinkronisasi project ke server');
    return result;
  };

  return {
    getProjectsByOwnerId,
    createProject,
    updateProject,
    deleteProject,
    syncProject
  };
}