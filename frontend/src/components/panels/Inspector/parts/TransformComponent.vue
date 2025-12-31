<script setup>
import { useInspectorLogic } from "@/composables/useInspectorLogic.js";

// UI Components
import BaseInput from "@/components/ui/BaseInput.vue";
import InspectorSection from '@/components/ui/InspectorSection.vue';
import PropertyRow from '@/components/ui/PropertyRow.vue';
import IconButton from '@/components/ui/IconButton.vue';

// Destructure logic transform dari Composable
const { 
  selectedEntity,
  posX, posY, displayRotation, 
  sizeW, sizeH, isRatioLocked,
  isFlippedX, isFlippedY, toggleFlipX, toggleFlipY,
  setPivot, isActivePivot
} = useInspectorLogic();

const pivotMap = [
  { x: 0, y: 0 }, { x: 0.5, y: 0 }, { x: 1, y: 0 },
  { x: 0, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 1, y: 0.5 },
  { x: 0, y: 1 }, { x: 0.5, y: 1 }, { x: 1, y: 1 },
];
</script>

<template>
  <InspectorSection title="Transform" v-if="selectedEntity">
    <template #icon><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></template>
    
    <PropertyRow label="Position">
      <div class="grid grid-cols-2 gap-2"><BaseInput v-model="posX" prefix="X" type="number" :scrubbable="true" /><BaseInput v-model="posY" prefix="Y" type="number" :scrubbable="true" /></div>
    </PropertyRow>
    
    <div class="flex gap-4 mb-3 items-start">
        <div class="flex-grow pt-0.5"><PropertyRow label="Rotation" :no-margin="true"><BaseInput v-model="displayRotation" prefix="R" type="number" :scrubbable="true" suffix="°" /></PropertyRow></div>
        <div class="flex flex-col gap-1 items-center">
          <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pivot</span>
          <div class="w-[52px] h-[52px] grid grid-cols-3 gap-1 p-1 bg-slate-900/50 rounded-md border border-border">
            <button v-for="(p, index) in pivotMap" :key="index" @click="setPivot(p.x, p.y)" type="button" :class="['w-full h-full rounded-[2px] transition-all', isActivePivot(p.x, p.y) ? 'bg-primary scale-110' : 'bg-slate-700 hover:bg-slate-600']"></button>
          </div>
        </div>
    </div>

    <PropertyRow label="Size (px)">
      <div class="flex items-center gap-2">
        <div class="grid grid-cols-2 gap-2 flex-grow"><BaseInput v-model="sizeW" prefix="W" type="number" :scrubbable="true" /><BaseInput v-model="sizeH" prefix="H" type="number" :scrubbable="true" /></div>
        <IconButton :active="isRatioLocked" @click="isRatioLocked = !isRatioLocked" :title="isRatioLocked ? 'Unlock' : 'Lock'"><svg v-if="isRatioLocked" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg><svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="opacity-50"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg></IconButton>
      </div>
    </PropertyRow>

    <PropertyRow label="Flip">
      <div class="grid grid-cols-2 gap-2">
        <button @click="toggleFlipX" :class="['flex items-center justify-center gap-2 h-7 rounded text-xs font-medium border transition-colors', isFlippedX ? 'bg-primary text-white border-primary' : 'bg-slate-800 border-border hover:bg-slate-700 text-slate-300']"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 7 5 5-5 5V7"/><path d="m21 7-5 5 5 5V7"/><path d="M12 7v10"/></svg>Horz</button>
        <button @click="toggleFlipY" :class="['flex items-center justify-center gap-2 h-7 rounded text-xs font-medium border transition-colors', isFlippedY ? 'bg-primary text-white border-primary' : 'bg-slate-800 border-border hover:bg-slate-700 text-slate-300']"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="rotate-90"><path d="m3 7 5 5-5 5V7"/><path d="m21 7-5 5 5 5V7"/><path d="M12 7v10"/></svg>Vert</button>
      </div>
    </PropertyRow>
  </InspectorSection>
</template>