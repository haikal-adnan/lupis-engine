<template>
  <div 
    ref="panelRef" 
    class="relative w-full h-full bg-[#111] overflow-hidden select-none" 
    :class="[ isSpacePressed ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default' ]"
    @mousedown="handleMouseDown" 
    @wheel.prevent="handleWheel" 
    data-testid="animator-panel-viewport"
  >
    <!-- Grid Overlay Custom -->
    <div 
      v-if="showGrid" 
      class="absolute inset-0 opacity-15 pointer-events-none" 
      :style="gridStyle"
    ></div>
    
    <div 
      class="absolute top-0 left-0 w-full h-full origin-top-left pointer-events-none" 
      :style="{ transform: `translate3d(${Math.round(camera.x)}px, ${Math.round(camera.y)}px, 0) scale(${camera.scale})` }"
    >
      <div class="absolute top-0 left-0">
        <div v-if="!activeClipData || !activeClipData.assetId" class="chess-pattern absolute border border-muted/30 shadow-lg" :style="fallbackStyle">
          <Film class="w-8 h-8 text-muted-foreground/30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        
        <template v-else>
          <!-- Shadow Frames -->
          <template v-if="showShadow">
            <div 
              v-for="shadow in shadowFramesList" 
              :key="shadow.key" 
              class="absolute bg-no-repeat filter brightness-125 contrast-75 pointer-events-none z-0" 
              :style="shadow.style"
            ></div>
          </template>

          <!-- Current Active Frame -->
          <div class="absolute bg-no-repeat shadow-lg z-10" :style="frameStyle"></div>
        </template>
      </div>
    </div>

    <div class="absolute bottom-4 left-4 right-4 flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold tracking-widest pointer-events-none">
      <span data-testid="animator-panel-zoom-text">Zoom: {{ Math.round(camera.scale * 100) }}%</span>
      <span data-testid="animator-panel-entity-text">Entity ID: {{ activeEntityId || 'None' }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Film } from 'lucide-vue-next';
import { useAnimatorLogic } from '@animators/animators.js';

const panelRef = ref(null);
const { activeClipData, activeEntityId, currentFrameIndex, resolvedAssetUrl, showShadow, shadowFrameCount, shadowOpacity, showGrid, gridSize } = useAnimatorLogic();

const camera = ref({ x: 0, y: 0, scale: 1 });
const isPanning = ref(false);
const isSpacePressed = ref(false);
const startMouse = { x: 0, y: 0 };
const startCam = { x: 0, y: 0 };
let cachedRect = null;

const handleKeyDown = (e) => {
  if (e.code === 'Space' && !e.repeat && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    isSpacePressed.value = true;
  }
};

const handleKeyUp = (e) => {
  if (e.code === 'Space') {
    isSpacePressed.value = false;
    isPanning.value = false;
  }
};

const handleMouseDown = (e) => {
  if ((e.button === 0 && isSpacePressed.value) || e.button === 1) {
    isPanning.value = true;
    startMouse.x = e.clientX;
    startMouse.y = e.clientY;
    startCam.x = camera.value.x;
    startCam.y = camera.value.y;
  }
};

const handleGlobalMouseMove = (e) => {
  if (isPanning.value) {
    camera.value.x = startCam.x + (e.clientX - startMouse.x);
    camera.value.y = startCam.y + (e.clientY - startMouse.y);
  }
};

const handleGlobalMouseUp = () => {
  isPanning.value = false;
};

const handleWheel = (e) => {
  if (!panelRef.value) return;
  if (!cachedRect) cachedRect = panelRef.value.getBoundingClientRect();
  
  const mouseX = e.clientX - cachedRect.left;
  const mouseY = e.clientY - cachedRect.top;
  const delta = e.deltaY < 0 ? 1 : -1;
  const oldScale = camera.value.scale;
  
  let newScale = Math.max(0.1, Math.min(10.0, oldScale * (1 + delta * 0.1)));
  if (newScale === oldScale) return;
  
  const worldX = (mouseX - camera.value.x) / oldScale;
  const worldY = (mouseY - camera.value.y) / oldScale;
  
  camera.value.scale = newScale;
  camera.value.x = mouseX - (worldX * newScale);
  camera.value.y = mouseY - (worldY * newScale);
  
  nextTick(() => { cachedRect = panelRef.value?.getBoundingClientRect(); });
};

