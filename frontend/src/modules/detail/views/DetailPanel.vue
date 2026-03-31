<script setup>
import { ref } from 'vue';
import { 
  Gamepad2, Search, Play, Download, Heart, Share2, 
  FolderPlus, Monitor, Clock, Tag, MessageSquare, 
  UserPlus, ChevronRight, Star
} from 'lucide-vue-next';

const game = ref({
  title: 'Void Explorer 2D',
  tagline: 'A relaxing space exploration RPG built entirely with Lupis Engine.',
  coverImage: 'https://images.unsplash.com/photo-1618361853833-0c7104b93b50?w=1200&q=80',
  description: `
    <p>Embark on a journey through the silent cosmos in <strong>Void Explorer 2D</strong>. Navigate your custom-built starship through procedurally generated asteroid fields, discover abandoned space stations, and mine resources to upgrade your vessel.</p>
    <br>
    <h3>Features:</h3>
    <ul>
      <li>Seamless procedural generation powered by Lupis Engine's fast ECS.</li>
      <li>Over 50 unique modules to upgrade your ship.</li>
      <li>Relaxing synth-wave soundtrack.</li>
      <li>Fully playable in your browser!</li>
    </ul>
    <br>
    <p><em>Controls:</em> Use <strong>W A S D</strong> to move, <strong>Mouse</strong> to aim, and <strong>Left Click</strong> to interact/shoot. Press <strong>ESC</strong> to open the inventory.</p>
  `,
  screenshots: [
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=80',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80'
  ],
  price: 'Free',
  stats: {
    downloads: '3.4k',
    likes: 890,
    views: '12.1k'
  },
  metadata: {
    status: 'Released',
    published: 'March 10, 2026',
    updated: '2 days ago',
    platforms: ['Web', 'Windows', 'Linux'],
    genre: 'RPG',
    engine: 'Lupis Engine v1.0'
  },
  tags: ['Space', 'Exploration', 'Pixel Art', 'Sci-fi', 'Relaxing']
});

const creator = ref({
  name: 'Haikal Adnan',
  username: '@haikaldev',
  avatar: 'https://avatars.githubusercontent.com/u/9919?v=4',
  followers: '892',
  isFollowing: false
});

