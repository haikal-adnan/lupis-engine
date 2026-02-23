<template>
  <PropertySection title="Grid System" :icon="Grid3X3" :default-open="false">
    
    <div class="flex items-center gap-4 mb-3 pt-1 px-1">
      <BaseCheckbox 
        v-model="visible" 
        label="Show Grid" 
      />
      <BaseCheckbox 
        v-model="snap" 
        label="Snap to Grid" 
      />
    </div>

    <PropertyRow label="Cell Size (px)">
      <div class="flex items-center gap-2">
         <div class="grid grid-cols-2 gap-2 flex-grow">
          <BaseNumber 
            v-model="width" 
            @update:model-value="onWidthChange"
            prefix="W" 
            :min="1" 
            :step="1" 
            class="font-mono" 
          />
          <BaseNumber 
            v-model="height" 
            @update:model-value="onHeightChange"
            prefix="H" 
            :min="1" 
            :step="1" 
            class="font-mono" 
          />
        </div>

        <IconButton 
          :active="isRatioLocked" 
          @click="isRatioLocked = !isRatioLocked"
          :tooltip="isRatioLocked ? 'Unlock Ratio' : 'Lock Ratio'"
          class="shrink-0"
        >
          <Lock v-if="isRatioLocked" class="w-3.5 h-3.5" />
          <Unlock v-else class="w-3.5 h-3.5 opacity-50" />
        </IconButton>
      </div>
    </PropertyRow>

    <PropertyRow label="Visual Style">
      <div class="flex gap-2">
        <BaseColor 
          v-model="color" 
          class="flex-1"
        />
        <BaseNumber 
           v-model="opacity"
           :min="0" 
           :max="1" 
           :step="0.01"
           prefix="Op"
           class="w-20 font-mono"
        />
      </div>
    </PropertyRow>

  </PropertySection>
</template>

<script setup>
import { ref } from 'vue';
import { Grid3X3, Lock, Unlock } from 'lucide-vue-next';
import { useInspectorLogic } from "@/modules/properties/composables/useInspectorLogic.js";

import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseColor from '@/commons/components/inputs/BaseColor.vue';
import BaseCheckbox from '@/commons/components/inputs/BaseCheckbox.vue';
import IconButton from '@/commons/components/buttons/IconButton.vue';

const { bindSettingProp } = useInspectorLogic();

const visible = bindSettingProp('grid', 'visible');
const snap    = bindSettingProp('grid', 'snap');
const width   = bindSettingProp('grid', 'width');
const height  = bindSettingProp('grid', 'height');
const color   = bindSettingProp('grid', 'color');
const opacity = bindSettingProp('grid', 'opacity');

const isRatioLocked = ref(true); 

const onWidthChange = (newVal) => {
  width.value = newVal;
  if (isRatioLocked.value) {
    height.value = newVal; 
  }
};

const onHeightChange = (newVal) => {
  height.value = newVal; 
  if (isRatioLocked.value) {
    width.value = newVal; 
  }
};
</script>