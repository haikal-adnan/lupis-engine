<template>
  <Teleport to="body">
    <audio 
      ref="audioRef" 
      :src="state.audioUrl" 
      crossorigin="anonymous"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="onEnded"
      @canplay="isLoading = false"
      @waiting="isLoading = true"
      @playing="isLoading = false"
      class="hidden"
    ></audio>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="state.isOpen" 
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6"
        @click.self="handleClose"
      >
        <div 
          class="bg-background border border-border rounded-lg shadow-2xl flex flex-col transform transition-all max-w-md w-full overflow-hidden"
          :class="{ 'scale-100': state.isOpen, 'scale-95': !state.isOpen }"
        >
          <div class="px-4 py-3 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h3 class="text-sm font-semibold text-foreground truncate pr-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              {{ state.title }}
            </h3>
            <button 
              @click="handleClose"
              class="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1 rounded transition-colors"
              title="Close (Esc)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <div class="h-32 w-full bg-black/90 relative flex items-center justify-center overflow-hidden">
            <canvas ref="canvasRef" class="w-full h-full absolute inset-0"></canvas>
            <div v-if="isLoading" class="absolute text-emerald-500 animate-pulse text-xs">Loading Audio...</div>
          </div>

          <div class="p-4 bg-card flex flex-col gap-3">
            <div class="flex items-center gap-3 text-xs font-medium text-muted-foreground font-mono">
              <span class="w-10 text-right">{{ formatTime(currentTime) }}</span>
              <input 
                type="range" 
                min="0" 
                :max="duration || 100" 
                v-model="currentTime" 
                @input="handleSeek"
                class="flex-1 custom-range cursor-pointer"
              />
              <span class="w-10">{{ formatTime(duration) }}</span>
            </div>

            <div class="flex justify-center">
              <button 
                @click="togglePlay"
                class="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 hover:scale-105 transition-all shadow-md"
              >
                <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { usePopAudio } from '@/composables/usePopAudio';

const { state, closeAudio } = usePopAudio();

const audioRef = ref(null);
const canvasRef = ref(null);

const isPlaying = ref(false);
const isLoading = ref(true);
const currentTime = ref(0);
const duration = ref(0);

let audioCtx = null;
let analyser = null;
let source = null;
let animationId = null;
let isVisualizerSetup = false;

watch(() => state.value.isOpen, async (isOpen) => {
  if (isOpen) {
    isPlaying.value = false;
    isLoading.value = true;
    currentTime.value = 0;
    duration.value = 0;
    
    await nextTick(); 
    
    if (audioRef.value) {
      togglePlay();
    }
  } else {
    cleanupAudio();
  }
});

const handleClose = () => {
  cleanupAudio();
  closeAudio();
};

const togglePlay = () => {
  if (!audioRef.value) return;

  if (audioRef.value.paused) {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    audioRef.value.play().then(() => {
      isPlaying.value = true;
      initVisualizer();
    }).catch((e) => {
      console.warn("Autoplay dicegah oleh browser:", e);
      isPlaying.value = false;
    });
  } else {
    audioRef.value.pause();
    isPlaying.value = false;
  }
};

const handleSeek = () => {
  if (audioRef.value) {
    audioRef.value.currentTime = currentTime.value;
  }
};

const onTimeUpdate = () => {
  if (audioRef.value) {
    currentTime.value = audioRef.value.currentTime;
  }
};

const onLoadedMetadata = () => {
  if (audioRef.value) {
    duration.value = audioRef.value.duration;
  }
};

const onEnded = () => {
  isPlaying.value = false;
  currentTime.value = 0;
};

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const initVisualizer = () => {
  if (!audioRef.value || !canvasRef.value) return;

  if (!isVisualizerSetup) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    
    source = audioCtx.createMediaElementSource(audioRef.value);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    
    analyser.fftSize = 128;
    isVisualizerSetup = true;
  }

  if (animationId) cancelAnimationFrame(animationId);
  drawVisualizer();
};

const drawVisualizer = () => {
  if (!canvasRef.value || !analyser || !state.value.isOpen) return;

  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const draw = () => {
    if (!state.value.isOpen) return;
    animationId = requestAnimationFrame(draw);

    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] / 2;

      const r = 16;
      const g = Math.min(255, 185 + barHeight);
      const b = 129;

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }
  };

  draw();
};

const cleanupAudio = () => {
  isPlaying.value = false;
  if (audioRef.value) {
    audioRef.value.pause();
  }
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
};

const handleKeydown = (e) => {
  if (!state.value.isOpen) return;
  if (e.key === 'Escape') handleClose();
  if (e.key === ' ') {
    e.preventDefault(); 
    togglePlay();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
  cleanupAudio();
  if (audioCtx && audioCtx.state !== 'closed') {
    audioCtx.close();
  }
});
</script>

<style scoped>
.custom-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  background: #3f3f46;
  border-radius: 999px;
  outline: none;
}

.custom-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #10b981;
  cursor: pointer;
  transition: transform 0.1s;
  box-shadow: 0 0 5px rgba(16, 185, 129, 0.5);
}

.custom-range::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.custom-range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #10b981;
  cursor: pointer;
  border: none;
  transition: transform 0.1s;
  box-shadow: 0 0 5px rgba(16, 185, 129, 0.5);
}

.custom-range::-moz-range-thumb:hover {
  transform: scale(1.2);
}
</style>