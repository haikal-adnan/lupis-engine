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
        <img v-if="currentTextureUrl" :src="currentTextureUrl" class="block max-w-none select-none pointer-events-none" @load="resetView" />
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
import { Grid, Hand, MousePointer2 } from 'lucide-vue-next';
import { useTilemapLogic } from '@/modules/tilemap/composables/useTilemapLogic.js';
import { useTilemapNavigation } from '@/modules/tilemap/composables/useTilemapNavigation.js'; // Import Composable Baru
import { useEditorStore } from '@/stores/useEditorStore.js';

// Components
import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseButton from "@/commons/components/buttons/BaseButton.vue";
import IconButton from '@/commons/components/buttons/IconButton.vue';

const { currentTextureUrl, tileWidth, tileHeight } = useTilemapLogic();
const editorStore = useEditorStore();

// --- GUNAKAN COMPOSABLE NAVIGATION ---
const { 
  viewportRef, viewScale, isPanning, containerStyle,
  resetView, handleWheel, getGridPos, startPan, updatePan, endPan
} = useTilemapNavigation();

// --- UI STATE LOCAL ---
const activeMode = ref('select');
const isSpacePressed = ref(false);
const isHovering = ref(false);

// Selection State
const isSelecting = ref(false);
const selectionStart = ref({ x: 0, y: 0 });
const selectionEnd = ref({ x: 0, y: 0 });
const hasSelection = ref(false);

// --- COMPUTED ---
const effectiveMode = computed(() => isSpacePressed.value ? 'pan' : activeMode.value);

const cursorClass = computed(() => {
  if (isPanning.value) return 'cursor-grabbing';
  if (effectiveMode.value === 'pan') return 'cursor-grab';
  return 'default'; 
});

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

// --- POINTER EVENTS ---

function onPointerDown(e) {
  viewportRef.value?.setPointerCapture(e.pointerId);

  const isMiddleClick = e.button === 1;
  const isLeftClick = e.button === 0;

  // 1. Pan Logic (Delegasi ke Composable)
  if (isMiddleClick || (isLeftClick && effectiveMode.value === 'pan')) {
    startPan(e.clientX, e.clientY);
    e.preventDefault();
    return;
  }

  // 2. Selection Logic (Lokal Component)
  if (isLeftClick && effectiveMode.value === 'select') {
    isSelecting.value = true;
    hasSelection.value = true;
    const gridPos = getGridPos(e.clientX, e.clientY, tileWidth.value, tileHeight.value);
    
    // Bounds check sederhana (asumsi 0,0 adalah top left)
    if (gridPos.x < 0 || gridPos.y < 0) { 
      hasSelection.value = false; 
      isSelecting.value = false; 
      return; 
    }
    
    selectionStart.value = { ...gridPos };
    selectionEnd.value = { ...gridPos };
  }
}

function onPointerMove(e) {
  // Update Pan
  if (isPanning.value) {
    updatePan(e.clientX, e.clientY);
    return;
  }
  
  // Update Selection
  if (isSelecting.value) {
    const gridPos = getGridPos(e.clientX, e.clientY, tileWidth.value, tileHeight.value);
    if (gridPos.x >= 0 && gridPos.y >= 0) {
       selectionEnd.value = { ...gridPos };
    }
  }
}

function onPointerUp(e) {
  viewportRef.value?.releasePointerCapture(e.pointerId);
  
  // Stop Pan
  endPan();
  
  // Finish Selection
  if (isSelecting.value) {
    isSelecting.value = false;
    
    const rect = selectionRect.value;
    if (rect.w > 0 && rect.h > 0) {
        editorStore.setTileSelection(rect);
        editorStore.setTool('brush'); 
    }
  }
}

function onPointerLeave() {
  endPan();
  isSelecting.value = false;
}

// --- SHORTCUTS ---
function onGlobalKeyDown(e) {
  if (isHovering.value && e.code === 'Space') {
    e.preventDefault(); e.stopPropagation();
    isSpacePressed.value = true;
  }
}
function onGlobalKeyUp(e) { 
  if (e.code === 'Space') isSpacePressed.value = false; 
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeyDown, { passive: false });
  window.addEventListener('keyup', onGlobalKeyUp);
});
onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeyDown);
  window.removeEventListener('keyup', onGlobalKeyUp);
});

function setMode(mode) { activeMode.value = mode; }
</script>

<style scoped>
.pixel-art-layer { image-rendering: pixelated; }
.touch-none { touch-action: none; }
</style>