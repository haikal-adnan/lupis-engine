import { ref, computed, toRef, onMounted } from 'vue';
import { useBackend } from '@/services/api/useBackend.js';

export function useExploreLogic(props = {}) {
  const { API_URL, fetchWithTimeout } = useBackend();
  const publishedGames = ref([]);
  const isLoading = ref(true);

  const query = computed(() => props.searchQuery || '');

  const fetchGames = async () => {
    try {
      const res = await fetchWithTimeout(`${API_URL}/publish`);
      const result = await res.json();
      if (result.success) publishedGames.value = result.data;
    } catch (error) {
      console.error("Gagal memuat game:", error);
    } finally {
      isLoading.value = false;
    }
  };

  const filteredGames = computed(() => {
    return publishedGames.value.filter(game => 
      game.title.toLowerCase().includes(query.value.toLowerCase())
    );
  });

  onMounted(fetchGames);

  return { filteredGames, isLoading };
}