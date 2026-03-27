// UITransform
<template>
  <PropertySection title="UI Transform" :icon="LayoutTemplate" v-if="selectedEntity">
    
    <template #header-extra>
      <div 
        v-if="prefabId"
        class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border select-none shrink-0"
        :class="overridden 
          ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'"
      >
        {{ overridden ? 'Override' : 'Sync' }}
      </div>
    </template>

    <template #menu="{ close }">
      <div class="p-1 space-y-0.5 min-w-[150px]">
        
        <template v-if="prefabId">
          <button 
            @click="syncComponent(COMPONENT_NAME); close()" 
            :disabled="!overridden"
            class="menu-item"
          >
            <RefreshCw class="w-3.5 h-3.5 mr-2 opacity-70" /> 
            Sync Component
          </button>
          <div class="h-px bg-border my-1"></div>
        </template>

        <button 
          @click="handleReset(); close()" 
          class="menu-item"
        >
          <RotateCcw class="w-3.5 h-3.5 mr-2 opacity-70" /> Reset Position
        </button>
        
        <button 
          @click="centerAnchors(); close()" 
          class="menu-item"
        >
          <Crosshair class="w-3.5 h-3.5 mr-2 opacity-70" /> Center Anchors
        </button>

        <template v-if="hasChildren">
          <div class="h-px bg-border my-1"></div>
          <button 
            @click="fitToChildren(); close()" 
            class="menu-item text-blue-400 hover:text-blue-300"
          >
            <Maximize class="w-3.5 h-3.5 mr-2 opacity-70" /> Fit All Child to Me
          </button>
        </template>
      </div>
    </template>

    <div class="flex gap-3 items-start mb-2">
      <div class="flex-grow pt-[1px]">
        <PropertyRow label="Position (Offset)">
          <div class="grid grid-cols-2 gap-2">
            <BaseNumber 
              v-model="x" 
              prefix="X" 
              :step="1" 
              :precision="2"
              class="font-mono" 
              :disabled="locked" 
            />
            <BaseNumber 
              v-model="y" 
              prefix="Y" 
              :step="1" 
              :precision="2"
              class="font-mono" 
              :disabled="locked" 
            />
          </div>
        </PropertyRow>
        <div class="text-[10px] text-muted-foreground mt-1 ml-1 opacity-70 italic">
            Relative to selected anchor
        </div>
      </div>

      <AnchorControl 
        :x="anchorX" 
        :y="anchorY" 
        :disabled="locked"
        @update="updateAnchorFromControl"
      />
    </div>

    <div 
      class="transition-all duration-300"
      :class="{ 
        'opacity-40 pointer-events-none filter grayscale cursor-not-allowed': isSizeLockedByText || isSizeLockedByTilemap 
      }"
    >
      <PropertyRow label="Size (px)">
        <div class="flex items-center gap-2">
          <div class="grid grid-cols-2 gap-2 flex-grow">
            <BaseNumber v-model="width" prefix="W" :min="1" :step="1" :precision="2" class="font-mono" :disabled="locked" />
            <BaseNumber v-model="height" prefix="H" :min="1" :step="1" :precision="2" class="font-mono" :disabled="locked" />
          </div>

          <IconButton 
            :active="isRatioLocked" 
            @click="isRatioLocked = !isRatioLocked"
            :tooltip="isRatioLocked ? 'Unlock Ratio' : 'Lock Ratio'"
            :disabled="locked"
          >
            <Lock v-if="isRatioLocked" class="w-3.5 h-3.5" />
            <Unlock v-else class="w-3.5 h-3.5 opacity-50" />
          </IconButton>
        </div>
      </PropertyRow>
    </div>

    <div v-if="isSizeLockedByText" class="px-1 mb-3 -mt-1">
      <div class="text-[9px] text-amber-500/80 italic flex items-center gap-1">
        <Info class="w-3 h-3" /> Size is controlled by Text Renderer Auto Fit
      </div>
    </div>

    <div v-if="isSizeLockedByTilemap" class="px-1 mb-3 -mt-1">
      <div class="text-[9px] text-amber-500/80 italic flex items-center gap-1">
        <Info class="w-3 h-3" /> Size is controlled by Tilemap Auto Fit
      </div>
    </div>

    <div class="flex gap-3 items-start">
      <div class="flex-grow pt-[1px]">
        <PropertyRow label="Rotation">
          <BaseNumber 
            v-model="rotation" 
            prefix="R" suffix="°" :step="1" :precision="2"
            class="font-mono flex-grow"
            :min="0" :max="359" :cyclic="true"
            :disabled="locked" 
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

    <div>
      <PropertyRow label="Scale">
        <div class="flex items-center gap-2">
          <div class="grid grid-cols-2 gap-2 flex-grow">
            <BaseNumber v-model="scaleX" prefix="X" :min="1" :step="1" :precision="0" class="font-mono" :disabled="locked" />
            <BaseNumber v-model="scaleY" prefix="Y" :min="1" :step="1" :precision="0" class="font-mono" :disabled="locked" />
          </div>

          <IconButton 
            :active="isScaleLocked" 
            @click="isScaleLocked = !isScaleLocked"
            :tooltip="isScaleLocked ? 'Unlock Scale' : 'Lock Scale Uniformly'"
            :disabled="locked"
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
        >
          <FlipHorizontal class="w-3.5 h-3.5" /> <span>Horz</span>
        </BaseButton>

        <BaseButton 
          :active="flipY"
          @click="flipY = !flipY"
          class="h-7 text-xs gap-2" ghost
          :disabled="locked"
        >
          <FlipVertical class="w-3.5 h-3.5" /> <span>Vert</span>
        </BaseButton>
      </div>
    </PropertyRow>

  </PropertySection>
