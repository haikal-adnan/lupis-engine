<template>
  <div class="flex flex-col h-full w-full relative outline-none select-none">
    
    <PropertySection title="Scene Properties" :icon="Monitor" :default-open="true">
      <div class="py-1">
        <PropertyRow label="Background Color">
          <BaseColor v-model="backgroundColor" :show-input="true" class="w-full" />
        </PropertyRow>
      </div>
    </PropertySection>

  </div>
</template>

<script setup>
import { Monitor, Wind } from 'lucide-vue-next';
import { useInspectorLogic } from "@inspectors/inspectors.js";

import {
  PropertySection,
  PropertyRow,
  BaseColor
} from '@components/components.js';

const { bindSettingProp } = useInspectorLogic();

const backgroundColor = bindSettingProp(null, 'backgroundColor');
</script>

<style scoped>
:deep(.property-row) {
  margin-bottom: 0.25rem;
}
</style>