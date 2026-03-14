<script setup>
import { ref } from 'vue';
import { 
  Gamepad2, Search, Filter, ChevronDown, 
  Heart, Download, MonitorPlay, Star, ArrowDownWideNarrow
} from 'lucide-vue-next';

// --- MOCK DATA: Filters ---
const genres = ref([
  { id: 'platformer', name: 'Platformer', count: 124 },
  { id: 'rpg', name: 'Role Playing', count: 85 },
  { id: 'action', name: 'Action', count: 210 },
  { id: 'puzzle', name: 'Puzzle', count: 64 },
  { id: 'shooter', name: 'Shooter', count: 42 },
  { id: 'survival', name: 'Survival', count: 38 },
  { id: 'visual-novel', name: 'Visual Novel', count: 91 },
]);

const platforms = ref([
  { id: 'web', name: 'Web / HTML5' },
  { id: 'windows', name: 'Windows' },
  { id: 'mac', name: 'macOS' },
  { id: 'linux', name: 'Linux' },
]);

const sortOptions = ['Top Rated', 'Most Downloaded', 'Newest', 'Recently Updated'];
const selectedSort = ref('Top Rated');

// --- MOCK DATA: Game List ---
const games = ref([
  {
    id: 1,
    title: 'Neon Drift: Overdrive',
    creator: { name: 'CyberPixel', avatar: 'https://i.pravatar.cc/150?u=1' },
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80',
    price: 'Free',
    tags: ['Action', 'Cyberpunk'],
    downloads: '12.4k',
    likes: '4.2k',
    isWebPlayable: true
  },
  {
    id: 2,
    title: 'Hollow Knightmare',
    creator: { name: 'Team CherryPicker', avatar: 'https://i.pravatar.cc/150?u=2' },
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=80',
    price: '$4.99',
    tags: ['Platformer', 'Dark'],
    downloads: '8.1k',
    likes: '3.9k',
    isWebPlayable: false
  },
  {
    id: 3,
    title: 'Cozy Cafe Manager',
    creator: { name: 'WholesomeDev', avatar: 'https://i.pravatar.cc/150?u=3' },
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
    price: 'Free',
    tags: ['Simulation', 'Cozy'],
    downloads: '22.1k',
    likes: '9.5k',
    isWebPlayable: true
  },
  {
    id: 4,
    title: 'Void Explorer 2D',
    creator: { name: 'Haikal Adnan', avatar: 'https://avatars.githubusercontent.com/u/9919?v=4' },
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=80',
    price: 'Free',
    tags: ['RPG', 'Space'],
    downloads: '3.4k',
    likes: '890',
    isWebPlayable: true
  },
  {
    id: 5,
    title: 'Pixel Farm',
    creator: { name: 'HarvestStudio', avatar: 'https://i.pravatar.cc/150?u=5' },
    thumbnail: 'https://images.unsplash.com/photo-1592839719941-8e2651039d01?w=600&q=80',
    price: '$1.99',
    tags: ['Puzzle', 'Retro'],
    downloads: '1.2k',
    likes: '450',
    isWebPlayable: false
  },
  {
    id: 6,
    title: 'Shadow Ninja',
    creator: { name: 'RoninGames', avatar: 'https://i.pravatar.cc/150?u=6' },
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80',
    price: 'Free',
    tags: ['Action', 'Stealth'],
    downloads: '56k',
    likes: '12k',
    isWebPlayable: true
  }
]);
</script>

