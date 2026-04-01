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
import { useAvatarUrl } from '@/composables/useAvatarUrl.js'; // <-- Tambahkan ini

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
const authActions = useAuthActions();
const { getAvatarUrl } = useAvatarUrl(); // <-- Ekstrak fungsi

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

watch(() => route.fullPath, () => {
  isMobileMenuOpen.value = false;
});

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

const searchPlaceholder = computed(() => {
  switch (route.name) {
    case 'Docs': return 'Search documentation...';
    case 'Profile': return 'Search user, games, or assets...';
    case 'Explore Games':
    case 'Detail Games': return 'Search games...';
    case 'Dashboard': return 'Search your projects...';
    default: return 'Search...';
  }
});

const isDocsPage = computed(() => route.name === 'Docs');
const isDashboardPage = computed(() => route.name === 'Dashboard');
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
        
        <div @click="router.push('/')" class="flex items-center gap-2.5 cursor-pointer min-w-fit shrink-0 group">
          <div class="w-8 h-8 rounded bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:border-cyan-500/50 transition-all">
            <Gamepad2 class="w-5 h-5 text-cyan-500" />
          </div>
          <span class="font-bold tracking-tight text-lg">Lupis Engine</span>
          <span v-if="isDocsPage" class="hidden lg:inline-flex text-[10px] bg-cyan-500/10 text-cyan-500 px-1.5 py-0.5 rounded font-bold border border-cyan-500/20 ml-1">v1.0</span>
        </div>

        <div class="flex-1 max-w-xl hidden md:block">
          <div class="relative group flex items-center w-full transition-all duration-200 border rounded-lg bg-muted/40 focus-within:bg-background focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 border-border h-9">
            <div class="flex items-center justify-center pl-3 pr-2 text-muted-foreground">
              <Search class="w-4 h-4" />
            </div>
            <input 
              v-model="searchQuery"
              type="text" 
              :placeholder="searchPlaceholder" 
              class="w-full h-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground focus:ring-0 px-1"
            />
            <div class="flex items-center pr-2">
              <kbd class="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span class="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
        </div>

        <nav class="flex items-center gap-3 sm:gap-5 ml-auto">
          <router-link to="/explore" class="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:flex" active-class="text-foreground">
            <Compass class="w-4 h-4" /> Explore
          </router-link>

          <router-link to="/docs" class="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:flex" active-class="text-foreground">
            <BookOpen class="w-4 h-4" /> Docs
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
                Make a Game
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
                  <p class="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-0.5">Signed in as</p>
                  <p class="text-sm font-bold truncate max-w-[150px] text-foreground">@{{ authStore.displayUsername }}</p>
                </div>
                
                <button class="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors outline-none flex items-center gap-2 text-foreground" @click="goToProfile(); closeProfileMenu();">
                  <User class="w-4 h-4 text-muted-foreground" /> My Profile
                </button>

                <button class="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors outline-none flex items-center gap-2 text-foreground" @click="goToSettings(); closeProfileMenu();">
                  <Settings class="w-4 h-4 text-muted-foreground" /> Settings
                </button>
                
                <div class="h-px bg-border my-1"></div>
                
                <button class="w-full text-left px-3 py-2 text-sm hover:bg-destructive/10 hover:text-destructive text-destructive transition-colors outline-none flex items-center gap-2" @click="authActions.logout(); closeProfileMenu();">
                  <LogOut class="w-4 h-4" /> Sign Out
                </button>
              </template>
            </BaseDropdown>
          </template>

          <template v-else>
            <button @click="authStore.openAuthModal('login')" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Sign In
            </button>
            <button @click="authStore.openAuthModal('register')" class="bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-md shadow-cyan-500/20 active:scale-95 hidden sm:block">
              Get Started
            </button>
          </template>

          <button @click="toggleMobileMenu" class="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none">
            <Menu v-if="!isMobileMenuOpen" class="w-6 h-6" />
            <X v-else class="w-6 h-6" />
          </button>
        </nav>
      </div>

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
            <Compass class="w-5 h-5 text-muted-foreground" /> Explore
          </router-link>
          
          <router-link to="/docs" class="flex items-center gap-2 text-base font-medium text-foreground py-2 border-b border-border">
            <BookOpen class="w-5 h-5 text-muted-foreground" /> Docs
          </router-link>

          <template v-if="!authStore.isLoggedIn">
            <div class="flex flex-col gap-2 mt-2">
              <button @click="authStore.openAuthModal('login'); isMobileMenuOpen = false" class="w-full text-center py-2 text-sm font-medium text-foreground border border-border rounded-lg">
                Sign In
              </button>
              <button @click="authStore.openAuthModal('register'); isMobileMenuOpen = false" class="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded-lg text-sm font-semibold transition-all">
                Get Started
              </button>
            </div>
          </template>
          <template v-else-if="!isDashboardPage">
             <button @click="goToDashboard(); isMobileMenuOpen = false" class="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded-lg text-sm font-bold transition-all mt-2">
                <Plus class="w-4 h-4" /> Make a Game
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