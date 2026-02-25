<template>
  <PropertySection title="Scene Configuration" :icon="Settings2" :default-open="true">
    
    <PropertyRow label="Background">
      <BaseColor v-model="backgroundColor" :show-input="true" class="w-full" />
    </PropertyRow>

    <div class="pt-2 pb-1 border-t border-border mt-2">
        <div class="px-1 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Wind class="w-3 h-3" /> Local Physics
        </div>
        <PropertyRow label="Gravity (Y)">
          <BaseNumber v-model="gravity" class="font-mono" :step="10" />
        </PropertyRow>
        <PropertyRow label="Air Drag">
          <BaseNumber v-model="drag" class="font-mono" :step="0.1" :min="0" />
        </PropertyRow>
    </div>

    <div class="pt-2 pb-1 border-t border-border mt-2">
      <div class="px-1 mb-2 flex items-center justify-between">
        <div class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <MapPin class="w-3 h-3" />
          World Boundaries
        </div>
        <BaseCheckbox v-model="boundsActive" />
      </div>
      
      <div :class="{ 'opacity-40 pointer-events-none filter grayscale': !boundsActive }" class="transition-all duration-300">
        <PropertyRow label="Horizontal (X)">
          <div class="grid grid-cols-2 gap-2">
            <BaseNumber v-model="x1" prefix="Min" class="font-mono" />
            <BaseNumber v-model="x2" prefix="Max" class="font-mono" />
          </div>
        </PropertyRow>

        <PropertyRow label="Vertical (Y)">
          <div class="grid grid-cols-2 gap-2">
            <BaseNumber v-model="y1" prefix="Min" class="font-mono" />
            <BaseNumber v-model="y2" prefix="Max" class="font-mono" />
          </div>
        </PropertyRow>
      </div>
    </div>

    <PropertyRow label="Editor View" class="border-t border-border pt-2 mt-2">
      <BaseCheckbox v-model="showRulers" label="Show Rulers" />
    </PropertyRow>

  </PropertySection>
</template>

<script setup>
import { Settings2, MapPin, Wind } from 'lucide-vue-next';
import { useInspectorLogic } from "@editors/properties/composables/useInspectorLogic.js";

import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseColor from '@/commons/components/inputs/BaseColor.vue';
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseCheckbox from '@/commons/components/inputs/BaseCheckbox.vue';

const { bindSettingProp } = useInspectorLogic();

const gravity = bindSettingProp('physics', 'gravity');
const drag    = bindSettingProp('physics', 'drag');
const backgroundColor = bindSettingProp(null, 'backgroundColor');
const showRulers      = bindSettingProp(null, 'showRulers');

const boundsActive = bindSettingProp('worldBounds', 'active');
const x1 = bindSettingProp('worldBounds', 'x1');
const x2 = bindSettingProp('worldBounds', 'x2');
const y1 = bindSettingProp('worldBounds', 'y1');
const y2 = bindSettingProp('worldBounds', 'y2');
</script>