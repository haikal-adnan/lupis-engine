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
    // 1. Cek ukuran payload sebelum dikirim
    const payloadString = JSON.stringify(syncPayload);
    const sizeInBytes = new Blob([payloadString]).size;
    const sizeInKb = (sizeInBytes / 1024).toFixed(2);
    
    console.log(`[Sync] Mengirim data sebesar: ${sizeInKb} KB`);

    const response = await fetchWithTimeout(`${API_URL}/projects/${projectId}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payloadString // Gunakan string yang sudah dibuat tadi
    });

    // 2. CEK STATUS DULU sebelum parse JSON
    if (!response.ok) {
      if (response.status === 413) {
        throw new Error(`Data terlalu besar (${sizeInKb} KB). Server menolak permintaan.`);
      }
      // Jika bukan 413, ambil teks mentah untuk debugging (mencegah error '<')
      const errorText = await response.text();
      console.error("Server Error Response:", errorText);
      throw new Error(`Server error: ${response.status}`);
    }

    // 3. Jika OK, baru parse sebagai JSON
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Gagal sinkronisasi project ke server');
    }

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