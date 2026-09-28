<script setup>
import { ref, onMounted } from 'vue';
import { Monitor, Moon, Sun, Laptop, HardDrive } from 'lucide-vue-next';

const activeTab = ref('preferences');

const menuItems = [
  { id: 'preferences', label: 'Preferences & Theme', icon: Monitor, active: true }
];

const currentTheme = ref('system'); 

const setTheme = (theme) => {
  currentTheme.value = theme;
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
  localStorage.setItem('lupis_theme', theme);
};

onMounted(() => {
  const savedTheme = localStorage.getItem('lupis_theme') || 'system';
  setTheme(savedTheme);
});
</script>

<template>
  <div class="max-w-[1200px] w-full mx-auto px-4 lg:px-8 py-8 md:py-12 pb-24">
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold tracking-tight text-foreground">Settings</h1>
      <p class="text-muted-foreground text-sm mt-1">Manage Lupis Engine interface preferences and local storage.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
      <aside class="md:col-span-3 lg:col-span-3">
        <nav class="flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <button 
            v-for="item in menuItems" 
            :key="item.id"
            @click="activeTab = item.id"
            class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap text-left outline-none relative group"
            :class="[
              activeTab === item.id 
                ? 'bg-cyan-500/10 text-cyan-500 font-bold' 
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            ]"
          >
            <component :is="item.icon" class="w-4 h-4 shrink-0" :class="activeTab === item.id ? 'text-cyan-500' : ''" />
            <span class="flex-1">{{ item.label }}</span>
          </button>
        </nav>
      </aside>

      <main class="md:col-span-9 lg:col-span-9">
        <div v-if="activeTab === 'preferences'" class="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
          
          <div class="bg-card p-6 rounded-2xl border border-border">
            <h3 class="font-bold text-lg mb-1 flex items-center gap-2 text-foreground">
              <Monitor class="w-5 h-5 text-cyan-500" /> Application Theme
            </h3>
            <p class="text-sm text-muted-foreground mb-6">Choose the interface theme that is most comfortable for your eyes while developing games.</p>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button 
                @click="setTheme('light')" 
                class="flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all outline-none" 
                :class="currentTheme === 'light' ? 'border-cyan-500 bg-cyan-500/5' : 'border-border hover:border-border/80 hover:bg-muted/50'"
              >
                <div class="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Sun class="w-6 h-6 text-orange-500" />
                </div>
                <span class="font-semibold text-foreground">Light Mode</span>
              </button>

              <button 
                @click="setTheme('dark')" 
                class="flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all outline-none" 
                :class="currentTheme === 'dark' ? 'border-cyan-500 bg-cyan-500/5' : 'border-border hover:border-border/80 hover:bg-muted/50'"
              >
                <div class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                  <Moon class="w-6 h-6 text-slate-300" />
                </div>
                <span class="font-semibold text-foreground">Dark Mode</span>
              </button>

              <button 
                @click="setTheme('system')" 
                class="flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all outline-none" 
                :class="currentTheme === 'system' ? 'border-cyan-500 bg-cyan-500/5' : 'border-border hover:border-border/80 hover:bg-muted/50'"
              >
                <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Laptop class="w-6 h-6 text-muted-foreground" />
                </div>
                <span class="font-semibold text-foreground">System Default</span>
              </button>
            </div>
          </div>

          <div class="bg-card p-6 rounded-2xl border border-border">
            <h3 class="font-bold text-lg mb-1 flex items-center gap-2 text-foreground">
              <HardDrive class="w-5 h-5 text-cyan-500" /> Local Storage (OPFS)
            </h3>
            <p class="text-sm text-muted-foreground mb-4">
              All your projects, scenes, and assets are stored independently and offline in the local browser's Origin Private File System (OPFS).
            </p>
            <div class="p-4 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
              <div class="text-xs font-mono text-muted-foreground">
                Root Directory: <span class="text-cyan-400 font-bold">lupis-engine/projects</span>
              </div>
              <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Offline Active
              </span>
            </div>
          </div>

        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>