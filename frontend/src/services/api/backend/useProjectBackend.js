import { useBackend } from '@/services/api/useBackend.js';

export function useProjectBackend() {
  const { API_URL, fetchWithTimeout } = useBackend();

  const getProjectsByOwnerId = async (ownerId) => {
    const response = await fetchWithTimeout(`${API_URL}/projects/owner/${ownerId}`, {
      method: 'GET'
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Gagal mengambil data project dari server');
    return result.data; 
  };

  const createProject = async ({ userId, projectName, description = "", type = "empty" }) => {
    const response = await fetchWithTimeout(`${API_URL}/projects/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, projectName, description, type })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Gagal membuat project baru');
    return result.data; 
  };

  const updateProject = async (projectId, updateData) => {
    const response = await fetchWithTimeout(`${API_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Gagal mengupdate project');
    return result.data;
  };

  const deleteProject = async (projectId) => {
    const response = await fetchWithTimeout(`${API_URL}/projects/${projectId}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Gagal menghapus project');
    return result.success;
  };

  const syncProject = async (projectId, syncPayload) => {
    const response = await fetchWithTimeout(`${API_URL}/projects/${projectId}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(syncPayload)
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Gagal sinkronisasi project ke server');
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