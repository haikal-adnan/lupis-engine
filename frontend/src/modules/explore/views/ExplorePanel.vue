<script setup>
import { MonitorPlay, Download, ChevronRight, Gamepad2, User } from 'lucide-vue-next';
import { useExploreLogic } from '@/modules/explore/composables/useExploreLogic.js';
import { useAvatarUrl } from '@/composables/useAvatarUrl.js';
import { useThumbnailUrl } from '@/composables/useThumbnailUrl.js';

const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  }
});

const { filteredGames, isLoading } = useExploreLogic(props);
const { getAvatarUrl } = useAvatarUrl();
const { getThumbnailUrl } = useThumbnailUrl();
</script>

<template>
  <div class="flex-1 max-w-[1400px] mx-auto w-full px-4 lg:px-6 py-8">
    
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-border">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Eksplorasi</h1>
        <p class="text-sm text-muted-foreground mt-1">Temukan game menarik yang dibuat dengan Lupis Engine</p>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-20">
       <div class="w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <router-link 
        v-for="game in filteredGames" 
        :key="game._id" 
        :to="`/play/${game.slug}`"
        class="group flex flex-col bg-card rounded-xl border border-border overflow-hidden hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300"
      >
        <div class="relative aspect-[16/10] overflow-hidden bg-muted/50 border-b border-border">
          <img 
            v-if="game.thumbnailUrl" 
            :src="getThumbnailUrl(game.thumbnailUrl)" :alt="game.title" 
            @error="game.thumbnailUrl = null"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
          />
          <div v-else class="w-full h-full flex items-center justify-center text-muted-foreground/20 group-hover:text-cyan-500/20 transition-colors">
            <Gamepad2 class="w-12 h-12" :stroke-width="1.5" />
          </div>
          
          <div class="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
            <span class="text-cyan-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              Lihat Detail <ChevronRight class="w-3 h-3" />
            </span>
          </div>
        </div>

        <div class="p-4 flex-1 flex flex-col">
          <h2 class="text-lg font-bold text-foreground leading-tight mb-1 group-hover:text-cyan-500 transition-colors line-clamp-1">
            {{ game.title }}
          </h2>
          
          <div class="flex items-center gap-2 mb-3">
            <img 
              v-if="game.creator.avatar" 
              :src="getAvatarUrl(game.creator.avatar)" 
              @error="game.creator.avatar = null"
              alt="Avatar" 
              class="w-5 h-5 rounded-full object-cover border border-border" 
            />
            <div v-else class="w-5 h-5 rounded-full bg-muted flex items-center justify-center border border-border">
              <User class="w-3 h-3 text-muted-foreground" />
            </div>

            <span class="text-xs text-muted-foreground hover:text-foreground transition-colors line-clamp-1">
              {{ game.creator.name }}
            </span>
          </div>

          <div class="mt-auto pt-3 border-t border-border flex items-center gap-2">
            <div v-if="game.playOnBrowser" class="flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
              <MonitorPlay class="w-3 h-3" /> Web
            </div>
            <div v-if="game.downloads?.exe" class="flex items-center gap-1 text-[10px] uppercase font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
              <Download class="w-3 h-3" /> PC
            </div>
            <div v-if="game.downloads?.apk" class="flex items-center gap-1 text-[10px] uppercase font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded">
              <Download class="w-3 h-3" /> APK
            </div>
          </div>
        </div>
      </router-link>
    </div>

  </div>
</template>