import { ref } from 'vue';
import { useBackend } from '@/services/api/useBackend.js';

export function useProfileLogic() {
  const { API_URL, fetchWithTimeout } = useBackend();
  
  const profile = ref(null);
  const publishedGames = ref([]);
  const isLoading = ref(true);
  const error = ref(null);

  const fetchProfile = async (username) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await fetchWithTimeout(`${API_URL}/profile/${username}`);
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal memuat profil');
      }

      profile.value = result.data.profile;
      publishedGames.value = result.data.games;
    } catch (err) {
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  };

  const searchUsers = async (query) => {
    if (!query) return [];
    try {
      const response = await fetchWithTimeout(`${API_URL}/profile/search/users?q=${encodeURIComponent(query)}`);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (err) {
      console.error("Search users error:", err);
      return [];
    }
  };

  return {
    profile,
    publishedGames,
    isLoading,
    error,
    fetchProfile,
    searchUsers
  };
}