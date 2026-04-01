// src/composables/useExploreLogic.js
import { ref, computed, onMounted } from 'vue';
import { useBackend } from '@/services/api/useBackend.js';

export function useExploreLogic() {
  const { API_URL, fetchWithTimeout } = useBackend();
  const publishedGames = ref([]);
  const isLoading = ref(true);
  const searchQuery = ref('');

  const fetchGames = async () => {
    try {
      const res = await fetchWithTimeout(`${API_URL}/publish`);
      const result = await res.json();
      if (result.success) publishedGames.value = result.data;
    } finally {
      isLoading.value = false;
    }
  };

  const filteredGames = computed(() => {
    return publishedGames.value.filter(game => 
      game.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  });

  onMounted(fetchGames);

  return { filteredGames, searchQuery, isLoading };
}