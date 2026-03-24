import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthBackend } from '@/services/api/backend/useAuthBackend.js';
import { useAuthStore } from '@/stores/useAuthStore.js';

export function useAuthLogic() {
    // Pastikan googleAuth ikut di-import
    const { loginUser, registerUser, verifyOtpUser, googleAuth } = useAuthBackend();
    const router = useRouter();
    const route = useRoute();
    const authStore = useAuthStore();
    
    const isLoading = computed(() => authStore.isLoading);
    const errorMessage = computed(() => authStore.errorMessage);

    const _saveLocalData = (user, token) => {
      localStorage.setItem('lupis_auth_token', token);
      localStorage.setItem('lupis_user_data', JSON.stringify(user));
      localStorage.setItem('lupis_session_start', Date.now());
    };

    const _clearLocalData = () => {
      localStorage.removeItem('lupis_auth_token');
      localStorage.removeItem('lupis_user_data');
      localStorage.removeItem('lupis_session_start');
      sessionStorage.removeItem('lupis_initial_check');
    };

    const initAuth = () => {
      const token = localStorage.getItem('lupis_auth_token');
      const userDataStr = localStorage.getItem('lupis_user_data');

      if (token && userDataStr && userDataStr !== 'undefined') {
        try {
          const user = JSON.parse(userDataStr);
          authStore.setAuthData(user, token);
        } catch (error) {
          console.warn('Data user di localStorage rusak. Sesi direset.');
          _clearLocalData();
          authStore.clearAuthData();
        }
      } else {
        _clearLocalData();
      }
    };

    const login = async (email, password) => {
      authStore.setLoading(true);
      authStore.setError('');
      
      try {
        const data = await loginUser(email, password);
        
        _saveLocalData(data.user, data.token);
        authStore.setAuthData(data.user, data.token);

        console.log('✅ Sesi dimulai, token disimpan ke Store & LocalStorage!');
        return { success: true, data };
      } catch (error) {
        authStore.setError(error.message);
        return { success: false, error: error.message };
      } finally {
        authStore.setLoading(false);
      }
    };

    const register = async (email, password, name) => {
      authStore.setLoading(true);
      authStore.setError('');
      try {
        const data = await registerUser(email, password, name);
        return { success: true, data };
      } catch (error) {
        authStore.setError(error.message);
        return { success: false, error: error.message };
      } finally {
        authStore.setLoading(false);
      }
    };

    const verifyOtp = async (email, otp) => {
      authStore.setLoading(true);
      authStore.setError('');
      try {
        const data = await verifyOtpUser(email, otp);
        
        _saveLocalData(data.user, data.token);
        authStore.setAuthData(data.user, data.token);

        return { success: true, data };
      } catch (error) {
        authStore.setError(error.message);
        return { success: false, error: error.message };
      } finally {
        authStore.setLoading(false);
      }
    };

    // --- FUNGSI BARU UNTUK GOOGLE ---
    const loginWithGoogle = async (googleToken) => {
      authStore.setLoading(true);
      authStore.setError('');
      
      try {
        // Panggil endpoint /google
        const data = await googleAuth(googleToken);
        
        // Simpan token ke localStorage dan state persis seperti login biasa
        _saveLocalData(data.user, data.token);
        authStore.setAuthData(data.user, data.token);

        console.log('✅ Berhasil login via Google!');
        return { success: true, data };
      } catch (error) {
        authStore.setError(error.message);
        return { success: false, error: error.message };
      } finally {
        authStore.setLoading(false);
      }
    };

    const logout = () => {
      _clearLocalData();
      authStore.clearAuthData();
      
      console.log('✅ Berhasil logout dari Store & LocalStorage');
      
      const publicRoutes = ['Landing', 'About', 'Docs', 'Catalog Games', 'Detail Games'];
      if (route && !publicRoutes.includes(route.name)) {
        router.push('/');
      } else if (!router) {
        window.location.href = '/';
      }
    };

    const getCurrentUser = () => {
      if (authStore.currentUser) return authStore.currentUser;
      
      const userData = localStorage.getItem('lupis_user_data');
      if (!userData || userData === 'undefined') return null;

      try {
        return JSON.parse(userData);
      } catch (error) {
        _clearLocalData();
        return null;
      }
    };

    return {
      initAuth,
      login,
      register,
      verifyOtp,
      logout,
      getCurrentUser,
      loginWithGoogle, // Jangan lupa di-return agar bisa dipakai di AuthPanel
      isLoading,
      errorMessage
    };
}