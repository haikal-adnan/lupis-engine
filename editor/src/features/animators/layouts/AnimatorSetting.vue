<template>
  <PropertySection title="Editor Settings" :icon="Settings2" :default-open="false" data-testid="animator-setting-section">
    
    <PropertyRow label="Show Shadow (Onion Skin)">
      <BaseCheckbox 
        v-model="showShadow" 
        :label="showShadow ? 'Enabled' : 'Disabled'"
        data-testid="animator-setting-shadow-checkbox"
      />
    </PropertyRow>

    <template v-if="showShadow">
      <PropertyRow label="Shadow Frames">
        <BaseNumber 
          v-model="shadowFrameCount" 
          :min="1" 
          :max="10" 
          :step="1" 
          prefix="F" 
          class="font-mono w-full" 
          data-testid="animator-setting-shadow-count"
        />
      </PropertyRow>

      <PropertyRow label="Base Opacity (%)">
        <BaseNumber 
          v-model="shadowOpacity" 
          :min="5" 
          :max="100" 
          :step="5" 
          prefix="%" 
          class="font-mono w-full" 
          data-testid="animator-setting-shadow-opacity"
        />
      </PropertyRow>
    </template>

    <PropertyRow label="Grid Overlay">
      <BaseCheckbox 
        v-model="showGrid" 
        :label="showGrid ? 'Enabled' : 'Disabled'"
        data-testid="animator-setting-grid-checkbox"
      />
    </PropertyRow>

    <PropertyRow v-if="showGrid" label="Grid Size (px)">
      <BaseNumber 
        v-model="gridSize" 
        :min="4" 
        :max="256" 
        :step="4" 
        prefix="px" 
        class="font-mono w-full" 
        data-testid="animator-setting-grid-size"
      />
    </PropertyRow>

  </PropertySection>
</template>

<script setup>
import { Settings2 } from 'lucide-vue-next';
import { PropertySection, PropertyRow, BaseNumber, BaseCheckbox } from '@components/components.js';
import { useAnimatorLogic } from '@animators/animators.js';

const { showShadow, shadowFrameCount, shadowOpacity, showGrid, gridSize } = useAnimatorLogic();
</script>