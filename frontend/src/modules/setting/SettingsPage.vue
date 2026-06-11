<script setup>
import { ref, onMounted } from 'vue';
import { User, Monitor, Shield, Code, CreditCard, Bell, Moon, Sun, Laptop } from 'lucide-vue-next';

import EditProfileForm from '@/modules/profile/views/EditProfileForm.vue';

const activeTab = ref('profile');

const menuItems = [
  { id: 'profile', label: 'Profile Publik', icon: User, active: true },
  { id: 'preferences', label: 'Preferences', icon: Monitor, active: true },
  { id: 'account', label: 'Akun & Keamanan', icon: Shield, active: false },
  { id: 'developer', label: 'Developer & API', icon: Code, active: false },
  { id: 'billing', label: 'Billing & Kuota', icon: CreditCard, active: false },
  { id: 'notifications', label: 'Notifikasi', icon: Bell, active: false },
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
      <h1 class="text-3xl font-extrabold tracking-tight text-foreground">Pengaturan</h1>
      <p class="text-muted-foreground text-sm mt-1">Kelola preferensi akun dan pengalaman Lupis Engine Anda.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
      <aside class="md:col-span-3 lg:col-span-3">
        <nav class="flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <button 
            v-for="item in menuItems" 
            :key="item.id"
            @click="item.active ? activeTab = item.id : null"
            class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap text-left outline-none relative group"
            :class="[
              activeTab === item.id 
                ? 'bg-cyan-500/10 text-cyan-500 font-bold' 
                : item.active 
                  ? 'text-muted-foreground hover:bg-muted/50 hover:text-foreground' 
                  : 'text-muted-foreground/50 cursor-not-allowed'
            ]"
          >
            <component :is="item.icon" class="w-4 h-4 shrink-0" :class="activeTab === item.id ? 'text-cyan-500' : ''" />
            <span class="flex-1">{{ item.label }}</span>
            <span v-if="!item.active" class="text-[9px] uppercase tracking-wider bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-bold ml-2">Soon</span>
          </button>
        </nav>
      </aside>

      <main class="md:col-span-9 lg:col-span-9">
        
        <EditProfileForm v-if="activeTab === 'profile'" />

        <div v-else-if="activeTab === 'preferences'" class="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div class="bg-card p-6 rounded-2xl border border-border">
            <h3 class="font-bold text-lg mb-1 flex items-center gap-2">
              <Monitor class="w-5 h-5 text-cyan-500" /> Tema Aplikasi
            </h3>
            <p class="text-sm text-muted-foreground mb-6">Pilih tema antarmuka yang paling nyaman untuk mata Anda saat mengembangkan game.</p>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button @click="setTheme('light')" class="flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all outline-none" :class="currentTheme === 'light' ? 'border-cyan-500 bg-cyan-500/5' : 'border-border hover:border-border/80 hover:bg-muted/50'">
                <div class="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Sun class="w-6 h-6 text-orange-500" />
                </div>
                <span class="font-semibold text-foreground">Light Mode</span>
              </button>

              <button @click="setTheme('dark')" class="flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all outline-none" :class="currentTheme === 'dark' ? 'border-cyan-500 bg-cyan-500/5' : 'border-border hover:border-border/80 hover:bg-muted/50'">
                <div class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                  <Moon class="w-6 h-6 text-slate-300" />
                </div>
                <span class="font-semibold text-foreground">Dark Mode</span>
              </button>

              <button @click="setTheme('system')" class="flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all outline-none" :class="currentTheme === 'system' ? 'border-cyan-500 bg-cyan-500/5' : 'border-border hover:border-border/80 hover:bg-muted/50'">
                <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Laptop class="w-6 h-6 text-muted-foreground" />
                </div>
                <span class="font-semibold text-foreground">Ikuti Sistem</span>
              </button>
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