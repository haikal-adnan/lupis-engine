<template>
  <PropertySection title="UI Interface" :icon="LayoutTemplate" :default-open="false">
    
    <div class="flex items-center gap-4 pt-1 px-1">
      <BaseCheckbox 
        v-model="active" 
        label="Enable UI" 
      />
      <BaseCheckbox 
        v-model="showBorder" 
        label="Show Bounds" 
        :disabled="!active"
      />
    </div>

    <div :class="{ 'opacity-50 pointer-events-none grayscale': !active }" class="transition-all duration-300">
      
      <PropertyRow label="Reference Size" class="">
        <div class="flex items-center gap-2">
           <div class="grid grid-cols-2 gap-2 flex-grow">
            <BaseNumber 
              v-model="refWidth" 
              prefix="W" 
              :min="1" 
              :step="10" 
              class="font-mono" 
            />
            <BaseNumber 
              v-model="refHeight" 
              prefix="H" 
              :min="1" 
              :step="10" 
              class="font-mono" 
            />
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

      <PropertyRow label="Scale Mode" class="border-t border-border pt-2 mt-2">
        <BaseSelect 
          v-model="scaleMode" 
          :options="scaleModeOptions" 
        />
      </PropertyRow>
      
    </div>
  </PropertySection>
</template>

<script setup>
import { LayoutTemplate, Monitor, Check, ArrowRightLeft } from 'lucide-vue-next';
import { useInspectorLogic } from "@/modules/properties/composables/useInspectorLogic.js";

// Atomic Components
import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue';
import BaseCheckbox from '@/commons/components/inputs/BaseCheckbox.vue';
import BaseDropdown from '@ui/overlay/BaseDropdown.vue';

const { bindSettingProp } = useInspectorLogic();

// --- Bindings ---
const active = bindSettingProp('ui', 'active');
const showBorder = bindSettingProp('ui', 'showUIBorder');
const refWidth = bindSettingProp('ui', 'referenceWidth');
const refHeight = bindSettingProp('ui', 'referenceHeight');
const scaleMode = bindSettingProp('ui', 'scaleMode');

// --- Data ---
const scaleModeOptions = [
  { label: 'Constant Pixel Size', value: 'constant' },
  { label: 'Scale With Screen Size', value: 'scale_with_screen' },
  { label: 'Constant Physical Size', value: 'physical' },
];

const PRESETS = [
  { label: 'Full HD (1080p)', w: 1920, h: 1080 },
  { label: 'HD Ready (720p)', w: 1280, h: 720 },
  { label: '4K UHD', w: 3840, h: 2160 },
  { label: 'Mobile Portrait', w: 1080, h: 1920 },
  { label: 'Mobile Landscape', w: 1920, h: 1080 },
  { label: 'iPad / Tablet', w: 2048, h: 1536 },
];

// --- Logic ---
const applyPreset = (p) => {
  refWidth.value = p.w;
  refHeight.value = p.h;
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