import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthBackend } from '@/services/api/backend/useAuthBackend.js';
import { useAuthStore } from '@/stores/useAuthStore.js';
import { usePopAlert } from '@/composables/usePopAlert.js';

export function useAuthActions() {
    const { loginUser, registerUser, verifyOtpUser, resendOtpUser, googleAuth } = useAuthBackend();
    
    const router = useRouter();
    const route = useRoute();
    const authStore = useAuthStore();
    const { showPop } = usePopAlert(); 
    
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

        showPop({
          title: 'Welcome Back!',
          message: `Halo @${data.user.username || data.user.name}, selamat datang kembali.`,
          type: 'success'
        });

        return { success: true, data };
      } catch (error) {
        authStore.setError(error.message);
        
        showPop({
          title: 'Login Gagal',
          message: error.message || 'Email atau password salah.',
          type: 'error'
        });

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
        
        showPop({
          title: 'Registrasi Berhasil',
          message: 'Silakan cek email Anda untuk kode verifikasi OTP.',
          type: 'info'
        });

        return { success: true, data };
      } catch (error) {
        authStore.setError(error.message);
        
        showPop({
          title: 'Registrasi Gagal',
          message: error.message || 'Terjadi kesalahan saat membuat akun.',
          type: 'error'
        });

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

            showPop({
                title: 'Verifikasi Berhasil',
                message: 'Akun Anda telah aktif. Selamat datang di Lupis Engine!',
                type: 'success'
            });

            return { success: true, data };
        } catch (error) {
            authStore.setError(error.message);
            
            showPop({
                title: 'Verifikasi Gagal',
                message: error.message || 'Kode OTP tidak valid atau sudah kadaluarsa.',
                type: 'error'
            });

            return { success: false, error: error.message };
        } finally {
            authStore.setLoading(false);
        }
    };

    const resendOtp = async (email) => {
        authStore.setLoading(true);
        authStore.setError('');
        try {
            const result = await resendOtpUser(email);
            
            showPop({
                title: 'OTP Terkirim',
                message: result.message || 'Kode OTP baru telah dikirim ke email Anda.',
                type: 'info'
            });

            return { success: true };
        } catch (error) {
            authStore.setError(error.message);
            
            showPop({
                title: 'Gagal Kirim OTP',
                message: error.message || 'Terjadi kesalahan saat meminta OTP baru.',
                type: 'error'
            });

            return { success: false, error: error.message };
        } finally {
            authStore.setLoading(false);
        }
    };

    const loginWithGoogle = async (googleToken) => {
      authStore.setLoading(true);
      authStore.setError('');
      
      try {
        const data = await googleAuth(googleToken);
        
        _saveLocalData(data.user, data.token);
        authStore.setAuthData(data.user, data.token);

        showPop({
          title: 'Google Login Sukses',
          message: `Halo @${data.user.username || data.user.display_name}, selamat datang.`,
          type: 'success'
        });

        return { success: true, data };
      } catch (error) {
        authStore.setError(error.message);
        
        showPop({
          title: 'Google Login Gagal',
          message: error.message || 'Gagal terhubung dengan akun Google.',
          type: 'error'
        });

        return { success: false, error: error.message };
      } finally {
        authStore.setLoading(false);
      }
    };

    const logout = () => {
      _clearLocalData();
      authStore.clearAuthData();
      
      showPop({
        title: 'Signed Out',
        message: 'Anda telah berhasil keluar dari akun.',
        type: 'info'
      });
      
      const publicRoutes = ['Landing', 'About', 'Docs', 'Explore Games', 'Detail Games'];
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
      resendOtp,
      loginWithGoogle, 
      logout,
      getCurrentUser,
      isLoading,
      errorMessage
    };
}