<template>
  <PropertySection title="Transform" :icon="BoxSelect" v-if="selectedEntity">
    
    <template #header-extra>
      <div 
        v-if="prefabId"
        class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border select-none shrink-0"
        :class="isOverridden 
          ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'"
      >
        {{ isOverridden ? 'Override' : 'Sync' }}
      </div>
    </template>

    <template #menu="{ close }">
      <div class="p-1 space-y-0.5 min-w-[150px]">
        <template v-if="prefabId">
          <button 
            @click="syncComponent('Transform'); close()" 
            :disabled="!isOverridden"
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
      </div>
    </template>

    <PropertyRow label="Position">
      <div class="grid grid-cols-2 gap-2">
        <BaseNumber v-model="x" prefix="X" :step="1" :precision="2" class="font-mono" :disabled="isLocked" />
        <BaseNumber v-model="y" prefix="Y" :step="1" :precision="2" class="font-mono" :disabled="isLocked" />
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
            :disabled="isLocked" 
          />
        </PropertyRow>
      </div>
      
      <PivotControl 
        :x="pivotX" 
        :y="pivotY" 
        :disabled="isLocked"
        @update="updatePivot" 
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
            <BaseNumber v-model="width" prefix="W" :min="1" :step="1" :precision="2" class="font-mono" :disabled="isLocked" />
            <BaseNumber v-model="height" prefix="H" :min="1" :step="1" :precision="2" class="font-mono" :disabled="isLocked" />
          </div>

          <IconButton 
            :active="isRatioLocked" 
            @click="isRatioLocked = !isRatioLocked"
            :tooltip="isRatioLocked ? 'Unlock Ratio' : 'Lock Ratio'"
            :disabled="isLocked"
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

    <PropertyRow label="Flip">
      <div class="grid grid-cols-2 gap-2">
        <BaseButton 
          :active="flipX"
          @click="flipX = !flipX"
          class="h-7 text-xs gap-2" ghost
          :disabled="isLocked"
        >
          <FlipHorizontal class="w-3.5 h-3.5" /> <span>Horz</span>
        </BaseButton>

        <BaseButton 
          :active="flipY"
          @click="flipY = !flipY"
          class="h-7 text-xs gap-2" ghost
          :disabled="isLocked"
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
  RotateCcw, RefreshCw, Info 
} from 'lucide-vue-next'

import { useInspectorLogic } from "@editors/properties/composables/useInspectorLogic.js";

import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import PivotControl from '@ui/inputs/PivotControl.vue'
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue'
import IconButton from '@/commons/components/buttons/IconButton.vue'
import BaseButton from '@/commons/components/buttons/BaseButton.vue' 

const { 
  selectedEntity, 
  prefabId,          
  resetTransform, 
  updatePivot, 
  bindComponentProp, 
  isLocked,
  isSizeLockedByText,
  isSizeLockedByTilemap, 
  syncComponent,       
  getComponentOverrideStatus 
} = useInspectorLogic();

const isOverridden = getComponentOverrideStatus('Transform');

const x = bindComponentProp('Transform', 'x', 2);
const y = bindComponentProp('Transform', 'y', 2);
const rotation = bindComponentProp('Transform', 'rotation', 2);
const width = bindComponentProp('Transform', 'width', 2);
const height = bindComponentProp('Transform', 'height', 2);

const flipX = bindComponentProp('Transform', 'flipX');
const flipY = bindComponentProp('Transform', 'flipY');
const isRatioLocked = bindComponentProp('Transform', 'isRatioLocked');

const pivotX = bindComponentProp('Transform', 'pivotX');
const pivotY = bindComponentProp('Transform', 'pivotY');
</script>