const centerCamera = () => {
  if (panelRef.value) {
    const rect = panelRef.value.getBoundingClientRect();
    camera.value.x = rect.width / 2;
    camera.value.y = rect.height / 2;
    camera.value.scale = 1;
  }
};

onMounted(() => {
  centerCamera();
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('mousemove', handleGlobalMouseMove);
  window.addEventListener('mouseup', handleGlobalMouseUp);
  window.addEventListener('resize', centerCamera);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  window.removeEventListener('mousemove', handleGlobalMouseMove);
  window.removeEventListener('mouseup', handleGlobalMouseUp);
  window.removeEventListener('resize', centerCamera);
});

const currentFrameData = computed(() => {
  const clip = activeClipData.value;
  if (!clip || !clip.frames || clip.frames.length === 0) return null;
  const index = Math.min(Math.max(0, currentFrameIndex.value), clip.frames.length - 1);
  const sourceId = clip.frames[index];
  return clip.sources ? clip.sources[sourceId] : null;
});

const buildFrameStyle = (frame, opacityVal = 1) => {
  const clip = activeClipData.value;
  if (!clip || !frame || frame.w === 0 || frame.h === 0) return { display: 'none' };

  const isFlipped = clip.flipX || false;
  const px = isFlipped ? (1.0 - (clip.pivot?.x ?? 0.5)) : (clip.pivot?.x ?? 0.5);
  const py = clip.pivot?.y ?? 1.0;

  return {
    width: `${frame.w}px`,
    height: `${frame.h}px`,
    backgroundImage: resolvedAssetUrl.value ? `url("${resolvedAssetUrl.value}")` : 'none',
    backgroundPosition: `-${frame.x}px -${frame.y}px`,
    transform: `translate(-${px * 100}%, -${py * 100}%)${isFlipped ? ' scaleX(-1)' : ''}`,
    imageRendering: 'pixelated',
    opacity: opacityVal
  };
};

const frameStyle = computed(() => buildFrameStyle(currentFrameData.value || { x: 0, y: 0, w: 0, h: 0 }, 1));

const shadowFramesList = computed(() => {
  if (!showShadow.value || !activeClipData.value || !activeClipData.value.frames) return [];
  const clip = activeClipData.value;
  const totalFrames = clip.frames.length;
  if (totalFrames <= 1) return [];

  const currIdx = Math.min(Math.max(0, currentFrameIndex.value), totalFrames - 1);
  const count = Math.max(1, shadowFrameCount.value || 1);
  const baseOpacity = (shadowOpacity.value ?? 80) / 100;

  const results = [];

  for (let step = 1; step <= count; step++) {
    let targetIdx = currIdx - step;
    if (targetIdx < 0) {
      if (clip.isLooping) {
        targetIdx = (targetIdx % totalFrames + totalFrames) % totalFrames;
      } else {
        break;
      }
    }

    const sourceId = clip.frames[targetIdx];
    const frame = clip.sources ? clip.sources[sourceId] : null;
    if (frame && frame.w > 0 && frame.h > 0) {
      const calcOpacity = baseOpacity * Math.pow(0.5, step - 1);
      results.push({
        key: `shadow_${step}_${sourceId}`,
        style: buildFrameStyle(frame, calcOpacity)
      });
    }
  }

  return results;
});

const gridStyle = computed(() => {
  const sz = (gridSize.value || 32) * camera.value.scale;
  return {
    backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
    backgroundSize: `${sz}px ${sz}px`,
    backgroundPosition: `${camera.value.x}px ${camera.value.y}px`
  };
});

const fallbackStyle = computed(() => {
  const clip = activeClipData.value;
  return {
    width: `${clip?.baseSize?.w || 64}px`,
    height: `${clip?.baseSize?.h || 64}px`,
    transform: `translate(-${(clip?.pivot?.x ?? 0.5) * 100}%, -${(clip?.pivot?.y ?? 1.0) * 100}%)`
  };
});
</script>