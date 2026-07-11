<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Play, Loader2, AlertCircle, Maximize, Minimize } from 'lucide-vue-next';
import { usePlayLogic } from '@modules/detail/composables/usePlayLogic';
import { useThumbnailUrl } from '@/composables/useThumbnailUrl.js'; 

const props = defineProps({
  publishedId: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: ''
  }
});

const { getThumbnailUrl } = useThumbnailUrl();

const { 
  gameCanvas, 
  isLoading, 
  isPlaying, 
  error, 
  loadingMessage,
  loadingProgress,
  startGame,
  stopGame
} = usePlayLogic();

const containerRef = ref(null);
const isFullscreen = ref(false);

const toggleFullscreen = async () => {
  if (!document.fullscreenElement) {
    try {
      await containerRef.value?.requestFullscreen();
    } catch (err) {
      console.error(`Gagal masuk ke mode fullscreen: ${err.message}`);
    }
  } else {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    }
  }
};

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange);
});

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  stopGame();
});

const handlePlayClick = () => {
  startGame(props.publishedId);
};
</script>

<template>
  <div 
    ref="containerRef"
    class="relative w-full bg-slate-950 overflow-hidden flex items-center justify-center group select-none transition-all duration-300"
    :class="[
      isFullscreen ? 'border-none rounded-none' : 'aspect-[16/9] rounded-xl border border-border shadow-2xl'
    ]"
  >
    
    <div v-if="!isPlaying && !isLoading" class="absolute inset-0 flex flex-col items-center justify-center">
      <img 
        v-if="thumbnailUrl" 
        :src="getThumbnailUrl(thumbnailUrl)" alt="Thumbnail" 
        class="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity duration-500" 
      />
      
      <div class="relative z-10 flex flex-col items-center gap-4">
        <button 
          @click="handlePlayClick"
          class="w-20 h-20 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-transform hover:scale-105 active:scale-95"
        >
          <Play class="w-10 h-10 ml-2" />
        </button>
        <span class="text-white font-bold tracking-wider text-sm bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-md">
          Run in Browser
        </span>
      </div>
    </div>

    <div v-if="isLoading" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950 px-8 text-center">
      <Loader2 class="w-12 h-12 animate-spin mb-6 text-cyan-500" />
      
      <div class="w-full max-w-md bg-slate-800 rounded-full h-2 mb-3 overflow-hidden shadow-inner">
        <div 
          class="bg-cyan-500 h-2 rounded-full transition-all duration-300 ease-out"
          :style="{ width: `${loadingProgress}%` }"
        ></div>
      </div>

      <div class="flex flex-col items-center">
        <span class="text-sm font-bold tracking-widest uppercase text-cyan-300 animate-pulse mb-1">
          {{ loadingMessage || 'Memuat Engine...' }}
        </span>
        <span class="text-xs text-slate-400 font-medium">
          {{ loadingProgress }}%
        </span>
      </div>
    </div>

    <!-- State 3: Terjadi Error -->
    <div v-if="error" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950 text-rose-500 p-6 text-center">
      <AlertCircle class="w-12 h-12 mb-3 opacity-80" />
      <p class="font-bold text-lg mb-1">Failed to Load</p>
      <p class="text-sm text-rose-400 opacity-80">{{ error }}</p>
      <button @click="handlePlayClick" class="mt-4 px-4 py-2 border border-rose-500/50 rounded-md hover:bg-rose-500/10 text-sm font-medium transition-colors">
        Try Again
      </button>
    </div>

    <canvas 
      ref="gameCanvas" 
      class="block outline-none"
      :class="{ 'opacity-0 pointer-events-none': !isPlaying, 'opacity-100': isPlaying }"
      tabindex="0"
    ></canvas>

    <button 
      v-if="isPlaying"
      @click="toggleFullscreen"
      class="absolute bottom-4 right-4 z-50 p-2.5 bg-black/40 hover:bg-black/80 text-white/80 hover:text-white rounded-lg backdrop-blur-sm transition-all duration-300"
      :class="isFullscreen ? 'opacity-0 group-hover:opacity-100 focus:opacity-100' : 'opacity-100'"
      :title="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'"
    >
      <Minimize v-if="isFullscreen" class="w-5 h-5" />
      <Maximize v-else class="w-5 h-5" />
    </button>

  </div>
</template>