<template>
  <div class="flex flex-col h-full w-full relative outline-none select-none" data-testid="editor-scene-section">
    
    <PropertySection title="Scene Properties" :icon="Monitor" :default-open="true" data-testid="scene-properties-section">
      <div class="py-1">
        <PropertyRow label="Background Color">
          <BaseColor v-model="backgroundColor" :show-input="true" class="w-full" data-testid="scene-bg-color-picker" />
        </PropertyRow>
      </div>
    </PropertySection>

  </div>
</template>

<script setup>
import { Monitor, Wind } from 'lucide-vue-next';
import { useInspectorBinding } from "@inspectors/inspectors.js";

import {
  PropertySection,
  PropertyRow,
  BaseColor
} from '@components/components.js';

const { bindSettingProp } = useInspectorBinding();

const backgroundColor = bindSettingProp(null, 'backgroundColor');
</script>

<style scoped>
:deep(.property-row) {
  margin-bottom: 0.25rem;
}
</style>