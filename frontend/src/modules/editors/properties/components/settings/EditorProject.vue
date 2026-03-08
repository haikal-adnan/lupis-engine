<template>
  <div class="flex flex-col h-full w-full relative outline-none select-none">
    
    <PropertySection title="Engine & Canvas" :icon="Settings2" :default-open="false">
      
      <PropertyRow label="Tick Rate">
        <div class="flex items-center gap-2">
          <BaseNumber v-model="tickRate" prefix="FPS" :min="1" :max="240" :step="1" class="font-mono flex-1" />
          <div class="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
             {{ tickInterval }}ms
          </div>
        </div>
      </PropertyRow>

      <div class="flex items-center gap-4 mb-2 px-1">
        <BaseCheckbox v-model="active" label="Enable UI" />
        <BaseCheckbox v-model="showBorder" label="Show Bounds" :disabled="!active" />
      </div>

      <div :class="{ 'opacity-50 pointer-events-none grayscale': !active }" class="transition-all duration-300">
        <PropertyRow label="Game Resolution">
          <div class="flex items-center gap-2">
             <div class="grid grid-cols-2 gap-2 flex-grow">
              <BaseNumber v-model="refWidth" prefix="W" :min="1" :step="10" class="font-mono" />
              <BaseNumber v-model="refHeight" prefix="H" :min="1" :step="10" class="font-mono" />
            </div>

            <BaseDropdown align="right">
              <template #trigger="{ isOpen }">
                <button 
                  class="h-7 w-7 flex items-center justify-center rounded-md border transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
                  :class="isOpen ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-background hover:bg-accent hover:text-accent-foreground text-muted-foreground'"
                  title="Select Resolution Preset"
                >
                  <Monitor class="w-4 h-4" />
                </button>
              </template>

              <template #default="{ close }">
                <div class="w-[180px] flex flex-col py-1">
                  <div class="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Presets
                  </div>
                  
                  <button 
                    v-for="(preset, idx) in PRESETS" 
                    :key="idx"
                    @click="applyPreset(preset); close()"
                    class="relative flex items-center justify-between w-full px-2 py-1.5 text-xs text-left hover:bg-accent transition-colors"
                    :class="isCurrent(preset) ? 'text-primary font-medium bg-primary/5' : 'text-foreground'"
                  >
                    <span>{{ preset.label }}</span>
                    <Check v-if="isCurrent(preset)" class="w-3.5 h-3.5" />
                    <span v-else class="text-[10px] text-muted-foreground font-mono">{{ preset.w }}x{{ preset.h }}</span>
                  </button>

                  <div class="h-px bg-border my-1"></div>

                  <button 
                     @click="swapDimensions(); close()"
                     class="flex items-center w-full px-2 py-1.5 text-xs hover:bg-accent transition-colors"
                  >
                    <ArrowRightLeft class="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                    <span>Swap Orientation</span>
                  </button>
                </div>
              </template>
            </BaseDropdown>
          </div>
        </PropertyRow>
      </div>
    </PropertySection>

    <PropertySection title="Grid System" :icon="Grid3X3" :default-open="false">
      <div class="flex items-center gap-4 mb-3 pt-1 px-1">
        <BaseCheckbox v-model="visible" label="Show Grid" />
        <BaseCheckbox v-model="snap" label="Snap to Grid" />
      </div>

      <PropertyRow label="Cell Size (px)">
        <div class="flex items-center gap-2">
           <div class="grid grid-cols-2 gap-2 flex-grow">
            <BaseNumber v-model="width" @update:model-value="onWidthChange" prefix="W" :min="1" :step="1" class="font-mono" />
            <BaseNumber v-model="height" @update:model-value="onHeightChange" prefix="H" :min="1" :step="1" class="font-mono" />
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
          <BaseColor v-model="color" class="flex-1" />
          <BaseNumber v-model="opacity" :min="0" :max="1" :step="0.01" prefix="Op" class="w-20 font-mono" />
        </div>
      </PropertyRow>
    </PropertySection>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { LayoutTemplate, Monitor, Check, ArrowRightLeft, Grid3X3, Lock, Unlock, Settings2 } from 'lucide-vue-next';
import { useInspectorLogic } from "@editors/properties/composables/useInspectorLogic.js";

import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseCheckbox from '@/commons/components/inputs/BaseCheckbox.vue';
import BaseDropdown from '@ui/overlay/BaseDropdown.vue';
import BaseColor from '@/commons/components/inputs/BaseColor.vue';
import IconButton from '@/commons/components/buttons/IconButton.vue';

const { bindSettingProp, updateUISettingsBulk } = useInspectorLogic();

const active = bindSettingProp('ui', 'active');
const showBorder = bindSettingProp('ui', 'showUIBorder');
const refWidth = bindSettingProp('ui', 'width');
const refHeight = bindSettingProp('ui', 'height');

const visible = bindSettingProp('grid', 'visible');
const snap    = bindSettingProp('grid', 'snap');
const width   = bindSettingProp('grid', 'width');
const height  = bindSettingProp('grid', 'height');
const color   = bindSettingProp('grid', 'color');
const opacity = bindSettingProp('grid', 'opacity');

const tickRate = bindSettingProp(null, 'tickRate');

const isRatioLocked = ref(true); 
const onWidthChange = (newVal) => {
  width.value = newVal;
  if (isRatioLocked.value) height.value = newVal; 
};
const onHeightChange = (newVal) => {
  height.value = newVal; 
  if (isRatioLocked.value) width.value = newVal; 
};

const tickInterval = computed(() => {
  const fps = tickRate.value || 60;
  return (1000 / fps).toFixed(2);
});

const PRESETS = [
  { label: 'Full HD (1080p)', w: 1920, h: 1080 },
  { label: 'HD Ready (720p)', w: 1280, h: 720 },
  { label: '4K UHD', w: 3840, h: 2160 },
  { label: 'Mobile Portrait', w: 1080, h: 1920 },
  { label: 'iPad / Tablet', w: 2048, h: 1536 },
];

const applyPreset = (p) => {
  updateUISettingsBulk({ width: p.w, height: p.h });
};

const isCurrent = (p) => {
  return refWidth.value === p.w && refHeight.value === p.h;
};

const swapDimensions = () => {
  const temp = refWidth.value;
  refWidth.value = refHeight.value;
  refHeight.value = temp;
};
</script>