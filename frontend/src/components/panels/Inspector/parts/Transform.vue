<template>
  <InspectorSection title="Transform" v-if="selectedEntity">
    <template #icon>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="15 19 12 22 9 19"></polyline><polyline points="19 9 22 12 19 15"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>
    </template>

    <PropertyRow label="Position">
      <div class="grid grid-cols-2 gap-2 relative group">
        <BaseInput v-model="selectedEntity.x" prefix="X" type="number" :scrubbable="true" />
        <BaseInput v-model="selectedEntity.y" prefix="Y" type="number" :scrubbable="true" />
      </div>
    </PropertyRow>

    <div class="flex gap-4 mb-3 items-start">
       <div class="flex-grow pt-0.5">
          <PropertyRow label="Rotation" :no-margin="true">
            <BaseInput v-model="selectedEntity.rotation" prefix="R" type="number" :scrubbable="true" suffix="°" />
          </PropertyRow>
       </div>
       
       <div class="flex flex-col gap-1">
         <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Pivot</span>
         <div class="w-[52px] h-[52px] grid grid-cols-3 gap-1 p-1 bg-slate-900/50 rounded-md border border-border" title="Set Pivot Point">
            <button 
                v-for="(p, index) in pivotMap" :key="index" 
                @click="setPivot(p.x, p.y)"
                type="button"
                :class="[
                   'w-full h-full rounded-[2px] transition-all duration-150',
                   isActivePivot(p.x, p.y) 
                     ? 'bg-primary shadow-[0_0_4px_rgba(var(--primary),0.5)] scale-110' 
                     : 'bg-slate-700 hover:bg-slate-600'
                 ]">
            </button>
         </div>
       </div>
    </div>

    <PropertyRow label="Size (px)">
      <div class="flex items-center gap-2 relative group">
        <div class="grid grid-cols-2 gap-2 flex-grow">
          <BaseInput 
            v-model="displayW" 
            prefix="W" type="number" :scrubbable="true" 
          />
          <BaseInput 
            v-model="displayH" 
            prefix="H" type="number" :scrubbable="true" 
          />
        </div>
        
        <IconButton 
          :active="isRatioLocked" 
          @click="isRatioLocked = !isRatioLocked"
          :title="isRatioLocked ? 'Unlock Aspect Ratio' : 'Lock Aspect Ratio'"
        >
           <svg v-if="isRatioLocked" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
           <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
        </IconButton>
      </div>
    </PropertyRow>

  </InspectorSection>
</template>

<script setup>
import { ref, computed } from "vue";
import { useSelection } from "@/composables/useSelection.js";
import BaseInput from "@/components/ui/BaseInput.vue";
import InspectorSection from '@/components/ui/InspectorSection.vue';
import PropertyRow from '@/components/ui/PropertyRow.vue';
import IconButton from '@/components/ui/IconButton.vue';

const { selectedEntity } = useSelection();
const isRatioLocked = ref(true); 

// --- 1. PIXEL SIZE LOGIC (Fix Width/Height mismatch) ---
const displayW = computed({
  get: () => {
    if (!selectedEntity.value) return 0;
    // Tampilkan: Original Width * ScaleX (dibulatkan biar rapi)
    return Math.round((selectedEntity.value.width || 0) * (selectedEntity.value.scaleX || 1) * 100) / 100;
  },
  set: (val) => {
    if (!selectedEntity.value) return;
    const originalW = selectedEntity.value.width || 1; // Cegah bagi nol
    const newScaleX = val / originalW;
    
    selectedEntity.value.scaleX = newScaleX;

    if (isRatioLocked.value) {
      // Maintain Aspect Ratio logic
      const ratio = (selectedEntity.value.scaleY || 1) / (selectedEntity.value.scaleX || 1); // Old Ratio
      // Simplifikasi: Uniform Scale
      selectedEntity.value.scaleY = newScaleX; 
    }
  }
});

const displayH = computed({
  get: () => {
    if (!selectedEntity.value) return 0;
    return Math.round((selectedEntity.value.height || 0) * (selectedEntity.value.scaleY || 1) * 100) / 100;
  },
  set: (val) => {
    if (!selectedEntity.value) return;
    const originalH = selectedEntity.value.height || 1;
    const newScaleY = val / originalH;
    
    selectedEntity.value.scaleY = newScaleY;

    if (isRatioLocked.value) {
      selectedEntity.value.scaleX = newScaleY;
    }
  }
});

// --- 2. PIVOT LOGIC (Bigger UI) ---
const pivotMap = [
  { x: 0, y: 0 },   { x: 0.5, y: 0 },   { x: 1, y: 0 },
  { x: 0, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 1, y: 0.5 },
  { x: 0, y: 1 },   { x: 0.5, y: 1 },   { x: 1, y: 1 },
];

const setPivot = (x, y) => {
  if (!selectedEntity.value) return;
  // Pastikan properti ini ada di Engine Object Anda
  selectedEntity.value.anchorX = x;
  selectedEntity.value.anchorY = y;
  
  // Tips: Jika Pivot tidak berubah di engine,
  // Pastikan Anda memicu re-render di Engine atau kirim event bus:
  // bus.emit('entity:modified', [selectedEntity.value]);
};

const isActivePivot = (x, y) => {
  if (!selectedEntity.value) return false;
  // Default ke 0.5 jika null/undefined
  const ax = selectedEntity.value.anchorX ?? 0.5;
  const ay = selectedEntity.value.anchorY ?? 0.5;
  // Toleransi floating point
  return Math.abs(ax - x) < 0.05 && Math.abs(ay - y) < 0.05;
};

</script>