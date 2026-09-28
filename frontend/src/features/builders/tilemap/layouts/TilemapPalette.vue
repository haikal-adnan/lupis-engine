<template>
  <PropertySection title="Tile Palette" :icon="Grid" :showMenu="false">
    
    <div class="flex gap-1 p-1 border-b border-border bg-muted/10">
      <IconButton 
        :active="effectiveMode === 'select'" 
        tooltip="Select Tile (V)"
        @click="setPaletteMode('select')"
      >
        <MousePointer2 class="w-4 h-4" />
      </IconButton>

      <IconButton 
        :active="effectiveMode === 'pan'" 
        tooltip="Pan View (Space)"
        @click="setPaletteMode('pan')"
      >
        <Hand class="w-4 h-4" />
      </IconButton>
    </div>

    <div 
      ref="viewportRef"
      class="relative w-full aspect-square bg-muted/20 border-b border-border overflow-hidden outline-none touch-none"
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
        <img 
          v-if="currentTextureUrl" 
          :src="currentTextureUrl" 
          class="block max-w-none select-none pointer-events-none" 
          @load="resetView" 
        />
        <div v-else class="flex items-center justify-center w-full h-full text-xs text-muted-foreground">
          No Texture Selected
        </div>

        <div 
          v-if="hasSelection"
          class="absolute border-2 border-blue-500 bg-blue-500/20 z-10 pointer-events-none transition-all duration-75"
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
import { Grid, Hand, MousePointer2 } from 'lucide-vue-next';
import { useTilemapLogic } from '@builders/builders.js';
import { PropertySection, PropertyRow, BaseButton, IconButton } from '@components/components.js';

const { 
  currentTextureUrl, viewportRef, viewScale, containerStyle,
  cursorClass, effectiveMode, hasSelection, selectionRect, selectionStyle, gridOverlayStyle,
  isHovering, resetView, handleWheel, setPaletteMode,
  onPointerDown, onPointerMove, onPointerUp, onPointerLeave 
} = useTilemapLogic();
</script>

<style scoped>
.pixel-art-layer { image-rendering: pixelated; }
.touch-none { touch-action: none; }
</style>