<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import AuthPanel from '@/modules/auth/AuthPanel.vue';
import { useTheme } from "@commons/composables/useTheme.js";
import { 
  Gamepad2, 
  ChevronDown, 
  MessageSquare, 
  Github, 
  Users,
  ExternalLink
} from 'lucide-vue-next';

const router = useRouter();
const { initTheme } = useTheme();

// --- Logika Autentikasi ---
const isAuthOpen = ref(false);
const authMode = ref('login');

const openAuth = (mode) => {
  authMode.value = mode;
  isAuthOpen.value = true;
};

// --- Logika Hover Dropdown Community ---
const isCommunityOpen = ref(false);
let closeTimeout = null;

const openDropdown = () => {
  if (closeTimeout) clearTimeout(closeTimeout);
  isCommunityOpen.value = true;
};

const closeDropdown = () => {
  closeTimeout = setTimeout(() => {
    isCommunityOpen.value = false;
  }, 150); // Jeda kecil agar tidak langsung menutup saat kursor goyang
};

onMounted(() => {
  initTheme();
});

onUnmounted(() => {
  if (closeTimeout) clearTimeout(closeTimeout);
});
</script>

<template>
  <AuthPanel 
    :is-open="isAuthOpen" 
    :initial-mode="authMode" 
    @close="isAuthOpen = false" 
  />

  <div class="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-indigo-500/30">
    
    <header class="h-16 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-50 px-6">
      <div class="max-w-6xl mx-auto w-full h-full flex items-center justify-between">
        
        <div class="flex items-center gap-2.5 cursor-pointer flex-1" @click="router.push('/')">
          <div class="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Gamepad2 class="w-5 h-5 text-indigo-400" />
          </div>
          <span class="font-bold tracking-tight text-lg">Lupis Engine</span>
        </div>

        <nav class="hidden md:flex items-center justify-center gap-8 text-sm font-medium text-muted-foreground shrink-0">
          <router-link to="/catalog" class="hover:text-foreground transition-colors" active-class="text-foreground">Games</router-link>
          <router-link to="/docs" class="hover:text-foreground transition-colors" active-class="text-foreground">Docs</router-link>
          
          <div 
            class="relative h-16 flex items-center community-dropdown"
            @mouseenter="openDropdown"
            @mouseleave="closeDropdown"
          >
            <button 
              class="flex items-center gap-1 hover:text-foreground transition-colors outline-none cursor-default"
              :class="{ 'text-foreground': isCommunityOpen }"
            >
              Community
              <ChevronDown class="w-3.5 h-3.5 transition-transform duration-200" :class="{ 'rotate-180': isCommunityOpen }" />
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
                    <div class="flex flex-col">
                      <span class="text-sm font-semibold text-foreground flex items-center gap-1">Discord <ExternalLink class="w-2.5 h-2.5 opacity-30" /></span>
                      <span class="text-[10px] text-muted-foreground">Chat with creators</span>
                    </div>
                  </a>
                  
                  <a href="https://github.com/lupis" target="_blank" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-all group">
                    <div class="w-8 h-8 rounded-md bg-zinc-500/10 flex items-center justify-center group-hover:bg-zinc-500/20">
                      <Github class="w-4 h-4 text-foreground" />
                    </div>
                    <div class="flex flex-col">
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

        <div class="flex items-center justify-end gap-4 flex-1">
          <button @click="openAuth('login')" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Sign In
          </button>
          <button @click="openAuth('register')" class="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-500/20 active:scale-95">
            Get Started
          </button>
        </div>

      </div>
    </header>

    <main class="flex-1 flex flex-col items-center w-full">
      <slot />
    </main>

    <footer class="w-full border-t border-border bg-background py-12 px-6 mt-auto">
      <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div class="col-span-1 md:col-span-1 space-y-4">
          <div class="flex items-center gap-2">
            <Gamepad2 class="w-6 h-6 text-indigo-400" />
            <span class="font-bold tracking-tight text-xl">Lupis Engine</span>
          </div>
          <p class="text-sm text-muted-foreground leading-relaxed">
            Building the future of 2D game development with open-source power.
          </p>
        </div>
        
        <div class="flex flex-col gap-4">
          <span class="text-xs font-bold uppercase tracking-[0.2em] text-foreground/50">Resources</span>
          <nav class="flex flex-col gap-2.5 text-sm text-muted-foreground">
            <router-link to="/docs" class="hover:text-indigo-400 transition-colors">Documentation</router-link>
            <a href="#" class="hover:text-indigo-400 transition-colors">API Reference</a>
            <a href="#" class="hover:text-indigo-400 transition-colors">Asset Store</a>
          </nav>
        </div>
        
        <div class="flex flex-col gap-4">
          <span class="text-xs font-bold uppercase tracking-[0.2em] text-foreground/50">Community</span>
          <nav class="flex flex-col gap-2.5 text-sm text-muted-foreground">
            <a href="#" class="hover:text-indigo-400 transition-colors">Discord Server</a>
            <a href="#" class="hover:text-indigo-400 transition-colors">GitHub Repo</a>
            <a href="#" class="hover:text-indigo-400 transition-colors">Forum</a>
          </nav>
        </div>

        <div class="flex flex-col gap-4">
          <span class="text-xs font-bold uppercase tracking-[0.2em] text-foreground/50">Legal</span>
          <nav class="flex flex-col gap-2.5 text-sm text-muted-foreground">
            <a href="#" class="hover:text-indigo-400 transition-colors">Privacy Policy</a>
            <a href="#" class="hover:text-indigo-400 transition-colors">License (MIT)</a>
            <a href="#" class="hover:text-indigo-400 transition-colors">Brand Assets</a>
          </nav>
        </div>
      </div>

      <div class="max-w-6xl mx-auto border-t border-border mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
        <p>&copy; 2026 Lupis Engine. Made with passion for game developers.</p>
        <div class="flex items-center gap-6">
          <span class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            v0.9.4-alpha
          </span>
          <a href="#" class="hover:text-foreground">Status</a>
          <a href="#" class="hover:text-foreground">Twitter / X</a>
        </div>
      </div>
    </footer>

  </div>
</template>