const moreByCreator = ref([
  { id: 1, title: 'Cosmic Quest', thumb: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80', price: '$2.00' },
  { id: 2, title: 'Neon Racer', thumb: 'https://images.unsplash.com/photo-1592839719941-8e2651039d01?w=300&q=80', price: 'Free' },
]);

const similarGames = ref([
  { id: 3, title: 'Star Miner', author: 'PixelForge', thumb: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&q=80' },
  { id: 4, title: 'Galaxy Trader', author: 'IndieBob', thumb: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&q=80' },
]);

const comments = ref([
  { id: 1, user: 'RetroGamer99', avatar: 'https://i.pravatar.cc/150?u=12', text: 'This is incredibly smooth! The procedural generation is very impressive for a web game. Did you write a custom chunking system for Lupis Engine?', time: '2 hours ago', likes: 12 },
  { id: 2, user: 'SarahCodes', avatar: 'https://i.pravatar.cc/150?u=15', text: 'Love the art style and the music. Spent way too much time mining asteroids haha.', time: '1 day ago', likes: 5 },
  { id: 3, user: 'Haikal Adnan', avatar: 'https://avatars.githubusercontent.com/u/9919?v=4', text: '@RetroGamer99 Thanks! Yes, I used the built-in Spatial Hash map in Lupis and extended it to load/unload chunks asynchronously.', time: '1 hour ago', likes: 8, isCreator: true },
]);
</script>

<template>
  <div class="flex-1 max-w-[1200px] mx-auto w-full px-4 lg:px-6 py-8 flex flex-col lg:flex-row gap-10 items-start">
    
    <main class="flex-1 min-w-0 w-full space-y-8">
      
      <div class="relative aspect-video bg-black rounded-xl overflow-hidden border border-border shadow-2xl group flex items-center justify-center">
        <img :src="game.coverImage" alt="Game Cover" class="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
        
        <div class="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <button class="w-20 h-20 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-transform hover:scale-105">
            <Play class="w-10 h-10 ml-2" />
          </button>
          <span class="text-white font-bold tracking-wider text-sm bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-md">Run Game in Browser</span>
        </div>
      </div>

      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 class="text-4xl font-extrabold tracking-tight text-foreground mb-2">{{ game.title }}</h1>
          <p class="text-lg text-muted-foreground">{{ game.tagline }}</p>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <button class="h-10 px-5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2">
            <Download class="w-4 h-4" /> Download
          </button>
          <button class="h-10 px-4 bg-muted hover:bg-muted/80 text-foreground border border-border text-sm font-medium rounded-lg transition-colors flex items-center gap-2" title="Add to Collection">
            <FolderPlus class="w-4 h-4 text-muted-foreground" />
          </button>
          <button class="h-10 px-4 bg-muted hover:bg-muted/80 text-rose-500 border border-border text-sm font-medium rounded-lg transition-colors flex items-center gap-2" title="Like">
            <Heart class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="prose prose-slate dark:prose-invert max-w-none text-muted-foreground" v-html="game.description"></div>

      <div>
        <h2 class="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">Screenshots</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="(img, idx) in game.screenshots" :key="idx" class="aspect-video rounded-lg overflow-hidden border border-border bg-muted cursor-zoom-in">
            <img :src="img" alt="Screenshot" class="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
          </div>
        </div>
      </div>

      <div class="pt-8 mt-8 border-t border-border">
        <h2 class="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <MessageSquare class="w-5 h-5 text-indigo-500" /> Comments ({{ comments.length }})
        </h2>
        
        <div class="flex gap-4 mb-8">
          <div class="w-10 h-10 rounded-full bg-muted border border-border shrink-0 flex items-center justify-center overflow-hidden">
            <UserPlus class="w-5 h-5 text-muted-foreground" />
          </div>
          <div class="flex-1">
            <textarea 
              rows="3" 
              placeholder="Write a comment..." 
              class="w-full bg-card border border-border rounded-lg p-3 text-sm text-foreground focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y"
            ></textarea>
            <div class="flex justify-end mt-2">
              <button class="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-md transition-colors">Post Comment</button>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div v-for="comment in comments" :key="comment.id" class="flex gap-4">
            <img :src="comment.avatar" alt="Avatar" class="w-10 h-10 rounded-full border border-border object-cover shrink-0" />
            <div class="flex-1 bg-card border border-border p-4 rounded-xl rounded-tl-none">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2 text-sm">
                  <span class="font-bold text-foreground">{{ comment.user }}</span>
                  <span v-if="comment.isCreator" class="bg-indigo-500 text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">Creator</span>
                  <span class="text-muted-foreground text-xs">{{ comment.time }}</span>
                </div>
              </div>
              <p class="text-sm text-foreground leading-relaxed">{{ comment.text }}</p>
              <div class="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <button class="flex items-center gap-1 hover:text-indigo-500 transition-colors">
                  <Heart class="w-3.5 h-3.5" /> {{ comment.likes }}
                </button>
                <button class="hover:text-foreground transition-colors">Reply</button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </main>

    <aside class="w-full lg:w-80 shrink-0 space-y-6">
      
      <div class="bg-card border border-border rounded-xl p-5 flex flex-col items-center text-center">
        <img :src="creator.avatar" alt="Creator" class="w-20 h-20 rounded-full border-4 border-background shadow-sm mb-3 object-cover" />
        <h3 class="font-bold text-lg text-foreground">{{ creator.name }}</h3>
        <p class="text-sm text-indigo-500 font-medium mb-4">{{ creator.username }}</p>
        <div class="flex items-center justify-center gap-6 w-full text-sm text-muted-foreground mb-5">
          <div class="flex flex-col"><span class="font-bold text-foreground">{{ creator.followers }}</span> Followers</div>
          <div class="flex flex-col"><span class="font-bold text-foreground">5</span> Games</div>
        </div>
        <button class="w-full py-2 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
          <UserPlus class="w-4 h-4" /> Follow
        </button>
      </div>

      <div class="bg-card border border-border rounded-xl p-5 text-sm">
        <h3 class="font-bold text-foreground uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
          <Gamepad2 class="w-4 h-4 text-muted-foreground" /> Game Details
        </h3>
        <ul class="space-y-3">
          <li class="flex justify-between items-start border-b border-border pb-2">
            <span class="text-muted-foreground">Status</span>
            <span class="text-foreground font-medium text-right">{{ game.metadata.status }}</span>
          </li>
          <li class="flex justify-between items-start border-b border-border pb-2">
            <span class="text-muted-foreground">Published</span>
            <span class="text-foreground font-medium text-right">{{ game.metadata.published }}</span>
          </li>
          <li class="flex justify-between items-start border-b border-border pb-2">
            <span class="text-muted-foreground">Platforms</span>
            <span class="text-foreground font-medium text-right flex gap-1 justify-end flex-wrap">
              <span v-for="plat in game.metadata.platforms" :key="plat" class="bg-muted px-1.5 py-0.5 rounded text-xs">{{ plat }}</span>
            </span>
          </li>
          <li class="flex justify-between items-start border-b border-border pb-2">
            <span class="text-muted-foreground">Genre</span>
            <span class="text-foreground font-medium text-right">{{ game.metadata.genre }}</span>
          </li>
          <li class="flex justify-between items-start pb-1">
            <span class="text-muted-foreground">Made with</span>
            <span class="text-indigo-500 font-medium text-right">{{ game.metadata.engine }}</span>
          </li>
        </ul>

        <div class="mt-5">
          <div class="flex items-center gap-1.5 mb-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <Tag class="w-3.5 h-3.5" /> Tags
          </div>
          <div class="flex flex-wrap gap-1.5">
            <a href="#" v-for="tag in game.tags" :key="tag" class="text-xs bg-muted hover:bg-muted/80 border border-border px-2 py-1 rounded text-foreground transition-colors">
              {{ tag }}
            </a>
          </div>
        </div>
      </div>

      <div class="bg-card border border-border rounded-xl p-5">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-foreground text-sm">More by {{ creator.name }}</h3>
        </div>
        <div class="space-y-3">
          <a href="#" v-for="item in moreByCreator" :key="item.id" class="flex gap-3 group">
            <div class="w-16 h-12 rounded overflow-hidden shrink-0 border border-border">
              <img :src="item.thumb" alt="Thumb" class="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            </div>
            <div class="flex flex-col justify-center">
              <span class="text-sm font-bold text-foreground group-hover:text-indigo-500 transition-colors line-clamp-1">{{ item.title }}</span>
              <span class="text-xs text-muted-foreground">{{ item.price }}</span>
            </div>
          </a>
        </div>
      </div>

      <div class="bg-card border border-border rounded-xl p-5">
        <h3 class="font-bold text-foreground text-sm mb-4">Related Games</h3>
        <div class="space-y-3">
          <a href="#" v-for="item in similarGames" :key="item.id" class="flex gap-3 group">
            <div class="w-16 h-12 rounded overflow-hidden shrink-0 border border-border">
              <img :src="item.thumb" alt="Thumb" class="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            </div>
            <div class="flex flex-col justify-center">
              <span class="text-sm font-bold text-foreground group-hover:text-indigo-500 transition-colors line-clamp-1">{{ item.title }}</span>
              <span class="text-xs text-muted-foreground">by {{ item.author }}</span>
            </div>
          </a>
        </div>
      </div>

    </aside>

  </div>
</template>

<style scoped>
/* Markdown Content (Prose) Styling overrides jika diperlukan */
:deep(.prose) {
  color: var(--muted-foreground);
}
:deep(.prose h3) {
  color: var(--foreground);
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}
:deep(.prose strong) {
  color: var(--foreground);
}
:deep(.prose ul) {
  list-style-type: disc;
  padding-left: 1.25em;
}
:deep(.prose li) {
  margin-bottom: 0.25em;
}
</style>