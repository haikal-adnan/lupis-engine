<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Play, Loader2, AlertCircle, Maximize, Minimize } from 'lucide-vue-next';
import { usePlayLogic } from '@explores/explores.js';

const props = defineProps({
  projectId: {
    type: String,
    required: true
  }
});

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
  startGame(props.projectId);
};
</script>

<template>
  <div 
    ref="containerRef"
    class="relative w-full h-full bg-slate-950 overflow-hidden flex items-center justify-center group select-none"
  >
    <!-- Overlay Siap Main -->
    <div v-if="!isPlaying && !isLoading" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div class="relative z-10 flex flex-col items-center gap-4">
        <button 
          @click="handlePlayClick"
          class="w-20 h-20 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-transform hover:scale-105 active:scale-95"
        >
          <Play class="w-10 h-10 ml-1.5 fill-current" />
        </button>
        <span class="text-white font-bold tracking-wider text-xs bg-black/60 px-4 py-1.5 rounded-full border border-white/10">
          Jalankan dari OPFS
        </span>
      </div>
    </div>

    <!-- Overlay Loading Progress -->
    <div v-if="isLoading" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950 px-8 text-center">
      <Loader2 class="w-10 h-10 animate-spin mb-6 text-cyan-500" />
      
      <div class="w-full max-w-md bg-slate-800 rounded-full h-2 mb-3 overflow-hidden shadow-inner">
        <div 
          class="bg-cyan-500 h-2 rounded-full transition-all duration-300 ease-out"
          :style="{ width: `${loadingProgress}%` }"
        ></div>
      </div>

      <div class="flex flex-col items-center font-mono">
        <span class="text-xs font-bold tracking-widest uppercase text-cyan-300 animate-pulse mb-1">
          {{ loadingMessage || 'Membaca Resource OPFS...' }}
        </span>
        <span class="text-[11px] text-slate-400">
          {{ loadingProgress }}%
        </span>
      </div>
    </div>

    <!-- Overlay Error State -->
    <div v-if="error" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950 text-rose-500 p-6 text-center">
      <AlertCircle class="w-12 h-12 mb-3 opacity-80" />
      <p class="font-bold text-base mb-1">Gagal Memuat dari OPFS</p>
      <p class="text-xs text-rose-400 opacity-80 mb-4">{{ error }}</p>
      <button 
        @click="handlePlayClick" 
        class="px-4 py-2 border border-rose-500/50 rounded-lg hover:bg-rose-500/10 text-xs font-medium transition-colors"
      >
        Coba Lagi
      </button>
    </div>

    <!-- Canvas Renderer -->
    <canvas 
      ref="gameCanvas" 
      class="block outline-none"
      :class="{ 'opacity-0 pointer-events-none': !isPlaying, 'opacity-100': isPlaying }"
      tabindex="0"
    ></canvas>

    <!-- Fullscreen Toggle Button -->
    <button 
      v-if="isPlaying"
      @click="toggleFullscreen"
      class="absolute bottom-4 right-4 z-50 p-2.5 bg-black/50 hover:bg-black/80 text-white/80 hover:text-white rounded-lg backdrop-blur-sm transition-all"
      :title="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'"
    >
      <Minimize v-if="isFullscreen" class="w-5 h-5" />
      <Maximize v-else class="w-5 h-5" />
    </button>
  </div>
</template>