</template>

<script setup>
import { 
  LayoutTemplate, Lock, Unlock, RotateCcw, Crosshair, RefreshCw,
  Info, Link, Maximize, FlipHorizontal, FlipVertical // Tambahan ikon
} from 'lucide-vue-next'
import { useInspectorLogic } from "@editors/properties/composables/useInspectorLogic.js";

import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue'
import IconButton from '@/commons/components/buttons/IconButton.vue'
import BaseButton from '@/commons/components/buttons/BaseButton.vue' // Tambahan BaseButton

import PivotControl from '@ui/inputs/PivotControl.vue'
import AnchorControl from '@ui/inputs/AnchorControl.vue'

const COMPONENT_NAME = 'UITransform';

const { 
  selectedEntity, 
  updatePivot, 
  bindComponentProp, 
  locked,
  prefabId,                   
  syncComponent,             
  getComponentOverrideStatus,
  markAsOverridden,
  
  // Tambahan state dari useInspectorLogic untuk sinkronisasi fitur baru
  isSizeLockedByText,
  isSizeLockedByTilemap,
  globalScaleX,
  globalScaleY,
  globalRotation,
  hasChildren,
  fitToChildren 
} = useInspectorLogic();

const overridden = getComponentOverrideStatus(COMPONENT_NAME);

// Binding bawaan
const x = bindComponentProp(COMPONENT_NAME, 'x', 2);
const y = bindComponentProp(COMPONENT_NAME, 'y', 2);
const width = bindComponentProp(COMPONENT_NAME, 'width', 2);
const height = bindComponentProp(COMPONENT_NAME, 'height', 2);
const rotation = bindComponentProp(COMPONENT_NAME, 'rotation', 2);
const isRatioLocked = bindComponentProp(COMPONENT_NAME, 'isRatioLocked'); 

// Binding Anchor & Pivot
const anchorX = bindComponentProp(COMPONENT_NAME, 'anchorX');
const anchorY = bindComponentProp(COMPONENT_NAME, 'anchorY');
const pivotX = bindComponentProp(COMPONENT_NAME, 'pivotX');
const pivotY = bindComponentProp(COMPONENT_NAME, 'pivotY');

// Binding baru hasil adaptasi dari Transform World
const flipX = bindComponentProp(COMPONENT_NAME, 'flipX');
const flipY = bindComponentProp(COMPONENT_NAME, 'flipY');
const scaleX = bindComponentProp(COMPONENT_NAME, 'scaleX');
const scaleY = bindComponentProp(COMPONENT_NAME, 'scaleY');
const isScaleLocked = bindComponentProp(COMPONENT_NAME, 'isScaleLocked');

const updateAnchorFromControl = ({ x, y }) => {
  anchorX.value = x;
  anchorY.value = y;
};

const handleReset = () => {
  x.value = 0;
  y.value = 0;
  rotation.value = 0;
  // Opsional: Anda juga bisa me-reset scale ke 1 dan flip ke false di sini jika diperlukan
};

const centerAnchors = () => {
  anchorX.value = 0.5;
  anchorY.value = 0.5;
  x.value = 0;
  y.value = 0;
};
</script>

<style scoped>
.menu-item {
  @apply relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>