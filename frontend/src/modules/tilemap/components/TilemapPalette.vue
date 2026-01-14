<template>
  <PropertySection title="Tile Palette" :icon="Grid" :showMenu="false">
    
    <div class="flex gap-1 p-1 border-b border-border bg-muted/10">
      
      <IconButton 
        :active="effectiveMode === 'select'" 
        tooltip="Select Tool (V)"
        @click="setMode('select')"
      >
        <MousePointer2 class="w-4 h-4" />
      </IconButton>

      <IconButton 
        :active="effectiveMode === 'pan'" 
        tooltip="Pan Tool (Space)"
        @click="setMode('pan')"
      >
        <Hand class="w-4 h-4" />
      </IconButton>

      </div>

    <div 
      ref="viewportRef"
      class="relative w-full h-64 bg-muted/20 border-b border-border overflow-hidden outline-none touch-none"
      :class="cursorClass"
      @wheel.prevent="handleWheel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointerleave="onPointerLeave" 
      @mouseenter="isHovering = true"
      @mouseleave="isHovering = false"
    >
      <div class="absolute inset-0 opacity-20 pointer-events-none" style="background-image: radial-gradient(#444 1px, transparent 1px); background-size: 10px 10px;"></div>

      <div class="absolute origin-top-left pixel-art-layer" :style="containerStyle">
        <img v-if="currentTextureUrl" :src="currentTextureUrl" class="block max-w-none select-none pointer-events-none" @load="onImageLoad" />
        <div v-else class="flex items-center justify-center w-64 h-64 text-xs text-muted-foreground">No Texture</div>

        <div 
          v-if="hasSelection"
          class="absolute border-2 border-blue-500 bg-blue-500/20 z-10 pointer-events-none"
          :style="selectionStyle"
        >
           <div class="absolute -top-4 left-0 bg-blue-600 text-white text-[9px] px-1 rounded shadow select-none whitespace-nowrap z-20">
             {{ selectionRect.w }}x{{ selectionRect.h }}
           </div>
        </div>

        <div v-if="currentTextureUrl" class="absolute inset-0 pointer-events-none" :style="gridOverlayStyle"></div>
      </div>
      
      <div class="absolute bottom-2 right-2 px-2 py-1 bg-background/80 rounded text-[10px] font-mono border border-border pointer-events-none z-20">
        {{ Math.round(viewScale * 100) }}%
      </div>
    </div>

    <PropertyRow label="View Control">
       <BaseButton variant="outline" class="h-6 text-[10px] w-full" @click="resetView">Reset View</BaseButton>
    </PropertyRow>

  </PropertySection>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Grid, Hand, MousePointer2 } from 'lucide-vue-next'; // Import Icons
import { useTilemapLogic } from '@/modules/tilemap/composables/useTilemapLogic.js';

// Components
import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseButton from "@/commons/components/buttons/BaseButton.vue";
import IconButton from '@/commons/components/buttons/IconButton.vue'; // Import IconButton

const { currentTextureUrl, tileWidth, tileHeight } = useTilemapLogic();

// --- STATE ---
const viewX = ref(0);
const viewY = ref(0);
const viewScale = ref(1);
const activeMode = ref('select');
const isSpacePressed = ref(false);
const isHovering = ref(false);

// Selection State
const isSelecting = ref(false);
const selectionStart = ref({ x: 0, y: 0 });
const selectionEnd = ref({ x: 0, y: 0 });
const hasSelection = ref(false);

// Pointer State
const isPanning = ref(false);
const lastPtrX = ref(0);
const lastPtrY = ref(0);
const startPtrX = ref(0);
const startPtrY = ref(0);

const viewportRef = ref(null);

// --- COMPUTED ---
const effectiveMode = computed(() => isSpacePressed.value ? 'pan' : activeMode.value);

const cursorClass = computed(() => {
  if (isPanning.value) return 'cursor-grabbing';
  if (effectiveMode.value === 'pan') return 'cursor-grab';
  return 'default'; 
});

const containerStyle = computed(() => ({
  transform: `translate(${Math.floor(viewX.value)}px, ${Math.floor(viewY.value)}px) scale(${viewScale.value})`
}));

// Marquee Math
const selectionRect = computed(() => {
  const x1 = Math.min(selectionStart.value.x, selectionEnd.value.x);
  const y1 = Math.min(selectionStart.value.y, selectionEnd.value.y);
  const x2 = Math.max(selectionStart.value.x, selectionEnd.value.x);
  const y2 = Math.max(selectionStart.value.y, selectionEnd.value.y);
  return { x: x1, y: y1, w: x2 - x1 + 1, h: y2 - y1 + 1 };
});

