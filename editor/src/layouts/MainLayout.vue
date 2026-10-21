<script setup>
import { ref, computed, watch } from 'vue'; 
import { useRoute, useRouter } from 'vue-router';
import { 
  Search, BookOpen, LayoutDashboard, Settings, Menu, X 
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();

const isMobileMenuOpen = ref(false);
const searchQuery = ref('');

const isDocsPage = computed(() => route.name === 'Docs');

const searchPlaceholder = computed(() => {
  switch (route.name) {
    case 'Docs': return 'Search documentation...';
    case 'Dashboard': return 'Search your projects...';
    default: return 'Search...';
  }
});

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

watch(() => route.fullPath, () => {
  isMobileMenuOpen.value = false;
  searchQuery.value = ''; 
});
</script>

<template>
  <div class="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-cyan-500/30">
    <header class="h-16 border-b border-border sticky top-0 bg-background/95 backdrop-blur-md z-50 px-4 lg:px-6">
      <div class="max-w-[1400px] mx-auto w-full h-full flex items-center justify-between gap-4">
        
        <div @click="router.push('/dashboard')" class="flex items-center gap-2.5 cursor-pointer min-w-fit shrink-0 group">
          <img src="/assets/logo.svg" alt="Lupis Engine Logo" class="w-8 h-8 object-contain" />
          <span class="font-bold tracking-tight text-lg">Lupis Engine</span>
          <span v-if="isDocsPage" class="hidden lg:inline-flex text-[10px] bg-cyan-500/10 text-cyan-500 px-1.5 py-0.5 rounded font-bold border border-cyan-500/20 ml-1">v0.1.0</span>
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
          </div>
        </div>

        <nav class="flex items-center gap-3 sm:gap-5 ml-auto">
          <router-link to="/dashboard" class="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:flex" active-class="text-foreground">
            <LayoutDashboard class="w-4 h-4" /> Dashboard
          </router-link>

          <router-link to="/docs" class="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:flex" active-class="text-foreground">
            <BookOpen class="w-4 h-4" /> Documentation
          </router-link>

          <router-link to="/settings" class="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:flex" active-class="text-foreground">
            <Settings class="w-4 h-4" /> Settings
          </router-link>

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
        <div v-if="isMobileMenuOpen" class="absolute top-16 left-0 w-full bg-background border-b border-border shadow-lg p-4 flex flex-col gap-3 md:hidden z-40">
          <router-link to="/dashboard" class="flex items-center gap-2 text-base font-medium text-foreground py-2 border-b border-border">
            <LayoutDashboard class="w-5 h-5 text-muted-foreground" /> Dashboard
          </router-link>
          
          <router-link to="/docs" class="flex items-center gap-2 text-base font-medium text-foreground py-2 border-b border-border">
            <BookOpen class="w-5 h-5 text-muted-foreground" /> Documentation
          </router-link>

          <router-link to="/settings" class="flex items-center gap-2 text-base font-medium text-foreground py-2 border-b border-border">
            <Settings class="w-5 h-5 text-muted-foreground" /> Settings
          </router-link>
        </div>
      </transition>
    </header>

    <main class="flex-1">
      <router-view :search-query="searchQuery" />
    </main>
  </div>
</template>