import { computed } from 'vue';
import { useUserStore } from '@users/users.js';

export function useUserActions() {
    const userStore = useUserStore();
    
    const isLoading = computed(() => userStore.isLoading);
    const errorMessage = computed(() => userStore.errorMessage);

    const initUser = () => {
      userStore.setLocalUser({
        id: 'lupis-engine',
        username: 'Lupis Developer',
        name: 'Lupis Engine'
      });
    };

    const getCurrentUser = () => {
      return userStore.currentUser;
    };

    return {
      initUser,
      getCurrentUser,
      isLoading,
      errorMessage
    };
}