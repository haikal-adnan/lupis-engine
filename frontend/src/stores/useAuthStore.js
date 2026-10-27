import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    isLoading: false,
    errorMessage: '',
    
    isAuthOpen: false,
    authMode: 'login' 
  }),

  getters: {
    isLoggedIn: (state) => !!state.token && !!state.user,
    username: (state) => state.user?.username || 'Guest',
    currentUser: (state) => state.user,
    displayUsername: (state) => state.user?.username || 'Guest'
  },

  actions: {
    setAuthData(user, token) {
      this.user = user;
      this.token = token;
    },

    updateUserField(fields) {
      if (this.user) {
        this.user = { ...this.user, ...fields };
        
        localStorage.setItem('lupis_user_data', JSON.stringify(this.user));
      }
    },
    
    clearAuthData() {
      this.user = null;
      this.token = null;
    },

    setLoading(status) {
      this.isLoading = status;
    },

    setError(message) {
      this.errorMessage = message;
    },

    openAuthModal(mode = 'login') {
      this.authMode = mode;
      this.isAuthOpen = true;
    },

    closeAuthModal() {
      this.isAuthOpen = false;
    },

    setAuthMode(mode) {
      this.authMode = mode;
    }
  }
})