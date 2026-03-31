<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'; 
import { useRouter, useRoute } from 'vue-router';
import AuthPanel from '@/modules/auth/AuthPanel.vue';
import BaseDropdown from "@ui/overlay/BaseDropdown.vue";
import { useTheme } from "@commons/composables/useTheme.js";

import { useAuthStore } from '@/stores/useAuthStore.js';
import { useAuthActions } from '@/stores/scene/useAuthActions.js'; 

import { 
  Gamepad2, ChevronDown, MessageSquare, Github, ExternalLink, Plus, User, Settings, LogOut 
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const { initTheme } = useTheme();

const authStore = useAuthStore();
const authActions = useAuthActions();

const profileDropdown = ref(null);

// --- FITUR BACKGROUND INVISIBLE ---
const isScrolled = ref(false);
const handleScroll = () => {
  isScrolled.value = window.scrollY > 20;
};
// ----------------------------------

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
  const targetPath = route.query.redirect;
  
  authStore.closeAuthModal();
  
  await nextTick();
  
  if (targetPath) {
    router.push(targetPath);
  } else {
    router.push('/dashboard');
  }
  
  sessionStorage.setItem('lupis_initial_check', 'true');
};

watch(() => route.query.action, () => {
  checkLoginQuery();
});

onMounted(() => {
  initTheme();
  authActions.initAuth();

  // Aktifkan listener scroll
  window.addEventListener('scroll', handleScroll);

  const hasCheckedIn = sessionStorage.getItem('lupis_initial_check');

  if (authStore.isLoggedIn && route.name === 'Landing' && !hasCheckedIn) {
    sessionStorage.setItem('lupis_initial_check', 'true');
    router.push('/dashboard');
  }

  checkLoginQuery();
});

const isCommunityOpen = ref(false);
let closeTimeout = null;

const openDropdown = () => {
  if (closeTimeout) clearTimeout(closeTimeout);
  isCommunityOpen.value = true;
};

const closeDropdown = () => {
  closeTimeout = setTimeout(() => {
    isCommunityOpen.value = false;
  }, 150);
};

onUnmounted(() => {
  if (closeTimeout) clearTimeout(closeTimeout);
  // Bersihkan listener scroll
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <AuthPanel 
    :is-open="authStore.isAuthOpen" 
    :initial-mode="authStore.authMode" 
    @close="authStore.closeAuthModal()" 
    @auth-success="handleAuthSuccess"
  />

  <div class="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-indigo-500/30 relative">
    <header 
      class="h-16 fixed top-0 w-full z-50 px-6 transition-all duration-300"
      :class="(isScrolled || route.name !== 'Landing') ? 'bg-background border-b border-border shadow-sm' : 'bg-transparent border-transparent'"
    >
      <div class="max-w-6xl mx-auto w-full h-full flex items-center justify-between">
        
        <div class="flex items-center gap-2.5 cursor-pointer flex-1" @click="router.push('/')">
          <div class="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Gamepad2 class="w-5 h-5 text-indigo-400" />
          </div>
          <span class="font-bold tracking-tight text-lg" :class="{ 'drop-shadow-md': !isScrolled && route.name === 'Landing' }">Lupis Engine</span>
        </div>

        <nav 
          class="hidden md:flex items-center justify-center gap-8 text-sm font-medium shrink-0 transition-colors"
          :class="(isScrolled || route.name !== 'Landing') ? 'text-muted-foreground' : 'text-white/90'"
        >
          <router-link to="/catalog" class="hover:text-foreground transition-colors" active-class="text-foreground">Games</router-link>
          <router-link to="/docs" class="hover:text-foreground transition-colors" active-class="text-foreground">Docs</router-link>
          
          <div class="relative h-16 flex items-center community-dropdown" @mouseenter="openDropdown" @mouseleave="closeDropdown">
            <button class="flex items-center gap-1 hover:text-foreground transition-colors outline-none cursor-default" :class="{ 'text-foreground': isCommunityOpen }">
              Community <ChevronDown class="w-3.5 h-3.5 transition-transform duration-200" :class="{ 'rotate-180': isCommunityOpen }" />
            </button>

            <transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="transform scale-95 opacity-0 -translate-y-2"
              enter-to-class="transform scale-100 opacity-100 translate-y-0"
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="transform scale-100 opacity-100 translate-y-0"
              leave-to-class="transform scale-95 opacity-0 -translate-y-2"
            >
              <div v-if="isCommunityOpen" class="absolute top-full left-0 w-60 pt-1 z-[60]">
                <div class="rounded-xl bg-card border border-border shadow-2xl p-2 bg-background/95 backdrop-blur-sm">
                  <a href="https://discord.gg/lupis" target="_blank" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-all group">
                    <div class="w-8 h-8 rounded-md bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20">
                      <MessageSquare class="w-4 h-4 text-indigo-400" />
                    </div>
                    <div class="flex flex-col text-left">
                      <span class="text-sm font-semibold text-foreground flex items-center gap-1">Discord <ExternalLink class="w-2.5 h-2.5 opacity-30" /></span>
                      <span class="text-[10px] text-muted-foreground">Chat with creators</span>
                    </div>
                  </a>
                  
                  <a href="https://github.com/haikal-adnan/lupis-engine" target="_blank" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-all group">
                    <div class="w-8 h-8 rounded-md bg-zinc-500/10 flex items-center justify-center group-hover:bg-zinc-500/20">
                      <Github class="w-4 h-4 text-foreground" />
                    </div>
                    <div class="flex flex-col text-left">
                      <span class="text-sm font-semibold text-foreground flex items-center gap-1">GitHub <ExternalLink class="w-2.5 h-2.5 opacity-30" /></span>
                      <span class="text-[10px] text-muted-foreground">Open source code</span>
                    </div>
                  </a>
                </div>
              </div>
            </transition>
          </div>

          <router-link to="/about" class="hover:text-foreground transition-colors" active-class="text-foreground">About</router-link>
        </nav>

        <div class="flex items-center justify-end gap-3 sm:gap-4 flex-1">
          
          <template v-if="authStore.isLoggedIn">
            <button 
              @click="goToDashboard"
              class="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white pl-3 pr-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-sm shadow-indigo-500/20 active:scale-95 whitespace-nowrap hidden sm:flex"
            >
              <div class="bg-white/20 rounded-full p-0.5">
                <Plus class="w-3.5 h-3.5" />
              </div>
              Make a Game
            </button>

            <BaseDropdown ref="profileDropdown" class="shrink-0 z-20">
              <template #trigger="{ isOpen }">
                <button 
                  class="w-9 h-9 rounded-full border border-indigo-500/50 bg-muted/50 flex items-center justify-center hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group overflow-hidden outline-none"
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
            <button 
              @click="authStore.openAuthModal('login')" 
              class="text-sm font-medium transition-colors hidden sm:block"
              :class="(isScrolled || route.name !== 'Landing') ? 'text-muted-foreground hover:text-foreground' : 'text-white/80 hover:text-white'"
            >
              Sign In
            </button>
            <button @click="authStore.openAuthModal('register')" class="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-500/20 active:scale-95">
              Get Started
            </button>
          </template>

        </div>
      </div>
    </header>

    <main class="flex-1 flex flex-col items-center w-full">
      <slot />
    </main>
  </div>
</template>