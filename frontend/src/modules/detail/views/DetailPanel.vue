<script setup>
import { Play, Download, Monitor, Code, Gamepad2, User } from 'lucide-vue-next';
import PlayBrowser from '@modules/detail/views/PlayBrowser.vue';
import { useGameDetailLogic } from '@/modules/detail/composables/useGameDetailLogic.js';
import { useAvatarUrl } from '@/composables/useAvatarUrl.js';
import '@vueup/vue-quill/dist/vue-quill.snow.css';

const { game, isLoading } = useGameDetailLogic();
const { getAvatarUrl } = useAvatarUrl();

</script>

<template>
  <div v-if="isLoading" class="flex-1 flex items-center justify-center min-h-[400px]">
     <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
  </div>

  <div v-else-if="game" class="flex-1 max-w-[1000px] mx-auto w-full px-4 lg:px-6 py-8 flex flex-col gap-10">
    <main class="w-full space-y-8">
      
      <div class="relative aspect-[16/9] bg-black rounded-xl overflow-hidden border border-border shadow-2xl flex items-center justify-center group">
        
        <template v-if="game.playOnBrowser">
          <PlayBrowser 
            :publishedId="game._id" 
            :thumbnailUrl="game.thumbnailUrl" 
          />
        </template>

        <div v-else class="w-full h-full relative flex items-center justify-center bg-muted/10">
          <img 
            v-if="game.thumbnailUrl" 
            :src="game.thumbnailUrl" 
            @error="game.thumbnailUrl = null"
            alt="Thumbnail" 
            class="absolute inset-0 w-full h-full object-cover opacity-20" 
          />
          <div v-else class="absolute inset-0 w-full h-full flex items-center justify-center opacity-10">
            <Gamepad2 class="w-32 h-32 text-muted-foreground" />
          </div>

          <div class="relative z-10 flex flex-col items-center justify-center text-muted-foreground text-center px-4">
            <Monitor class="w-12 h-12 mb-2 opacity-50" />
            <p class="font-medium">Game ini tidak mendukung Play on Browser.</p>
            <p class="text-xs">Silahkan gunakan link download di bawah untuk memainkan.</p>
          </div>
        </div>
      </div>

      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 class="text-4xl font-extrabold tracking-tight text-foreground mb-4">{{ game.title }}</h1>
          
          <router-link 
            v-if="game.creator?.username"
            :to="`/profile/${game.creator.username}`" 
            class="flex items-center gap-3 group hover:bg-muted/50 p-2 -ml-2 rounded-xl transition-all w-max outline-none"
          >
            <img 
              v-if="game.creator.avatar" 
              :src="getAvatarUrl(game.creator.avatar)" 
              @error="game.creator.avatar = null"
              alt="Creator" 
              class="w-10 h-10 rounded-full border border-border object-cover group-hover:border-cyan-500/50 transition-colors" 
            />
            <div v-else class="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border group-hover:border-cyan-500/50 transition-colors">
              <User class="w-5 h-5 text-muted-foreground group-hover:text-cyan-500 transition-colors" />
            </div>

            <div class="text-sm">
              <span class="text-muted-foreground">Created by</span> 
              <span class="font-bold text-foreground ml-1 group-hover:text-cyan-500 transition-colors">
                {{ game.creator.name }}
              </span>
            </div>
          </router-link>

          <div v-else class="flex items-center gap-3 p-2 -ml-2 w-max">
            <img 
              v-if="game.creator?.avatar" 
              :src="getAvatarUrl(game.creator.avatar)" 
              @error="game.creator.avatar = null"
              alt="Creator" 
              class="w-10 h-10 rounded-full border border-border object-cover" 
            />
            <div v-else class="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border">
              <User class="w-5 h-5 text-muted-foreground" />
            </div>

            <div class="text-sm">
              <span class="text-muted-foreground">Created by</span> 
              <span class="font-bold text-foreground ml-1">
                {{ game.creator?.name || 'Unknown' }}
              </span>
            </div>
          </div>

        </div>
        
        <div class="flex flex-wrap items-center gap-3 shrink-0">
          <a v-if="game.downloads?.exe" :href="game.downloads.exe" target="_blank" class="h-10 px-5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2">
            <Download class="w-4 h-4" /> Windows (EXE)
          </a>
          <a v-if="game.downloads?.apk" :href="game.downloads.apk" target="_blank" class="h-10 px-5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2">
            <Download class="w-4 h-4" /> Android (APK)
          </a>
        </div>
      </div>

      <div>
        <h3 class="font-bold text-lg mb-4">Tentang Game Ini</h3>
        <div class="ql-snow">
          <div class="ql-editor" v-html="game.description" style="padding: 0;"></div>
        </div>
      </div>

    </main>
  </div>
  
</template>

<style scoped>
/* Prose Markdown styling */
:deep(.prose) {
  color: var(--muted-foreground);
  line-height: 1.6;
}
:deep(.prose strong) {
  color: var(--foreground);
}
:deep(.prose p) {
  margin-bottom: 1rem;
}
</style>