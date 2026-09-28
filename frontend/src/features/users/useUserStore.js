import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: {
      id: 'lupis-engine',
      username: 'Lupis Developer',
      name: 'Lupis Engine'
    },
    isLoading: false,
    errorMessage: ''
  }),

  getters: {
    isLoggedIn: () => true, 
    username: (state) => state.user?.username || 'Lupis Developer',
    currentUser: (state) => state.user,
    displayUsername: (state) => state.user?.username || 'Lupis Developer'
  },

  actions: {
    setLocalUser(user) {
      this.user = user;
    },

    updateUserField(fields) {
      if (this.user) {
        this.user = { ...this.user, ...fields };
      }
    },

    setLoading(status) {
      this.isLoading = status;
    },

    setError(message) {
      this.errorMessage = message;
    }
  }
})