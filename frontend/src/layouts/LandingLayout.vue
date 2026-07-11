<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'; 
import { useRouter, useRoute } from 'vue-router';
import AuthPanel from '@/modules/auth/AuthPanel.vue';
import BaseDropdown from "@ui/overlay/BaseDropdown.vue";
import { useTheme } from "@commons/composables/useTheme.js";

import { useAuthStore } from '@/stores/useAuthStore.js';
import { useAuthActions } from '@/stores/scene/useAuthActions.js'; 
import { useAvatarUrl } from '@/composables/useAvatarUrl.js'; 

import { 
  Gamepad2, ChevronDown, MessageSquare, Github, ExternalLink, Plus, User, Settings, LogOut, Menu, X 
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();

const authStore = useAuthStore();
const authActions = useAuthActions();
const { getAvatarUrl } = useAvatarUrl(); 

const profileDropdown = ref(null);
const isMobileMenuOpen = ref(false);

const isScrolled = ref(false);
const handleScroll = () => {
  isScrolled.value = window.scrollY > 20;
};

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
  authActions.initAuth();
  window.addEventListener('scroll', handleScroll);
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

  <div class="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-cyan-500/30 relative">
    <header 
      class="h-16 fixed top-0 w-full z-50 px-6 transition-all duration-300"
      :class="[(isScrolled || route.name !== 'Landing' || isMobileMenuOpen) ? 'bg-background border-b border-border shadow-sm' : 'bg-transparent border-transparent']"
    >
      <div class="max-w-6xl mx-auto w-full h-full flex items-center justify-between">
        
        <div class="flex items-center gap-2.5 cursor-pointer flex-1" @click="router.push('/')">
          <div class="w-8 h-8 rounded bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <Gamepad2 class="w-5 h-5 text-cyan-400" />
          </div>
          <span class="font-bold tracking-tight text-lg" :class="{ 'drop-shadow-md': !isScrolled && !isMobileMenuOpen && route.name === 'Landing' }">Lupis Engine</span>
        </div>

        <nav 
          class="hidden md:flex items-center justify-center gap-8 text-sm font-medium shrink-0 transition-colors"
          :class="(isScrolled || route.name !== 'Landing') ? 'text-muted-foreground' : 'text-white/90'"
        >
          <router-link to="/explore" class="hover:text-foreground transition-colors" active-class="text-foreground">Game</router-link>
          <router-link to="/docs" class="hover:text-foreground transition-colors" active-class="text-foreground">Dokumentasi</router-link>
          
          <div class="relative h-16 flex items-center community-dropdown" @mouseenter="openDropdown" @mouseleave="closeDropdown">
            <button class="flex items-center gap-1 hover:text-foreground transition-colors outline-none cursor-default" :class="{ 'text-foreground': isCommunityOpen }">
              Komunitas <ChevronDown class="w-3.5 h-3.5 transition-transform duration-200" :class="{ 'rotate-180': isCommunityOpen }" />
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
                    <div class="w-8 h-8 rounded-md bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20">
                      <MessageSquare class="w-4 h-4 text-cyan-400" />
                    </div>
                    <div class="flex flex-col text-left">
                      <span class="text-sm font-semibold text-foreground flex items-center gap-1">Discord <ExternalLink class="w-2.5 h-2.5 opacity-30" /></span>
                      <span class="text-[10px] text-muted-foreground">Mengobrol dengan kreator</span>
                    </div>
                  </a>
                  
                  <a href="https://github.com/haikal-adnan/lupis-engine" target="_blank" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-all group">
                    <div class="w-8 h-8 rounded-md bg-zinc-500/10 flex items-center justify-center group-hover:bg-zinc-500/20">
                      <Github class="w-4 h-4 text-foreground" />
                    </div>
                    <div class="flex flex-col text-left">
                      <span class="text-sm font-semibold text-foreground flex items-center gap-1">GitHub <ExternalLink class="w-2.5 h-2.5 opacity-30" /></span>
                      <span class="text-[10px] text-muted-foreground">Kode open source</span>
                    </div>
                  </a>
                </div>
              </div>
            </transition>
          </div>

          <router-link to="/about" class="hover:text-foreground transition-colors" active-class="text-foreground">Tentang</router-link>
        </nav>

        <div class="flex items-center justify-end gap-3 sm:gap-4 flex-1">
          
          <template v-if="authStore.isLoggedIn">
            <button 
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
                  class="w-9 h-9 rounded-full border border-cyan-500/50 bg-muted/50 flex items-center justify-center hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group overflow-hidden outline-none"
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
            <button 
              @click="authStore.openAuthModal('login')" 
              class="text-sm font-medium transition-colors hidden sm:block"
              :class="(isScrolled || route.name !== 'Landing' || isMobileMenuOpen) ? 'text-muted-foreground hover:text-foreground' : 'text-white/80 hover:text-white'"
            >
              Masuk
            </button>
            <button @click="authStore.openAuthModal('register')" class="bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-md shadow-cyan-500/20 active:scale-95 hidden sm:block">
              Mulai Sekarang
            </button>
          </template>

          <button 
            @click="toggleMobileMenu" 
            class="md:hidden p-2 transition-colors focus:outline-none"
            :class="(isScrolled || route.name !== 'Landing' || isMobileMenuOpen) ? 'text-foreground' : 'text-white'"
          >
            <Menu v-if="!isMobileMenuOpen" class="w-6 h-6" />
            <X v-else class="w-6 h-6" />
          </button>

        </div>
      </div>

      <transition 
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform -translate-y-4 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-4 opacity-0"
      >
        <div v-if="isMobileMenuOpen" class="absolute top-16 left-0 w-full bg-background border-b border-border shadow-lg p-4 flex flex-col gap-2 md:hidden z-40">
          
          <router-link to="/explore" class="text-base font-medium text-foreground py-2 border-b border-border">Game</router-link>
          <router-link to="/docs" class="text-base font-medium text-foreground py-2 border-b border-border">Dokumentasi</router-link>
          <router-link to="/about" class="text-base font-medium text-foreground py-2 border-b border-border">Tentang</router-link>
          
          <div class="py-2 border-b border-border flex flex-col gap-2">
            <span class="text-sm text-muted-foreground font-semibold">Komunitas</span>
            <a href="https://discord.gg/lupis" target="_blank" class="flex items-center gap-2 text-foreground"><MessageSquare class="w-4 h-4"/> Discord</a>
            <a href="https://github.com/haikal-adnan/lupis-engine" target="_blank" class="flex items-center gap-2 text-foreground"><Github class="w-4 h-4"/> GitHub</a>
          </div>

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
          <template v-else>
             <button @click="goToDashboard(); isMobileMenuOpen = false" class="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded-lg text-sm font-bold transition-all mt-2">
                <Plus class="w-4 h-4" /> Buat Game
            </button>
          </template>

        </div>
      </transition>
    </header>

    <main class="flex-1 flex flex-col items-center w-full">
      <slot />
    </main>

    <footer class="w-full border-t border-border bg-background py-8 px-6">
      <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-2">
          <Gamepad2 class="w-5 h-5 text-cyan-400" />
          <span class="font-bold tracking-tight text-sm">Lupis Engine</span>
        </div>
        
        <nav class="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="/docs" class="hover:text-foreground transition-colors">Dokumentasi</a>
          <a href="/about" class="hover:text-foreground transition-colors">Kontribusi</a>
          <a href="/about" class="hover:text-foreground transition-colors">Referensi</a>
          <a href="/about" class="hover:text-foreground transition-colors">License</a>
        </nav>

        <p class="text-xs text-muted-foreground">
          &copy; 2026 Lupis Engine.
        </p>
      </div>
    </footer>

  </div>
</template>