<template>
  <PropertySection title="Transform" :icon="BoxSelect" v-if="selectedEntity">
    
    <template #menu="{ close }">
      <div class="p-1 space-y-0.5">
        <button 
          @click="resetTransform(); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Reset Transform
        </button>
      </div>
    </template>

    <PropertyRow label="Position">
      <div class="grid grid-cols-2 gap-2">
        <BaseNumber v-model="x" prefix="X" :step="1" class="font-mono" />
        <BaseNumber v-model="y" prefix="Y" :step="1" class="font-mono" />
      </div>
    </PropertyRow>

    <div class="flex gap-3 items-start">
      <div class="flex-grow pt-[1px]">
        <PropertyRow label="Rotation">
          <BaseNumber 
            v-model="rotation" 
            prefix="R" suffix="°" :step="1" 
            class="font-mono flex-grow"
            :min="0" :max="359" :cyclic="true"
          />
        </PropertyRow>
      </div>
      
      <PivotControl 
        :x="pivotX" 
        :y="pivotY" 
        @update="updatePivot" 
      />
    </div>

    <PropertyRow label="Size (px)">
      <div class="flex items-center gap-2">
        <div class="grid grid-cols-2 gap-2 flex-grow">
          <BaseNumber v-model="width" prefix="W" :min="0" :step="1" class="font-mono" />
          <BaseNumber v-model="height" prefix="H" :min="0" :step="1" class="font-mono" />
        </div>

        <IconButton 
          :active="isRatioLocked" 
          @click="isRatioLocked = !isRatioLocked"
          :tooltip="isRatioLocked ? 'Unlock Ratio' : 'Lock Ratio'"
        >
          <Lock v-if="isRatioLocked" class="w-3.5 h-3.5" />
          <Unlock v-else class="w-3.5 h-3.5 opacity-50" />
        </IconButton>
      </div>
    </PropertyRow>

    <PropertyRow label="Flip">
      <div class="grid grid-cols-2 gap-2">
        <BaseButton 
          :active="flipX"
          @click="flipX = !flipX"
          class="h-7 text-xs gap-2" ghost
        >
          <FlipHorizontal class="w-3.5 h-3.5" /> <span>Horz</span>
        </BaseButton>

        <BaseButton 
          :active="flipY"
          @click="flipY = !flipY"
          class="h-7 text-xs gap-2" ghost
        >
          <FlipVertical class="w-3.5 h-3.5" /> <span>Vert</span>
        </BaseButton>
      </div>
    </PropertyRow>

  </PropertySection>
</template>

<script setup>
import { BoxSelect, Lock, Unlock, FlipHorizontal, FlipVertical, Trash2 } from 'lucide-vue-next'
import { useInspectorLogic } from "@/modules/properties/composables/useInspectorLogic.js";

// Components
import PropertySection from "@/modules/properties/parts/PropertySection.vue";
import PropertyRow from "@/modules/properties/parts/PropertyRow.vue";
import PivotControl from '@ui/inputs/PivotControl.vue'
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue'
import IconButton from '@/commons/components/buttons/IconButton.vue'
import BaseButton from '@/commons/components/buttons/BaseButton.vue' 

const { selectedEntity, resetTransform, updatePivot, bindComponentProp } = useInspectorLogic();

// BINDINGS (Sangat Penting: Harus individual)
const x = bindComponentProp('Transform', 'x');
const y = bindComponentProp('Transform', 'y');
const rotation = bindComponentProp('Transform', 'rotation');
const width = bindComponentProp('Transform', 'width');
const height = bindComponentProp('Transform', 'height');
const flipX = bindComponentProp('Transform', 'flipX');
const flipY = bindComponentProp('Transform', 'flipY');
const isRatioLocked = bindComponentProp('Transform', 'isRatioLocked');

// Pivot (Read-only untuk display, update via event updatePivot)
const pivotX = bindComponentProp('Transform', 'pivotX');
const pivotY = bindComponentProp('Transform', 'pivotY');
</script>