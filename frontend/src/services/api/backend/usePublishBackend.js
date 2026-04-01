// src/services/api/backend/usePublishBackend.js

import { useBackend } from '@/services/api/useBackend.js';

export function usePublishBackend() {
  const { API_URL, fetchWithTimeout } = useBackend();

  const handleResponse = async (response, defaultErrorMsg) => {
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const errorText = await response.text();
      console.error(`[Publish API Error] ${response.status}:`, errorText);
      throw new Error(`Server Error ${response.status}: Terjadi kesalahan pada server.`);
    }

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || defaultErrorMsg);
    }
    return result;
  };

  const createPublishedGame = async (publishData) => {
    const response = await fetchWithTimeout(`${API_URL}/publish/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(publishData)
    });
    const result = await handleResponse(response, 'Gagal mem-publish game');
    return result.data;
  };

  const checkSlugAvailability = async (slug) => {
    const response = await fetchWithTimeout(`${API_URL}/publish/check-slug/${slug}`, {
      method: 'GET'
    });
    const result = await handleResponse(response, 'Gagal mengecek slug');
    return result; // mengembalikan objek { success: true, available: boolean }
  };

  const getPublishedByProjectId = async (projectId) => {
    const response = await fetchWithTimeout(`${API_URL}/publish/project/${projectId}`, { 
      method: 'GET' 
    });
    const result = await handleResponse(response, 'Gagal mengambil data published game');
    return result.data;
  };

  const updatePublishedGame = async (publishId, publishData) => {
    const response = await fetchWithTimeout(`${API_URL}/publish/${publishId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(publishData)
    });
    const result = await handleResponse(response, 'Gagal memperbarui game');
    return result.data;
  };

  // --- FUNGSI UPLOAD THUMBNAIL ---
  const uploadThumbnailToServer = async (file) => {
    const formData = new FormData();
    formData.append('thumbnail', file);

    // Ambil token secara manual dari storage
    const token = localStorage.getItem('lupis_auth_token');

    // MENGGUNAKAN NATIVE FETCH: 
    // fetchWithTimeout biasanya menimpa header dengan application/json
    const response = await fetch(`${API_URL}/publish/upload-thumbnail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // PENTING: Jangan tulis 'Content-Type': 'multipart/form-data' di sini.
        // Biarkan browser yang secara otomatis menyuntikkan boundary-nya.
      },
      body: formData
    });

    const result = await handleResponse(response, 'Gagal mengunggah thumbnail');
    return result.data;
  };

  return {
    createPublishedGame,
    checkSlugAvailability, 
    getPublishedByProjectId, 
    updatePublishedGame,
    uploadThumbnailToServer
  };
}