const selectionStyle = computed(() => {
  if (!hasSelection.value) return {};
  const tw = tileWidth.value || 32;
  const th = tileHeight.value || 32;
  const rect = selectionRect.value;
  return { 
    left: `${rect.x * tw}px`, top: `${rect.y * th}px`, 
    width: `${rect.w * tw}px`, height: `${rect.h * th}px` 
  };
});

const gridOverlayStyle = computed(() => {
  const w = tileWidth.value || 32;
  const h = tileHeight.value || 32;
  return {
    backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 1px, transparent 1px)`,
    backgroundSize: `${w}px ${h}px`
  };
});

// --- HELPER ---
function getGridPos(clientX, clientY) {
  if (!viewportRef.value) return { x: 0, y: 0 };
  const rect = viewportRef.value.getBoundingClientRect();
  const mouseX = clientX - rect.left;
  const mouseY = clientY - rect.top;
  const worldX = (mouseX - viewX.value) / viewScale.value;
  const worldY = (mouseY - viewY.value) / viewScale.value;
  const tw = tileWidth.value || 32;
  const th = tileHeight.value || 32;
  return { x: Math.floor(worldX / tw), y: Math.floor(worldY / th) };
}

// --- POINTER EVENTS (Pan + Marquee) ---
function onPointerDown(e) {
  viewportRef.value?.setPointerCapture(e.pointerId);
  lastPtrX.value = e.clientX; lastPtrY.value = e.clientY;
  startPtrX.value = e.clientX; startPtrY.value = e.clientY;

  const isMiddleClick = e.button === 1;
  const isLeftClick = e.button === 0;

  // Pan
  if (isMiddleClick || (isLeftClick && effectiveMode.value === 'pan')) {
    isPanning.value = true;
    e.preventDefault();
    return;
  }

  // Selection
  if (isLeftClick && effectiveMode.value === 'select') {
    isSelecting.value = true;
    hasSelection.value = true;
    const gridPos = getGridPos(e.clientX, e.clientY);
    if (gridPos.x < 0 || gridPos.y < 0) { hasSelection.value = false; isSelecting.value = false; return; }
    selectionStart.value = { ...gridPos };
    selectionEnd.value = { ...gridPos };
  }
}

function onPointerMove(e) {
  if (isPanning.value) {
    viewX.value += e.clientX - lastPtrX.value;
    viewY.value += e.clientY - lastPtrY.value;
    lastPtrX.value = e.clientX; lastPtrY.value = e.clientY;
    return;
  }
  if (isSelecting.value) {
    const gridPos = getGridPos(e.clientX, e.clientY);
    if (gridPos.x >= 0 && gridPos.y >= 0) selectionEnd.value = { ...gridPos };
  }
}

function onPointerUp(e) {
  viewportRef.value?.releasePointerCapture(e.pointerId);
  isPanning.value = false;
  if (isSelecting.value) {
    isSelecting.value = false;
    // Emit selection data here if needed
  }
}

function onPointerLeave() { isPanning.value = false; isSelecting.value = false; }

// --- KEYBOARD ---
function onGlobalKeyDown(e) {
  if (isHovering.value && e.code === 'Space') {
    e.preventDefault(); e.stopPropagation();
    isSpacePressed.value = true;
  }
}
function onGlobalKeyUp(e) { if (e.code === 'Space') isSpacePressed.value = false; }

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeyDown, { passive: false });
  window.addEventListener('keyup', onGlobalKeyUp);
});
onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeyDown);
  window.removeEventListener('keyup', onGlobalKeyUp);
});

// --- ZOOM & CONTROLS ---
function setMode(mode) { activeMode.value = mode; }
function handleWheel(e) {
  if (!viewportRef.value) return;
  const rect = viewportRef.value.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const delta = e.deltaY > 0 ? -1 : 1;
  let newScale = viewScale.value * (delta < 0 ? 0.9 : 1.1);
  newScale = Math.max(0.25, Math.min(10, newScale));
  const worldX = (mouseX - viewX.value) / viewScale.value;
  const worldY = (mouseY - viewY.value) / viewScale.value;
  viewScale.value = newScale;
  viewX.value = mouseX - (worldX * newScale);
  viewY.value = mouseY - (worldY * newScale);
}
function resetView() { viewScale.value = 1; viewX.value = 20; viewY.value = 20; }
function onImageLoad() { resetView(); }
</script>

<style scoped>
.pixel-art-layer { image-rendering: pixelated; }
.touch-none { touch-action: none; }
</style>