<template>
  <div class="flex-1 max-w-[1400px] mx-auto w-full px-4 lg:px-6 py-8 flex flex-col md:flex-row gap-8 items-start">
    
    <aside class="w-full md:w-64 shrink-0 space-y-8 sticky top-24">
      <div class="flex items-center gap-2 text-lg font-bold text-foreground border-b border-border pb-4">
        <Filter class="w-5 h-5" /> Filters
      </div>

      <div>
        <h3 class="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Genres</h3>
        <div class="space-y-2">
          <label v-for="genre in genres" :key="genre.id" class="flex items-center justify-between group cursor-pointer">
            <div class="flex items-center gap-2">
              <input type="checkbox" class="w-4 h-4 rounded border-border text-indigo-500 focus:ring-indigo-500 bg-transparent" />
              <span class="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{{ genre.name }}</span>
            </div>
            <span class="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{{ genre.count }}</span>
          </label>
        </div>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Platform</h3>
        <div class="space-y-2">
          <label v-for="platform in platforms" :key="platform.id" class="flex items-center gap-2 group cursor-pointer">
            <input type="checkbox" class="w-4 h-4 rounded border-border text-indigo-500 focus:ring-indigo-500 bg-transparent" />
            <span class="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{{ platform.name }}</span>
          </label>
        </div>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Price</h3>
        <div class="space-y-2 text-sm text-muted-foreground">
          <label class="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <input type="radio" name="price" class="text-indigo-500 focus:ring-indigo-500 bg-transparent border-border" checked /> All Prices
          </label>
          <label class="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <input type="radio" name="price" class="text-indigo-500 focus:ring-indigo-500 bg-transparent border-border" /> Free
          </label>
          <label class="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <input type="radio" name="price" class="text-indigo-500 focus:ring-indigo-500 bg-transparent border-border" /> Paid
          </label>
        </div>
      </div>
    </aside>

    <main class="flex-1 min-w-0 w-full">
      
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Explore Games</h1>
          <p class="text-sm text-muted-foreground mt-1">Showing 1,204 games made with Lupis Engine</p>
        </div>
        
        <div class="flex items-center gap-2 text-sm">
          <span class="text-muted-foreground flex items-center gap-1">
            <ArrowDownWideNarrow class="w-4 h-4" /> Sort by:
          </span>
          <select class="bg-card border border-border text-foreground text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none">
            <option v-for="opt in sortOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <router-link 
          v-for="game in games" 
          :key="game.id" 
          to="/detail"
          class="group flex flex-col bg-card rounded-xl border border-border overflow-hidden hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer block"
        >
          
          <div class="relative aspect-video overflow-hidden bg-muted">
            <img :src="game.thumbnail" :alt="game.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
            
            <div v-if="game.isWebPlayable" class="absolute top-2 left-2 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded flex items-center gap-1 shadow-sm">
              <MonitorPlay class="w-3 h-3" /> Play in Browser
            </div>
            
            <div class="absolute bottom-2 right-2 bg-background backdrop-blur-sm text-foreground text-xs font-semibold px-2 py-1 rounded border border-border">
              {{ game.price }}
            </div>
          </div>

          <div class="p-4 flex-1 flex flex-col">
            
            <h2 class="text-lg font-bold text-foreground leading-tight mb-1 group-hover:text-indigo-500 transition-colors line-clamp-1">
              {{ game.title }}
            </h2>
            
            <div class="flex items-center gap-2 mb-3">
              <img :src="game.creator.avatar" alt="Avatar" class="w-5 h-5 rounded-full object-cover border border-border" />
              <span class="text-sm text-muted-foreground hover:text-foreground transition-colors line-clamp-1">{{ game.creator.name }}</span>
            </div>

            <div class="mt-auto">
              <div class="flex flex-wrap gap-1.5 mb-4">
                <span v-for="tag in game.tags" :key="tag" class="text-[10px] uppercase font-semibold text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded">
                  {{ tag }}
                </span>
              </div>

              <div class="flex items-center justify-between border-t border-border pt-3">
                <div class="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                  <div class="flex items-center gap-1 hover:text-indigo-500 transition-colors" title="Downloads">
                    <Download class="w-3.5 h-3.5" /> {{ game.downloads }}
                  </div>
                  <div class="flex items-center gap-1 hover:text-rose-500 transition-colors" title="Likes">
                    <Heart class="w-3.5 h-3.5" /> {{ game.likes }}
                  </div>
                </div>
                
                <button @click.prevent.stop class="text-muted-foreground hover:text-indigo-500 transition-colors p-1">
                  <Star class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </router-link>

      </div>

      <div class="mt-12 flex justify-center">
        <div class="inline-flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          <button class="px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md disabled:opacity-50" disabled>Prev</button>
          <button class="px-3 py-1 text-sm font-medium bg-indigo-500 text-white rounded-md">1</button>
          <button class="px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md">2</button>
          <button class="px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md">3</button>
          <span class="px-2 text-muted-foreground">...</span>
          <button class="px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md">12</button>
          <button class="px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md">Next</button>
        </div>
      </div>

    </main>

  </div>
</template>

<style scoped>
/* Reset default router-link style */
a {
  text-decoration: none;
  color: inherit;
}

select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1em;
  padding-right: 2.5rem;
}
</style>