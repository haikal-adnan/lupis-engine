<template>
  <PropertySection title="Transform" :icon="BoxSelect">
    
    <template #menu="{ close }">
      <div class="p-1 space-y-0.5">
        <button 
          @click="resetTransform(); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Reset Transform
        </button>

        <div class="h-px bg-border my-1" />

        <button @click="close" class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors">
          Move Up
        </button>
        <button @click="close" class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors">
          Move Down
        </button>
        <button @click="close" class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors">
          Copy Values
        </button>
        <button @click="close" class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors">
          Paste Values
        </button>

        <div class="h-px bg-border my-1" />
        
        <button @click="close" class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors">
          <Trash2 class="w-3 h-3 mr-2" />
          Remove Component
        </button>
      </div>
    </template>

    <PropertyRow label="Position">
      <div class="grid grid-cols-2 gap-2">
        <BaseNumber 
          v-model="localTransform.x" 
          prefix="X" 
          :step="1"
          class="font-mono"
        />
        <BaseNumber 
          v-model="localTransform.y" 
          prefix="Y" 
          :step="1"
          class="font-mono"
        />
      </div>
    </PropertyRow>

    <div class="flex gap-3 items-start">
      <div class="flex-grow pt-[1px]">
        <PropertyRow label="Rotation">
          <BaseNumber 
            v-model="localTransform.rotation" 
            prefix="R" 
            suffix="°" 
            :step="1"
            class="font-mono"
          />
        </PropertyRow>
      </div>
      
      <PivotControl 
        :x="localTransform.pivotX" 
        :y="localTransform.pivotY" 
        @update="updatePivot" 
      />
    </div>

    <PropertyRow label="Size (px)">
      <div class="flex items-center gap-2">
        <div class="grid grid-cols-2 gap-2 flex-grow">
          <BaseNumber 
            v-model="localTransform.width" 
            prefix="W" 
            :min="0"
            :step="1"
            class="font-mono"
          />
          <BaseNumber 
            v-model="localTransform.height" 
            prefix="H" 
            :min="0"
            :step="1"
            class="font-mono"
          />
        </div>

        <IconButton 
          :active="localTransform.isRatioLocked" 
          @click="localTransform.isRatioLocked = !localTransform.isRatioLocked"
          :tooltip="localTransform.isRatioLocked ? 'Unlock Ratio' : 'Lock Ratio'"
        >
          <Lock v-if="localTransform.isRatioLocked" class="w-3.5 h-3.5" />
          <Unlock v-else class="w-3.5 h-3.5 opacity-50" />
        </IconButton>
      </div>
    </PropertyRow>

    <PropertyRow label="Flip">
      <div class="grid grid-cols-2 gap-2">
        <BaseButton 
          :active="localTransform.flipX"
          @click="localTransform.flipX = !localTransform.flipX"
          class="h-7 text-xs gap-2"
          ghost
        >
          <FlipHorizontal class="w-3.5 h-3.5" />
          <span>Horz</span>
        </BaseButton>

        <BaseButton 
          :active="localTransform.flipY"
          @click="localTransform.flipY = !localTransform.flipY"
          class="h-7 text-xs gap-2"
          ghost
        >
          <FlipVertical class="w-3.5 h-3.5" />
          <span>Vert</span>
        </BaseButton>
      </div>
    </PropertyRow>

  </PropertySection>
</template>

<script setup>
import { reactive } from 'vue'
import { BoxSelect, Lock, Unlock, FlipHorizontal, FlipVertical, Trash2 } from 'lucide-vue-next'

// Parts & Atomic
import PropertySection from "@/modules/properties/parts/PropertySection.vue";
import PropertyRow from "@/modules/properties/parts/PropertyRow.vue";
import PivotControl from '@ui/inputs/PivotControl.vue'

import BaseNumber from '@/commons/components/inputs/BaseNumber.vue'
import IconButton from '@/commons/components/buttons/IconButton.vue'
import BaseButton from '@/commons/components/buttons/BaseButton.vue' 

// Mock Logic
const localTransform = reactive({
  x: 0,
  y: 0,
  rotation: 0,
  width: 800,
  height: 600,
  pivotX: 0.5,
  pivotY: 0.5,
  isRatioLocked: false,
  flipX: false,
  flipY: false
})

function updatePivot({ x, y }) {
  localTransform.pivotX = x
  localTransform.pivotY = y
}

function resetTransform() {
  localTransform.x = 0
  localTransform.y = 0
  localTransform.rotation = 0
  localTransform.width = 100
  localTransform.height = 100
  localTransform.flipX = false
  localTransform.flipY = false
  // Reset pivot to center
  localTransform.pivotX = 0.5
  localTransform.pivotY = 0.5
}
</script>