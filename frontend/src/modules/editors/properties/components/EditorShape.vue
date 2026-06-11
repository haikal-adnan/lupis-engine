<template>
  <PropertySection title="Shape Renderer" :icon="Square" v-if="hasComponent">
    
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
      <div class="p-1 space-y-0.5 min-w-[160px]">
        <template v-if="prefabId">
          <button 
            @click="syncComponent('ShapeRenderer'); close()" 
            :disabled="!overridden"
            class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw class="w-3.5 h-3.5 mr-2 opacity-70" /> 
            Sync Component
          </button>
          <div class="h-px bg-border my-1"></div>
        </template>
        <button 
          @click="removeComponent('ShapeRenderer'); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors"
        >
          <Trash2 class="w-3.5 h-3.5 mr-2" />
          Remove Component
        </button>
      </div>
    </template>

    <div class="flex gap-2.5 mb-3 pt-1">
      <div class="w-[52px] h-[52px] shrink-0 bg-muted/20 border border-border rounded flex items-center justify-center p-2 relative overflow-hidden">
        <div class="absolute inset-0 opacity-20 pointer-events-none" style="background-image: radial-gradient(#444 1px, transparent 1px); background-size: 6px 6px;"></div>
        <svg viewBox="0 0 24 24" class="w-full h-full relative z-10 drop-shadow-sm transition-all duration-300" stroke-linejoin="round">
          <circle v-if="type === 'ellipse' || type === 'circle'" cx="12" cy="12" r="10" :fill="isFilled ? color : 'none'" :stroke="Math.abs(outlineWidth) > 0 ? outlineColor : 'none'" :stroke-width="Math.abs(outlineWidth) > 0 ? 2 : 0" :fill-opacity="rawOpacity * rawFillOpacity" :stroke-opacity="rawOpacity * rawOutlineOpacity" />
          <polygon v-else-if="type === 'polygon'" points="12,2 22,18 2,18" :fill="isFilled ? color : 'none'" :stroke="Math.abs(outlineWidth) > 0 ? outlineColor : 'none'" :stroke-width="Math.abs(outlineWidth) > 0 ? 2 : 0" :fill-opacity="rawOpacity * rawFillOpacity" :stroke-opacity="rawOpacity * rawOutlineOpacity" />
          <rect v-else x="2" y="2" width="20" height="20" :rx="cornerRadius ? Math.min(cornerRadius, 10) : 0" :fill="isFilled ? color : 'none'" :stroke="Math.abs(outlineWidth) > 0 ? outlineColor : 'none'" :stroke-width="Math.abs(outlineWidth) > 0 ? 2 : 0" :fill-opacity="rawOpacity * rawFillOpacity" :stroke-opacity="rawOpacity * rawOutlineOpacity" />
        </svg>
      </div>

      <div class="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
        <PropertyRow label="Shape Type" :no-margin="true">
           <BaseSelect v-model="type" :options="shapeTypes" class="w-full" />
        </PropertyRow>
      </div>
    </div>

    <PropertyRow label="Global Opacity" class="mb-2">
        <BaseNumber prefix="OP" v-model="displayOpacity" :min="0" :max="100" :step="1" :scrubbable="true" class="font-mono w-full" tooltip="Mempengaruhi fill & outline" />
    </PropertyRow>

    <div v-if="type === 'polygon' || type === 'rectangle'" class="pb-1">
      <PropertyRow v-if="type === 'rectangle' || type === 'polygon'" label="Corner Radius">
        <BaseNumber prefix="CR" v-model="cornerRadius" :min="0" class="w-full font-mono" />
      </PropertyRow>
      <PropertyRow v-if="type === 'polygon'" label="Sides">
        <BaseNumber prefix="S" v-model="sides" :min="3" :max="32" :step="1" class="w-full font-mono" />
      </PropertyRow>
    </div>

    <div class="pt-3 pb-1 border-t border-border mt-3">
      <div class="px-1 mb-2 flex items-center justify-between">
        <div class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          Fill Properties
        </div>
        <BaseCheckbox v-model="isFilled" />
      </div>
      
      <div :class="{ 'opacity-40 pointer-events-none filter grayscale': !isFilled }" class="transition-all duration-300">
        <PropertyRow label="Color">
          <BaseColor v-model="color" :show-input="true" class="w-full" />
        </PropertyRow>
        <PropertyRow label="Opacity">
          <BaseNumber prefix="OP" v-model="displayFillOpacity" :min="0" :max="100" :step="1" :scrubbable="true" class="font-mono w-full" />
        </PropertyRow>
      </div>
    </div>

    <div class="pt-3 pb-1 border-t border-border mt-3">
      <div class="px-1 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        Outline Properties
      </div>
      
      <PropertyRow label="Width">
        <BaseNumber v-model="outlineWidth" prefix="W" :step="1" :scrubbable="true" class="font-mono w-full" tooltip="+ Ke Dalam, - Ke Luar" />
      </PropertyRow>

      <PropertyRow label="Color">
        <BaseColor v-model="outlineColor" :show-input="true" class="w-full" />
      </PropertyRow>

      <PropertyRow label="Opacity">
        <BaseNumber prefix="OP" v-model="displayOutlineOpacity" :min="0" :max="100" :step="1" :scrubbable="true" class="font-mono w-full" />
      </PropertyRow>
    </div>

  </PropertySection>
