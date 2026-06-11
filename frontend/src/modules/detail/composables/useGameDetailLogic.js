import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useBackend } from '@/services/api/useBackend.js';

export function useGameDetailLogic() {
  const route = useRoute();
  const { API_URL, fetchWithTimeout } = useBackend();
  
  const game = ref(null);
  const isLoading = ref(true);

  const fetchGameDetail = async () => {
    try {
      const slug = route.params.slug;
      const res = await fetchWithTimeout(`${API_URL}/publish/slug/${slug}`);
      const result = await res.json();
      if (result.success) game.value = result.data;
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(fetchGameDetail);

  return { game, isLoading };
}