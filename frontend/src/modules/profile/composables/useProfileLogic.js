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

  return {
    profile,
    publishedGames,
    isLoading,
    error,
    fetchProfile
  };
}