</template>

<script setup>
import { computed } from "vue";
import { Square, Trash2, RefreshCw } from "lucide-vue-next"; 
import { useInspectorLogic } from "@editors/properties/composables/useInspectorLogic.js"; 

import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseSelect from "@/commons/components/inputs/BaseSelect.vue";
import BaseColor from "@/commons/components/inputs/BaseColor.vue";
import BaseNumber from "@/commons/components/inputs/BaseNumber.vue";
import BaseCheckbox from "@/commons/components/inputs/BaseCheckbox.vue";

const { selectedEntity, removeComponent, bindComponentProp, prefabId, syncComponent, getComponentOverrideStatus } = useInspectorLogic();

const hasComponent = computed(() => !!selectedEntity.value?.components?.ShapeRenderer);
const overridden = getComponentOverrideStatus('ShapeRenderer');

const type = bindComponentProp('ShapeRenderer', 'type');
const rawOpacity = bindComponentProp('ShapeRenderer', 'opacity');

const isFilled = bindComponentProp('ShapeRenderer', 'isFilled');
const color = bindComponentProp('ShapeRenderer', 'color');
const rawFillOpacity = bindComponentProp('ShapeRenderer', 'fillOpacity');

const outlineWidth = bindComponentProp('ShapeRenderer', 'outlineWidth');
const outlineColor = bindComponentProp('ShapeRenderer', 'outlineColor');
const rawOutlineOpacity = bindComponentProp('ShapeRenderer', 'outlineOpacity');

const cornerRadius = bindComponentProp('ShapeRenderer', 'cornerRadius');
const sides = bindComponentProp('ShapeRenderer', 'sides');

const displayOpacity = computed({
  get: () => Math.round((rawOpacity.value ?? 1) * 100),
  set: (val) => { rawOpacity.value = parseFloat((val / 100).toFixed(2)); }
});

const displayFillOpacity = computed({
  get: () => Math.round((rawFillOpacity.value ?? 1) * 100),
  set: (val) => { rawFillOpacity.value = parseFloat((val / 100).toFixed(2)); }
});

const displayOutlineOpacity = computed({
  get: () => Math.round((rawOutlineOpacity.value ?? 1) * 100),
  set: (val) => { rawOutlineOpacity.value = parseFloat((val / 100).toFixed(2)); }
});

const shapeTypes = [
  { label: 'Rectangle', value: 'rectangle' },
  { label: 'Ellipse', value: 'ellipse' },
  { label: 'Polygon', value: 'polygon' }
];
</script>