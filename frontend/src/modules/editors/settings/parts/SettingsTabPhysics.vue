<template>
  <div class="animate-in fade-in duration-300 space-y-10">
    <section class="space-y-5">
      <div class="border-b border-border pb-2">
        <h4 class="text-sm font-bold text-foreground">World Physics</h4>
        <p class="text-xs text-muted-foreground mt-0.5">{{ info.desc }}</p>
      </div>
      
      <div class="space-y-6">
        <PropertyRow label="Global Gravity (Y)">
          <BaseNumber v-model="gravity" class="font-mono" height="2.5rem" text-size="text-sm" label-size="text-sm" :step="10" />
        </PropertyRow>
        <PropertyRow label="Air Drag Coefficient">
          <BaseNumber v-model="drag" class="font-mono" height="2.5rem" text-size="text-sm" label-size="text-sm" :step="0.1" :min="0" />
        </PropertyRow>
      </div>
    </section>

    <section class="space-y-5">
      <div class="flex items-center justify-between border-b border-border pb-2">
        <div>
          <h4 class="text-sm font-bold text-foreground">World Boundaries</h4>
          <p class="text-xs text-muted-foreground mt-0.5">Batas area aktif untuk sistem tabrakan dan kamera.</p>
        </div>
        <BaseCheckbox v-model="boundsActive" label="Enable Bounds" box-size="w-4 h-4" icon-size="w-3 h-3" text-size="text-sm" />
      </div>
      
      <div class="space-y-6 transition-all duration-300" :class="{ 'opacity-40 pointer-events-none filter grayscale': !boundsActive }">
        <PropertyRow label="Horizontal Scope (X)">
          <div class="grid grid-cols-2 gap-3">
            <BaseNumber v-model="x1" prefix="Min" class="font-mono" height="2.5rem" text-size="text-sm" label-size="text-sm" />
            <BaseNumber v-model="x2" prefix="Max" class="font-mono" height="2.5rem" text-size="text-sm" label-size="text-sm" />
          </div>
        </PropertyRow>
        <PropertyRow label="Vertical Scope (Y)">
          <div class="grid grid-cols-2 gap-3">
            <BaseNumber v-model="y1" prefix="Min" class="font-mono" height="2.5rem" text-size="text-sm" label-size="text-sm" />
            <BaseNumber v-model="y2" prefix="Max" class="font-mono" height="2.5rem" text-size="text-sm" label-size="text-sm" />
          </div>
        </PropertyRow>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useInspectorLogic } from "@editors/properties/composables/useInspectorLogic.js";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseCheckbox from '@/commons/components/inputs/BaseCheckbox.vue';

defineProps({ info: Object });

const { bindSettingProp } = useInspectorLogic();

const gravity = bindSettingProp('physics', 'gravity');
const drag    = bindSettingProp('physics', 'drag');
const boundsActive = bindSettingProp('worldBounds', 'active');
const x1 = bindSettingProp('worldBounds', 'x1');
const x2 = bindSettingProp('worldBounds', 'x2');
const y1 = bindSettingProp('worldBounds', 'y1');
const y2 = bindSettingProp('worldBounds', 'y2');
</script>

<style scoped>
:deep(.property-row) { margin-bottom: 0; }
</style>