<template>
  <PropertySection title="Transform" :icon="BoxSelect" v-if="selectedEntity" data-testid="editor-transform-section">
    
    <template #header-extra>
      <div 
        v-if="prefabId"
        class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border select-none shrink-0"
        :class="overridden 
          ? 'text-amber-500 border-amber-500' 
          : 'text-emerald-500 border-emerald-500'"
      >
        {{ overridden ? 'Override' : 'Sync' }}
      </div>
    </template>

    <template #menu="{ close }">
      <div class="p-1 space-y-0.5 min-w-[150px]">
        <template v-if="prefabId">
          <button 
            @click="syncComponent('Transform'); close()" 
            :disabled="!overridden"
            class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw class="w-3.5 h-3.5 mr-2 opacity-70" /> Sync Transform
          </button>
          <div class="h-px bg-border my-1"></div>
        </template>

        <button 
          @click="resetTransform(); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <RotateCcw class="w-3.5 h-3.5 mr-2 opacity-70" /> Reset Values
        </button>

        <template v-if="hasChildren">
          <div class="h-px bg-border my-1"></div>
          <button 
            @click="fitToChildren(); close()" 
            class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <Maximize class="w-3.5 h-3.5 mr-2 opacity-70" /> Fit All Child to Me
          </button>
        </template>
      </div>
    </template>

    <PropertyRow label="Position">
      <div class="grid grid-cols-2 gap-2">
        <BaseNumber 
          v-model="x" 
          prefix="X" 
          :step="1" 
          :precision="2" 
          class="font-mono" 
          :disabled="locked" 
          data-testid="transform-pos-x"
        />
        <BaseNumber 
          v-model="y" 
          prefix="Y" 
          :step="1" 
          :precision="2" 
          class="font-mono" 
          :disabled="locked" 
          data-testid="transform-pos-y"
        />
      </div>
    </PropertyRow>

    <div class="flex gap-3 items-start">
      <div class="flex-grow pt-[1px]">
        <PropertyRow label="Rotation">
          <BaseNumber 
            v-model="rotation" 
            prefix="R" suffix="°" :step="1" :precision="2"
            class="font-mono flex-grow"
            :min="0" :max="359" :cyclic="true"
            :disabled="locked" 
            data-testid="transform-rotation"
          />
        </PropertyRow>
        
        <div v-if="globalRotation !== null" class="px-1 mt-1 mb-2">
          <div class="text-[10px] text-amber-500/90 italic flex items-center gap-1">
            <Link class="w-3 h-3" /> World Rot: {{ globalRotation }}°
          </div>
        </div>
      </div>
      
      <PivotControl 
        :x="pivotX" 
        :y="pivotY" 
        :disabled="locked"
        @update="updatePivot" 
      />
    </div>

    <div 
      class="transition-all duration-300"
      :class="{ 
        'opacity-40 pointer-events-none filter grayscale cursor-not-allowed': isSizeLockedByTilemap 
      }"
    >
      <PropertyRow label="Size (px)">
        <div class="flex items-center gap-2">
          <div class="grid grid-cols-2 gap-2 flex-grow">
            <BaseNumber 
              v-model="width" 
              prefix="W" 
              :min="1" 
              :step="1" 
              :precision="2" 
              class="font-mono" 
              :disabled="locked || isSizeLockedByTilemap" 
              data-testid="transform-size-w"
            />
            <BaseNumber 
              v-model="height" 
              prefix="H" 
              :min="1" 
              :step="1" 
              :precision="2" 
              class="font-mono" 
              :disabled="locked || isSizeLockedByText || isSizeLockedByTilemap" 
              data-testid="transform-size-h"
            />
          </div>

          <IconButton 
            :active="isRatioLocked" 
            @click="isRatioLocked = !isRatioLocked"
            :tooltip="isRatioLocked ? 'Unlock Ratio' : 'Lock Ratio'"
            :disabled="locked || isSizeLockedByText || isSizeLockedByTilemap"
            data-testid="transform-ratio-lock-toggle"
            :data-locked="isRatioLocked"
          >
            <Lock v-if="isRatioLocked" class="w-3.5 h-3.5" />
            <Unlock v-else class="w-3.5 h-3.5 opacity-50" />
          </IconButton>
        </div>
      </PropertyRow>
    </div>

    <div v-if="isSizeLockedByText" class="px-1 mb-3 -mt-1">
      <div class="text-[9px] text-amber-500/80 italic flex items-center gap-1">
        <Info class="w-3 h-3" /> Height is controlled by Text Renderer
      </div>
    </div>

    <div v-if="isSizeLockedByTilemap" class="px-1 mb-3 -mt-1">
      <div class="text-[9px] text-amber-500/80 italic flex items-center gap-1">
        <Info class="w-3 h-3" /> Size is controlled by Tilemap Auto Fit
      </div>
    </div>

    <div>
      <PropertyRow label="Scale">
        <div class="flex items-center gap-2">
          <div class="grid grid-cols-2 gap-2 flex-grow">
            <BaseNumber 
              v-model="scaleX" 
              prefix="X" 
              :min="1" 
              :step="1" 
              :precision="0" 
              class="font-mono" 
              :disabled="locked" 
              data-testid="transform-scale-x"
            />
            <BaseNumber 
              v-model="scaleY" 
              prefix="Y" 
              :min="1" 
              :step="1" 
              :precision="0" 
              class="font-mono" 
              :disabled="locked" 
              data-testid="transform-scale-y"
            />
          </div>

          <IconButton 
            :active="isScaleLocked" 
            @click="isScaleLocked = !isScaleLocked"
            :tooltip="isScaleLocked ? 'Unlock Scale' : 'Lock Scale Uniformly'"
            :disabled="locked"
            data-testid="transform-scale-lock-toggle"
            :data-locked="isScaleLocked"
          >
            <Lock v-if="isScaleLocked" class="w-3.5 h-3.5" />
            <Unlock v-else class="w-3.5 h-3.5 opacity-50" />
          </IconButton>
        </div>
      </PropertyRow>
      
      <div v-if="globalScaleX !== null" class="px-1 mt-1 mb-3">
        <div class="text-[10px] text-amber-500/90 italic flex items-center gap-1">
          <Link class="w-3 h-3" /> World Scale: {{ globalScaleX }} x {{ globalScaleY }}
        </div>
      </div>
    </div>

    <PropertyRow label="Flip">
      <div class="grid grid-cols-2 gap-2">
        <BaseButton 
          :active="flipX"
          @click="flipX = !flipX"
          class="h-7 text-xs gap-2" ghost
          :disabled="locked"
          data-testid="transform-flip-x"
          :data-active="flipX"
        >
          <FlipHorizontal class="w-3.5 h-3.5" /> <span>Horz</span>
        </BaseButton>

        <BaseButton 
          :active="flipY"
          @click="flipY = !flipY"
          class="h-7 text-xs gap-2" ghost
          :disabled="locked"
          data-testid="transform-flip-y"
          :data-active="flipY"
        >
          <FlipVertical class="w-3.5 h-3.5" /> <span>Vert</span>
        </BaseButton>
      </div>
    </PropertyRow>

  </PropertySection>
