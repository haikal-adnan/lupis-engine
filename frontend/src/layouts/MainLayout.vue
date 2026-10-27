<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'; 
import { useRoute, useRouter } from 'vue-router';
import { 
  Gamepad2, Search, Plus, User, Compass, BookOpen, Settings, LogOut, Menu, X 
} from 'lucide-vue-next';
import BaseDropdown from "@ui/overlay/BaseDropdown.vue";
import AuthPanel from '@/modules/auth/AuthPanel.vue';

import { useAuthStore } from '@/stores/useAuthStore.js';
import { useAuthActions } from '@/stores/scene/useAuthActions.js'; 
import { useAvatarUrl } from '@/composables/useAvatarUrl.js';

import { useProfileLogic } from '@modules/profile/composables/useProfileLogic.js'; 

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
const authActions = useAuthActions();
const { getAvatarUrl } = useAvatarUrl(); 

const profileDropdown = ref(null);
const isMobileMenuOpen = ref(false);

const goToDashboard = () => router.push('/dashboard');
const goToProfile = () => {
  const username = authStore.currentUser?.username;
  if (username) {
    router.push(`/profile/${username}`);
  }
};
const goToSettings = () => router.push('/settings');
const closeProfileMenu = () => profileDropdown.value?.close();

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const checkLoginQuery = async () => {
  await nextTick();
  if (route.query.action === 'login') {
    authStore.openAuthModal('login');
  }
};

const handleAuthSuccess = async () => {
  const targetPath = route.query.redirect || '/dashboard';
  authStore.closeAuthModal();
  sessionStorage.setItem('lupis_initial_check', 'true');
  await router.push(targetPath);
  router.replace({ query: {} });
};

onMounted(() => {
  checkLoginQuery();
});

watch(() => route.query.action, () => {
  checkLoginQuery();
});

const searchQuery = ref(''); 

const isGameDetailPage = computed(() => route.name === 'GameDetail');
const isDocsPage = computed(() => route.name === 'Docs');
const isDashboardPage = computed(() => route.name === 'Dashboard');
const isProfilePage = computed(() => route.name === 'Profile');

const searchPlaceholder = computed(() => {
  switch (route.name) {
    case 'Docs': return 'Cari dokumentasi...';
    case 'Profile': return 'Cari pengguna...';
    case 'Explore': return 'Cari game...';
    case 'Dashboard': return 'Cari proyek Anda...';
    default: return 'Cari...';
  }
});

const { searchUsers } = useProfileLogic();
const searchResults = ref([]);
const isDropdownOpen = ref(false);
let searchTimeout = null;

watch(searchQuery, (newVal) => {
  if (!isProfilePage.value || isGameDetailPage.value) return; 

  if (!newVal.trim()) {
    searchResults.value = [];
    isDropdownOpen.value = false;
    return;
  }

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    searchResults.value = await searchUsers(newVal);
    isDropdownOpen.value = searchResults.value.length > 0;
  }, 300);
});

const goToSearchedUser = (username) => {
  isDropdownOpen.value = false;
  searchQuery.value = ''; 
  router.push(`/profile/${username}`);
};

watch(() => route.fullPath, () => {
  isMobileMenuOpen.value = false;
  isDropdownOpen.value = false;
  searchQuery.value = ''; 
});
</script>

