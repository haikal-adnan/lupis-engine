<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { 
  Gamepad2, Github, Twitter, Globe, Download, ChevronRight, User, MonitorPlay
} from 'lucide-vue-next';
import { useProfileLogic } from '@modules/profile/composables/useProfileLogic.js'; 
import { useAvatarUrl } from '@/composables/useAvatarUrl.js';
import { useThumbnailUrl } from '@/composables/useThumbnailUrl.js'; // <-- Import helper thumbnail

const route = useRoute();
const { profile, publishedGames, isLoading, error, fetchProfile } = useProfileLogic();
const { getAvatarUrl } = useAvatarUrl();
const { getThumbnailUrl } = useThumbnailUrl(); // <-- Ekstrak fungsi

// Ambil parameter dari URL
const usernameUser = computed(() => route.params.usernameUser);

// Load data saat komponen dimuat
onMounted(() => {
  if (usernameUser.value) {
    fetchProfile(usernameUser.value);
  }
});

const totalPublishedGames = computed(() => publishedGames.value.length);
</script>

<template>
  <div class="flex-1 max-w-[1200px] mx-auto w-full px-4 lg:px-6 py-8">

    <div v-if="isLoading" class="flex justify-center py-20">
      <div class="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
    </div>

    <div v-else-if="error" class="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center text-red-500">
      <h2 class="text-xl font-bold mb-2">Oops!</h2>
      <p>{{ error }}</p>
    </div>

    <template v-else-if="profile">
      <div class="bg-card border border-border rounded-2xl p-6 lg:p-8 mb-10 flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
        <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div class="shrink-0 relative">
          <img 
            v-if="profile.avatar_url" 
            :src="getAvatarUrl(profile.avatar_url)" 
            alt="Profile" 
            class="w-32 h-32 rounded-2xl object-cover border-2 border-border shadow-sm bg-muted" 
          />
          <div v-else class="w-32 h-32 rounded-2xl border-2 border-border bg-muted flex items-center justify-center">
             <User class="w-12 h-12 text-muted-foreground" />
          </div>
        </div>

        <div class="flex-1 z-10 text-center md:text-left w-full">
          <h1 class="text-3xl font-extrabold tracking-tight text-foreground">
            {{ profile.display_name || profile.username }}
          </h1>
          <p class="text-indigo-500 font-medium mb-2">@{{ profile.username }}</p>
          
          <p class="text-muted-foreground mb-4 max-w-2xl text-sm md:text-base md:mx-0 mx-auto" :class="{'italic opacity-80': !profile.bio}">
            {{ profile.bio || "No description provided. This developer is still working on their awesome profile." }}
          </p>

          <div v-if="profile.tags && profile.tags.length" class="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-6">
            <span v-for="tag in profile.tags" :key="tag" class="text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded-md font-medium">
              {{ tag }}
            </span>
          </div>

          <div class="flex flex-col sm:flex-row items-center gap-6 justify-between mt-6">
            <div class="flex items-center gap-2">
              <a v-if="profile.website_url" :href="profile.website_url" target="_blank" class="p-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Globe class="w-5 h-5" />
              </a>
              <a v-if="profile.github_url" :href="profile.github_url" target="_blank" class="p-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Github class="w-5 h-5" />
              </a>
              <a v-if="profile.twitter_url" :href="profile.twitter_url" target="_blank" class="p-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Twitter class="w-5 h-5" />
              </a>
            </div>

            <div class="flex items-center gap-3 bg-muted/50 border border-border px-4 py-2 rounded-lg ml-0 sm:ml-auto">
              <div class="w-8 h-8 rounded-md bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Gamepad2 class="w-4 h-4 text-indigo-500" />
              </div>
              <div class="text-left">
                <div class="text-sm font-bold text-foreground">{{ totalPublishedGames }} Games</div>
                <div class="text-xs text-muted-foreground">Published</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section>
        <div class="flex items-center justify-between mb-6 border-b border-border pb-3">
          <h2 class="text-xl font-bold text-foreground flex items-center gap-2">
            <Gamepad2 class="w-6 h-6 text-indigo-500" />
            Published Projects
          </h2>
        </div>
        
        <div v-if="publishedGames.length === 0" class="text-center py-10 bg-muted/20 border border-dashed border-border rounded-xl">
          <Gamepad2 class="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p class="text-muted-foreground font-medium">Belum ada game yang dipublish.</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <router-link 
            v-for="game in publishedGames" 
            :key="game._id" 
            :to="`/play/${game.slug}`"
            class="group flex flex-col bg-card rounded-xl border border-border overflow-hidden hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
          >
            <div class="relative aspect-[16/10] overflow-hidden bg-muted/50 border-b border-border">
              <img 
                v-if="game.thumbnailUrl" 
                :src="getThumbnailUrl(game.thumbnailUrl)" :alt="game.title" 
                @error="game.thumbnailUrl = null"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
              />
              <div v-else class="w-full h-full flex items-center justify-center text-muted-foreground/20 group-hover:text-indigo-500/20 transition-colors">
                <Gamepad2 class="w-12 h-12" :stroke-width="1.5" />
              </div>
              
              <div class="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span class="text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  View Detail <ChevronRight class="w-3 h-3" />
                </span>
              </div>
            </div>

            <div class="p-4 flex-1 flex flex-col">
              <h2 class="text-lg font-bold text-foreground leading-tight mb-1 group-hover:text-indigo-500 transition-colors line-clamp-1">
                {{ game.title }}
              </h2>
              
              <div class="flex items-center gap-2 mb-3">
                <img 
                  v-if="profile.avatar_url" 
                  :src="getAvatarUrl(profile.avatar_url)" 
                  @error="profile.avatar_url = null"
                  alt="Avatar" 
                  class="w-5 h-5 rounded-full object-cover border border-border" 
                />
                <div v-else class="w-5 h-5 rounded-full bg-muted flex items-center justify-center border border-border">
                  <User class="w-3 h-3 text-muted-foreground" />
                </div>

                <span class="text-xs text-muted-foreground hover:text-foreground transition-colors line-clamp-1">
                  {{ profile.display_name || profile.username }}
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
      </section>
    </template>

  </div>
</template>