</template>

<script setup>
import { 
  BoxSelect, Lock, Unlock, FlipHorizontal, FlipVertical, 
  RotateCcw, RefreshCw, Info, Link, Maximize
} from 'lucide-vue-next'

import { 
  useInspectorSelection, 
  useInspectorPrefab, 
  useInspectorTransform, 
  useInspectorBinding 
} from "@inspectors/inspectors.js";

import {
  PropertySection,
  PropertyRow,
  BaseNumber,
  BaseButton,
  IconButton,
  PivotControl
} from '@components/components.js';

// 1. Selection State
const { selectedEntity, isEditingMasterPrefab, locked } = useInspectorSelection();

// 2. Prefab Operations
const { 
  prefabId, 
  getComponentOverrideStatus, 
  syncComponent,
  markAsOverridden
} = useInspectorPrefab(selectedEntity, isEditingMasterPrefab);

// 3. Transform Calculations & Actions
const { 
  resetTransform, 
  updatePivot, 
  isSizeLockedByText, 
  isSizeLockedByTilemap, 
  globalScaleX, 
  globalScaleY, 
  globalRotation, 
  hasChildren, 
  fitToChildren 
} = useInspectorTransform(selectedEntity, isEditingMasterPrefab);

// 4. Property Bindings
const { bindComponentProp } = useInspectorBinding(
  selectedEntity, 
  isEditingMasterPrefab, 
  prefabId, 
  markAsOverridden
);

// --- Logic Komponen ---
const overridden = getComponentOverrideStatus('Transform');

const x = bindComponentProp('Transform', 'x', 2);
const y = bindComponentProp('Transform', 'y', 2);
const rotation = bindComponentProp('Transform', 'rotation', 2);
const width = bindComponentProp('Transform', 'width', 2);
const height = bindComponentProp('Transform', 'height', 2);

const flipX = bindComponentProp('Transform', 'flipX');
const flipY = bindComponentProp('Transform', 'flipY');
const isRatioLocked = bindComponentProp('Transform', 'isRatioLocked');
const scaleX = bindComponentProp('Transform', 'scaleX');
const scaleY = bindComponentProp('Transform', 'scaleY');
const isScaleLocked = bindComponentProp('Transform', 'isScaleLocked');
const pivotX = bindComponentProp('Transform', 'pivotX');
const pivotY = bindComponentProp('Transform', 'pivotY');
</script>