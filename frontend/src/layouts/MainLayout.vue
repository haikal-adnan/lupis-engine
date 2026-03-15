<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'; 
import { useRoute, useRouter } from 'vue-router';
import { 
  Gamepad2, Search, Plus, User, Compass, BookOpen, Settings, LogOut 
} from 'lucide-vue-next';
import BaseDropdown from "@ui/overlay/BaseDropdown.vue";
import AuthPanel from '@/modules/auth/AuthPanel.vue';

import { useAuthStore } from '@/stores/useAuthStore.js';
import { useAuthActions } from '@/stores/scene/useAuthActions.js'; 

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
const authActions = useAuthActions();

const profileDropdown = ref(null);

const goToDashboard = () => router.push('/dashboard');
const goToProfile = () => router.push('/profile');
const closeProfileMenu = () => profileDropdown.value?.close();

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
    case 'Catalog Games':
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

  <div class="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-indigo-500/30">
    <header class="h-16 border-b border-border sticky top-0 bg-background backdrop-blur-md z-50 px-4 lg:px-6">
      <div class="max-w-[1400px] mx-auto w-full h-full flex items-center justify-between gap-4">
        
        <div @click="router.push('/')" class="flex items-center gap-2.5 cursor-pointer min-w-fit shrink-0 group">
          <div class="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:border-indigo-500/50 transition-all">
            <Gamepad2 class="w-5 h-5 text-indigo-500" />
          </div>
          <span class="font-bold tracking-tight text-lg hidden sm:block">Lupis Engine</span>
          <span v-if="isDocsPage" class="hidden lg:inline-flex text-[10px] bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded font-bold border border-indigo-500/20 ml-1">v2.4.0</span>
        </div>

        <div class="flex-1 max-w-xl hidden md:block">
          <div class="relative group flex items-center w-full transition-all duration-200 border rounded-lg bg-muted/40 focus-within:bg-background focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 border-border h-9">
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
          <router-link to="/catalog" class="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden lg:flex" active-class="text-foreground">
            <Compass class="w-4 h-4" /> Explore
          </router-link>

          <router-link to="/docs" class="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden lg:flex" active-class="text-foreground">
            <BookOpen class="w-4 h-4" /> Docs
          </router-link>

          <div class="w-px h-6 bg-border hidden lg:block mx-1"></div>

          <template v-if="authStore.isLoggedIn">
            <button 
                v-if="!isDashboardPage"
                @click="goToDashboard"
                class="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white pl-3 pr-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-sm shadow-indigo-500/20 active:scale-95 whitespace-nowrap"
            >
                <div class="bg-white/20 rounded-full p-0.5">
                  <Plus class="w-3.5 h-3.5" />
                </div>
                Make a Game
            </button>

            <BaseDropdown ref="profileDropdown" class="shrink-0 z-20">
              <template #trigger="{ isOpen }">
                <button 
                  class="w-9 h-9 rounded-full border border-border bg-muted/50 flex items-center justify-center hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group overflow-hidden outline-none"
                  :class="{ 'ring-2 ring-indigo-500/50 border-indigo-500/50': isOpen }"
                >
                  <img v-if="authStore.currentUser?.avatar_url" :src="authStore.currentUser.avatar_url" class="w-full h-full object-cover rounded-full" />
                  <User v-else class="w-4 h-4 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
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

                <button class="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors outline-none flex items-center gap-2 text-foreground" @click="closeProfileMenu">
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
            <button @click="authStore.openAuthModal('register')" class="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-500/20 active:scale-95">
              Get Started
            </button>
          </template>

        </nav>
      </div>
    </header>

    <main class="flex-1">
      <router-view :search-query="searchQuery" />
    </main>
  </div>
</template>