<template>
  <AuthPanel 
    :is-open="authStore.isAuthOpen" 
    :initial-mode="authStore.authMode" 
    @close="authStore.closeAuthModal()" 
    @auth-success="handleAuthSuccess"
  />

  <div class="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-cyan-500/30">
    <header class="h-16 border-b border-border sticky top-0 bg-background backdrop-blur-md z-50 px-4 lg:px-6">
      <div class="max-w-[1400px] mx-auto w-full h-full flex items-center justify-between gap-4">
        
        <!-- Logo -->
        <div @click="router.push('/')" class="flex items-center gap-2.5 cursor-pointer min-w-fit shrink-0 group">
          <div class="w-8 h-8 rounded bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:border-cyan-500/50 transition-all">
            <Gamepad2 class="w-5 h-5 text-cyan-500" />
          </div>
          <span class="font-bold tracking-tight text-lg">Lupis Engine</span>
          <span v-if="isDocsPage" class="hidden lg:inline-flex text-[10px] bg-cyan-500/10 text-cyan-500 px-1.5 py-0.5 rounded font-bold border border-cyan-500/20 ml-1">v1.0</span>
        </div>

        <!-- Pencarian Global (Sembunyikan total jika di halaman GameDetail) -->
        <div v-if="!isGameDetailPage" class="flex-1 max-w-xl hidden md:block">
          <div class="relative group flex items-center w-full transition-all duration-200 border rounded-lg bg-muted/40 focus-within:bg-background focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 border-border h-9 z-50">
            <div class="flex items-center justify-center pl-3 pr-2 text-muted-foreground">
              <Search class="w-4 h-4" />
            </div>
            
            <input 
              v-model="searchQuery"
              type="text" 
              :placeholder="searchPlaceholder" 
              class="w-full h-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground focus:ring-0 px-1"
            />
            
            <!-- Custom Dropdown untuk Pencarian Profil -->
            <transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="transform -translate-y-2 opacity-0"
              enter-to-class="transform translate-y-0 opacity-100"
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="transform translate-y-0 opacity-100"
              leave-to-class="transform -translate-y-2 opacity-0"
            >
              <div 
                v-if="isProfilePage && isDropdownOpen" 
                class="absolute top-full left-0 mt-2 w-full bg-background border border-border rounded-lg shadow-xl overflow-hidden z-50"
              >
                <div 
                  v-for="user in searchResults" 
                  :key="user.user_id" 
                  @click="goToSearchedUser(user.username)" 
                  class="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer transition-colors border-b border-border last:border-0"
                >
                  <img 
                    v-if="user.avatar_url" 
                    :src="getAvatarUrl(user.avatar_url)" 
                    class="w-8 h-8 rounded-full object-cover bg-muted/50 border border-border shrink-0" 
                  />
                  <div v-else class="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border shrink-0">
                    <User class="w-4 h-4 text-muted-foreground" />
                  </div>
                  
                  <div class="flex flex-col overflow-hidden">
                    <span class="text-sm font-bold text-foreground truncate leading-tight">
                      {{ user.display_name || user.username }}
                    </span>
                    <span class="text-xs text-muted-foreground truncate">
                      @{{ user.username }}
                    </span>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>

        <!-- Spacer pengganti pencarian agar posisi navigasi kanan tidak bergeser -->
        <div v-else class="flex-1 hidden md:block"></div>

        <!-- Navigasi Kanan -->
        <nav class="flex items-center gap-3 sm:gap-5 ml-auto">
          <router-link to="/explore" class="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:flex" active-class="text-foreground">
            <Compass class="w-4 h-4" /> Eksplorasi
          </router-link>

          <router-link to="/docs" class="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:flex" active-class="text-foreground">
            <BookOpen class="w-4 h-4" /> Dokumentasi
          </router-link>

          <div class="w-px h-6 bg-border hidden md:block mx-1"></div>

          <template v-if="authStore.isLoggedIn">
            <button 
                v-if="!isDashboardPage"
                @click="goToDashboard"
                class="hidden sm:flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white pl-3 pr-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-sm shadow-cyan-500/20 active:scale-95 whitespace-nowrap"
            >
                <div class="bg-white/20 rounded-full p-0.5">
                  <Plus class="w-3.5 h-3.5" />
                </div>
                Buat Game
            </button>

            <BaseDropdown ref="profileDropdown" class="shrink-0 z-20">
              <template #trigger="{ isOpen }">
                <button 
                  class="w-9 h-9 rounded-full border border-border bg-muted/50 flex items-center justify-center hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group overflow-hidden outline-none"
                  :class="{ 'ring-2 ring-cyan-500/50 border-cyan-500/50': isOpen }"
                >
                  <img v-if="authStore.currentUser?.avatar_url" :src="getAvatarUrl(authStore.currentUser.avatar_url)" class="w-full h-full object-cover rounded-full" />
                  <User v-else class="w-4 h-4 text-muted-foreground group-hover:text-cyan-500 transition-colors" />
                </button>
              </template>

              <template #default>
                <div class="px-3 py-2 border-b border-border mb-1 bg-muted/30">
                  <p class="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-0.5">Masuk sebagai</p>
                  <p class="text-sm font-bold truncate max-w-[150px] text-foreground">@{{ authStore.displayUsername }}</p>
                </div>
                
                <button class="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors outline-none flex items-center gap-2 text-foreground" @click="goToProfile(); closeProfileMenu();">
                  <User class="w-4 h-4 text-muted-foreground" /> Profil Saya
                </button>

                <button class="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors outline-none flex items-center gap-2 text-foreground" @click="goToSettings(); closeProfileMenu();">
                  <Settings class="w-4 h-4 text-muted-foreground" /> Settings
                </button>
                
                <div class="h-px bg-border my-1"></div>
                
                <button class="w-full text-left px-3 py-2 text-sm hover:bg-destructive/10 hover:text-destructive text-destructive transition-colors outline-none flex items-center gap-2" @click="authActions.logout(); closeProfileMenu();">
                  <LogOut class="w-4 h-4" /> Keluar
                </button>
              </template>
            </BaseDropdown>
          </template>

          <template v-else>
            <button @click="authStore.openAuthModal('login')" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Masuk
            </button>
            <button @click="authStore.openAuthModal('register')" class="bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-md shadow-cyan-500/20 active:scale-95 hidden sm:block">
              Mulai Sekarang
            </button>
          </template>

          <button @click="toggleMobileMenu" class="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none">
            <Menu v-if="!isMobileMenuOpen" class="w-6 h-6" />
            <X v-else class="w-6 h-6" />
          </button>
        </nav>
      </div>

      <!-- Mobile Menu -->
      <transition 
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform -translate-y-4 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-4 opacity-0"
      >
        <div v-if="isMobileMenuOpen" class="absolute top-16 left-0 w-full bg-background border-b border-border shadow-lg p-4 flex flex-col gap-4 md:hidden z-40">
          <router-link to="/explore" class="flex items-center gap-2 text-base font-medium text-foreground py-2 border-b border-border">
            <Compass class="w-5 h-5 text-muted-foreground" /> Eksplorasi
          </router-link>
          
          <router-link to="/docs" class="flex items-center gap-2 text-base font-medium text-foreground py-2 border-b border-border">
            <BookOpen class="w-5 h-5 text-muted-foreground" /> Dokumentasi
          </router-link>

          <template v-if="!authStore.isLoggedIn">
            <div class="flex flex-col gap-2 mt-2">
              <button @click="authStore.openAuthModal('login'); isMobileMenuOpen = false" class="w-full text-center py-2 text-sm font-medium text-foreground border border-border rounded-lg">
                Masuk
              </button>
              <button @click="authStore.openAuthModal('register'); isMobileMenuOpen = false" class="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded-lg text-sm font-semibold transition-all">
                Mulai Sekarang
              </button>
            </div>
          </template>
          <template v-else-if="!isDashboardPage">
             <button @click="goToDashboard(); isMobileMenuOpen = false" class="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded-lg text-sm font-bold transition-all mt-2">
                <Plus class="w-4 h-4" /> Buat Game
            </button>
          </template>
        </div>
      </transition>
    </header>

    <main class="flex-1">
      <router-view :search-query="searchQuery" />
    </main>
  </div>
</template>