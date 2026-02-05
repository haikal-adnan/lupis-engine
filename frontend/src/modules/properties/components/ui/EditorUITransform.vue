<template>
  <PropertySection title="UI Transform" :icon="LayoutTemplate" v-if="selectedEntity">
    
    <template #menu="{ close }">
      <div class="p-1 space-y-0.5 min-w-[140px]">
        <button 
          @click="handleReset(); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <RotateCcw class="w-3.5 h-3.5 mr-2 opacity-70" /> Reset Position
        </button>
        <div class="h-px bg-border my-1"></div>
        <button 
          @click="centerAnchors(); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Crosshair class="w-3.5 h-3.5 mr-2 opacity-70" /> Center Anchors
        </button>
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
              :disabled="isLocked" 
            />
            <BaseNumber 
              v-model="y" 
              prefix="Y" 
              :step="1" 
              :precision="2"
              class="font-mono" 
              :disabled="isLocked" 
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
        :disabled="isLocked"
        @update="updateAnchorFromControl"
      />
    </div>

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

  </PropertySection>
</template>

<script setup>
import { LayoutTemplate, Lock, Unlock, RotateCcw, Crosshair } from 'lucide-vue-next'
import { useInspectorLogic } from "@/modules/properties/composables/useInspectorLogic.js";

// Components
import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue'
import IconButton from '@/commons/components/buttons/IconButton.vue'

// Custom Controls
import PivotControl from '@ui/inputs/PivotControl.vue'
import AnchorControl from '@ui/inputs/AnchorControl.vue'

const COMPONENT_NAME = 'UITransform';

const { 
  selectedEntity, 
  updatePivot, 
  bindComponentProp, 
  isLocked 
} = useInspectorLogic();

// --- BINDINGS (Pass precision: 2) ---
// Memastikan data yang dibaca dan ditulis melalui store juga dibulatkan
const x = bindComponentProp(COMPONENT_NAME, 'x', 2);
const y = bindComponentProp(COMPONENT_NAME, 'y', 2);
const width = bindComponentProp(COMPONENT_NAME, 'width', 2);
const height = bindComponentProp(COMPONENT_NAME, 'height', 2);
const rotation = bindComponentProp(COMPONENT_NAME, 'rotation', 2);

const isRatioLocked = bindComponentProp(COMPONENT_NAME, 'isRatioLocked'); 

// Anchor & Pivot (Read Only / Control managed)
const anchorX = bindComponentProp(COMPONENT_NAME, 'anchorX');
const anchorY = bindComponentProp(COMPONENT_NAME, 'anchorY');
const pivotX = bindComponentProp(COMPONENT_NAME, 'pivotX');
const pivotY = bindComponentProp(COMPONENT_NAME, 'pivotY');

// --- ACTIONS ---

const updateAnchorFromControl = ({ x, y }) => {
  anchorX.value = x;
  anchorY.value = y;
};

const handleReset = () => {
  x.value = 0;
  y.value = 0;
  rotation.value = 0;
};

const centerAnchors = () => {
  anchorX.value = 0.5;
  anchorY.value = 0.5;
  x.value = 0;
  y.value = 0;
};
</script>