<template>
  <div 
    ref="panelRef"
    class="relative w-full h-full bg-[#111] overflow-hidden select-none"
    @mousedown.middle="startPan" 
    @wheel.prevent="handleWheel"
  >
    <div 
      class="absolute inset-0 opacity-10 pointer-events-none" 
      :style="{
        backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
        backgroundSize: `${20 * camera.scale}px ${20 * camera.scale}px`,
        backgroundPosition: `${camera.x}px ${camera.y}px`
      }"
    ></div>
    
    <div 
      class="absolute top-0 left-0 w-full h-full origin-top-left pointer-events-none"
      :style="{ 
        transform: `translate3d(${Math.round(camera.x)}px, ${Math.round(camera.y)}px, 0) scale(${camera.scale})` 
      }"
    >
      <div class="absolute top-0 left-0">
        
        <div 
          v-if="!activeClipData || !activeClipData.assetId"
          class="chess-pattern absolute border border-muted/30 shadow-lg"
          :style="fallbackStyle"
        >
          <Film class="w-8 h-8 text-muted-foreground/30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div 
          v-else 
          class="absolute bg-no-repeat shadow-lg"
          :style="frameStyle"
        ></div>

      </div>
    </div>

    <div class="absolute bottom-4 left-4 right-4 flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold tracking-widest pointer-events-none">
      <span>Zoom: {{ Math.round(camera.scale * 100) }}%</span>
      <div class="flex items-center gap-4">
        <span>Entity ID: {{ activeEntityId || 'None' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Film } from 'lucide-vue-next';
import { useAnimatorLogic } from '@editors/animator/composables/useAnimatorLogic.js'
import { useAssetStore } from '@/stores/useAssetStore'; 

const panelRef = ref(null);

const assetStore = useAssetStore();

const { activeClipData, selectedEntity, currentFrameIndex } = useAnimatorLogic();
const activeEntityId = computed(() => selectedEntity.value?._id);

const camera = ref({ x: 0, y: 0, scale: 1 });
const isPanning = ref(false);
const startMouse = { x: 0, y: 0 };
const startCam = { x: 0, y: 0 };
let cachedRect = null;

const startPan = (e) => {
  isPanning.value = true;
  startMouse.x = e.clientX;
  startMouse.y = e.clientY;
  startCam.x = camera.value.x;
  startCam.y = camera.value.y;
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
  const ZOOM_SPEED = 0.1;
  const oldScale = camera.value.scale;
  
  let newScale = oldScale * (1 + (delta * ZOOM_SPEED));
  newScale = Math.max(0.1, Math.min(10.0, newScale)); 
  
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
  window.addEventListener('mousemove', handleGlobalMouseMove);
  window.addEventListener('mouseup', handleGlobalMouseUp);
  window.addEventListener('resize', centerCamera);
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleGlobalMouseMove);
  window.removeEventListener('mouseup', handleGlobalMouseUp);
  window.removeEventListener('resize', centerCamera);
});

const resolveAssetUrl = (assetId) => {
  if (!assetId) return '';
  return assetStore.getAssetUrlById(assetId) || '';
};

const currentFrameData = computed(() => {
  const clip = activeClipData.value;
  if (!clip || !clip.frames || clip.frames.length === 0) return null;
  
  const index = Math.min(Math.max(0, currentFrameIndex.value), clip.frames.length - 1);
  
  const sourceId = clip.frames[index];
  
  return clip.sources ? clip.sources[sourceId] : null;
});

const frameStyle = computed(() => {
  const clip = activeClipData.value;
  const frame = currentFrameData.value || { x: 0, y: 0, w: 0, h: 0 };
  
  if (!clip) return {};

  const w = frame.w;
  const h = frame.h;
  
  const isFlipped = clip.flipX || false;
  const px = isFlipped ? (1.0 - (clip.pivot?.x ?? 0.5)) : (clip.pivot?.x ?? 0.5);
  const py = clip.pivot?.y ?? 1.0;
  
  const bgX = frame.x;
  const bgY = frame.y;

  const imageUrl = resolveAssetUrl(clip.assetId);
  const flipTransform = isFlipped ? ' scaleX(-1)' : '';

  if (w === 0 || h === 0) {
    return { display: 'none' };
  }

  return {
    width: `${w}px`,
    height: `${h}px`,
    backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
    backgroundPosition: `-${bgX}px -${bgY}px`,
    transform: `translate(-${px * 100}%, -${py * 100}%)${flipTransform}`,
    imageRendering: 'pixelated'
  };
});

const fallbackStyle = computed(() => {
  const clip = activeClipData.value;
  const w = clip?.baseSize?.w || 64; 
  const h = clip?.baseSize?.h || 64;
  const px = clip?.pivot?.x ?? 0.5;
  const py = clip?.pivot?.y ?? 1.0;

  return {
    width: `${w}px`,
    height: `${h}px`,
    transform: `translate(-${px * 100}%, -${py * 100}%)`,
  };
});
</script>