<script setup>
import { ref } from 'vue';
import { 
  Gamepad2, Search, Github, Facebook, Instagram, 
  Users, Download, Box, MessageSquare, Wrench, ChevronRight
} from 'lucide-vue-next';

// --- MOCK DATA: Profile Info ---
const profile = ref({
  name: 'Haikal Adnan',
  username: '@haikaldev',
  description: 'Solo indie game developer and asset creator. Lover of pixel art and 2D platformers. Currently building my dream world one pixel at a time using Lupis Engine.',
  avatar: 'https://avatars.githubusercontent.com/u/9919?v=4', // Dummy GitHub avatar
  labels: ['Pro Creator', 'Pixel Artist', 'Verified'],
  socials: {
    github: 'https://github.com',
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com'
  }
});

// --- MOCK DATA: Stats ---
const stats = ref([
  { label: 'Published Games', value: '4', icon: Gamepad2 },
  { label: 'Assets', value: '12', icon: Box },
  { label: 'Downloads', value: '14.2k', icon: Download },
  { label: 'Followers', value: '892', icon: Users },
]);

// --- MOCK DATA: Published Content ---
const publishedGames = ref([
  { id: 1, title: 'Cosmic Quest', genre: 'Platformer', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80', downloads: '5.2k' },
  { id: 2, title: 'Neon Racer', genre: 'Arcade', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&q=80', downloads: '3.1k' },
]);

const publishedAssets = ref([
  { id: 1, title: 'Fantasy UI Pack', type: 'UI Kit', image: 'https://images.unsplash.com/photo-1592839719941-8e2651039d01?w=600&q=80', downloads: '4.8k' },
  { id: 2, title: 'Pixel Forest Tileset', type: 'Environment', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80', downloads: '1.1k' },
]);

// --- MOCK DATA: Sidebar (WIP & Forum) ---
const wips = ref([
  { id: 1, title: 'Project Nebula', progress: 65, type: 'Game' },
  { id: 2, title: 'Cyberpunk Character Pack', progress: 30, type: 'Asset' },
]);

const forumActivities = ref([
  { id: 1, text: 'Just released a major update for Cosmic Quest! Check out the new levels.', time: '2 hours ago' },
  { id: 2, text: 'Does anyone have tips for optimizing spatial hashing in Lupis Engine v2.4?', time: '1 day ago' },
  { id: 3, text: 'Working on a new tutorial series for the ECS architecture.', time: '3 days ago' },
]);
</script>

<template>
  <div class="flex-1 max-w-[1400px] mx-auto w-full px-4 lg:px-6 py-8">

    <div class="bg-card border border-border rounded-2xl p-6 lg:p-8 mb-6 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
      <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

      <div class="shrink-0 relative">
        <img :src="profile.avatar" alt="Profile" class="w-32 h-32 rounded-2xl object-cover border-2 border-border shadow-sm" />
        <div class="absolute -bottom-3 -right-3 w-8 h-8 bg-background border border-border rounded-lg flex items-center justify-center shadow-sm">
          <Gamepad2 class="w-4 h-4 text-indigo-500" />
        </div>
      </div>

      <div class="flex-1 z-10">
        <div class="flex flex-col sm:flex-row sm:items-center gap-4 justify-between mb-3">
          <div>
            <h1 class="text-3xl font-extrabold tracking-tight text-foreground">{{ profile.name }}</h1>
            <p class="text-indigo-500 font-medium">{{ profile.username }}</p>
          </div>
          
          <div class="flex items-center gap-2">
            <a :href="profile.socials.github" class="p-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Github class="w-5 h-5" />
            </a>
            <a :href="profile.socials.facebook" class="p-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Facebook class="w-5 h-5" />
            </a>
            <a :href="profile.socials.instagram" class="p-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Instagram class="w-5 h-5" />
            </a>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 mb-4">
          <span v-for="label in profile.labels" :key="label" class="text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded-md font-medium">
            {{ label }}
          </span>
        </div>

        <p class="text-muted-foreground max-w-3xl leading-relaxed">
          {{ profile.description }}
        </p>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
      <div v-for="stat in stats" :key="stat.label" class="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-indigo-500/30 transition-colors">
        <div class="w-10 h-10 rounded-lg bg-indigo-500/5 flex items-center justify-center border border-indigo-500/10 shrink-0">
          <component :is="stat.icon" class="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <div class="text-2xl font-bold text-foreground">{{ stat.value }}</div>
          <div class="text-xs text-muted-foreground font-medium">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <div class="lg:col-span-2 space-y-10">
        
        <section>
          <div class="flex items-center justify-between mb-4 border-b border-border pb-2">
            <h2 class="text-xl font-bold text-foreground flex items-center gap-2">
              <Gamepad2 class="w-5 h-5 text-indigo-500" />
              Published Games
            </h2>
            <a href="#" class="text-sm text-indigo-500 hover:underline flex items-center">View all <ChevronRight class="w-4 h-4" /></a>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="game in publishedGames" :key="game.id" class="group border border-border rounded-xl overflow-hidden bg-card hover:border-indigo-500/30 transition-colors cursor-pointer block">
              <div class="h-40 overflow-hidden relative">
                <img :src="game.image" :alt="game.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div class="absolute top-2 right-2 bg-background backdrop-blur text-xs px-2 py-1 rounded font-medium border border-border flex items-center gap-1">
                  <Download class="w-3 h-3" /> {{ game.downloads }}
                </div>
              </div>
              <div class="p-4">
                <div class="text-xs text-indigo-500 font-medium mb-1">{{ game.genre }}</div>
                <h3 class="font-bold text-foreground">{{ game.title }}</h3>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div class="flex items-center justify-between mb-4 border-b border-border pb-2">
            <h2 class="text-xl font-bold text-foreground flex items-center gap-2">
              <Box class="w-5 h-5 text-amber-500" />
              Published Assets
            </h2>
            <a href="#" class="text-sm text-indigo-500 hover:underline flex items-center">View all <ChevronRight class="w-4 h-4" /></a>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="asset in publishedAssets" :key="asset.id" class="group border border-border rounded-xl overflow-hidden bg-card hover:border-indigo-500/30 transition-colors cursor-pointer block">
              <div class="h-40 overflow-hidden relative">
                <img :src="asset.image" :alt="asset.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div class="absolute top-2 right-2 bg-background backdrop-blur text-xs px-2 py-1 rounded font-medium border border-border flex items-center gap-1">
                  <Download class="w-3 h-3" /> {{ asset.downloads }}
                </div>
              </div>
              <div class="p-4">
                <div class="text-xs text-amber-500 font-medium mb-1">{{ asset.type }}</div>
                <h3 class="font-bold text-foreground">{{ asset.title }}</h3>
              </div>
            </div>
          </div>
        </section>

      </div>

      <aside class="space-y-8">
        
        <section class="border border-border rounded-xl bg-card p-5">
          <h3 class="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 mb-4">
            <Wrench class="w-4 h-4 text-orange-500" /> Work In Progress
          </h3>
          <div class="space-y-4">
            <div v-for="wip in wips" :key="wip.id" class="group">
              <div class="flex justify-between text-sm mb-1">
                <span class="font-medium text-foreground group-hover:text-indigo-500 transition-colors">{{ wip.title }}</span>
                <span class="text-muted-foreground">{{ wip.progress }}%</span>
              </div>
              <div class="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div class="bg-indigo-500 h-1.5 rounded-full" :style="{ width: `${wip.progress}%` }"></div>
              </div>
            </div>
          </div>
        </section>

        <section class="border border-border rounded-xl bg-card p-5">
          <h3 class="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 mb-4">
            <MessageSquare class="w-4 h-4 text-emerald-500" /> Recent Activity
          </h3>
          <div class="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            
            <div v-for="activity in forumActivities" :key="activity.id" class="relative flex items-start gap-3">
              <div class="w-4 h-4 mt-1 rounded-full bg-background border-2 border-indigo-500 shrink-0 z-10 shadow-sm"></div>
              <div>
                <p class="text-sm text-foreground leading-relaxed">
                  {{ activity.text }}
                </p>
                <span class="text-xs text-muted-foreground mt-1 block">{{ activity.time }}</span>
              </div>
            </div>

          </div>
          <button class="w-full mt-5 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 border border-border rounded-lg transition-colors">
            View All Activity
          </button>
        </section>

      </aside>

    </div>
  </div>
</template>

<style scoped>
/* Tambahkan styling khusus jika diperlukan, misal untuk dark mode handling */
</style>