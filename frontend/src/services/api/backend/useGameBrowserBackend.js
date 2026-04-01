// src/services/api/useGameBrowserBackend.js
import { useBackend } from '@/services/api/useBackend.js';

export function useGameBrowserBackend() {
  const { API_URL, fetchWithTimeout } = useBackend();

  // Helper standar untuk menangani response
  const handleResponse = async (response, defaultErrorMsg) => {
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const errorText = await response.text();
      console.error(`[Browser Error] ${response.status} Non-JSON Response:`, errorText);
      throw new Error(`Server Error ${response.status}: Terjadi kesalahan pada server.`);
    }

    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || defaultErrorMsg);
    return result;
  };

  /**
   * Mengambil semua game yang sudah dipublish (Katalog Game)
   * Method: GET /publish
   */
  const getAllPublishedGames = async () => {
    const response = await fetchWithTimeout(`${API_URL}/publish`, {
      method: 'GET'
    });
    const result = await handleResponse(response, 'Gagal mengambil daftar game');
    return result.data;
  };

  /**
   * Mengambil detail satu game berdasarkan slug (Halaman Detail Game)
   * Method: GET /publish/slug/:slug
   */
  const getGameDetailBySlug = async (slug) => {
    const response = await fetchWithTimeout(`${API_URL}/publish/slug/${slug}`, {
      method: 'GET'
    });
    const result = await handleResponse(response, `Gagal mengambil detail game untuk slug: ${slug}`);
    return result.data;
  };

  /**
   * Mengambil semua resource game (scene, asset, prefab, script) untuk Engine
   * Method: GET /publish/:id/resources
   */
  const getGameResources = async (publishedId) => {
    // Timeout agak dibesarkan (misal: 15 detik) karena query DB resource mungkin cukup besar
    const response = await fetchWithTimeout(`${API_URL}/publish/${publishedId}/resources`, {
      method: 'GET'
    }, 15000); 
    
    const result = await handleResponse(response, 'Gagal mengunduh resource game untuk dimainkan');
    return result.data;
  };

  return {
    getAllPublishedGames,
    getGameDetailBySlug,
    getGameResources
  };
}