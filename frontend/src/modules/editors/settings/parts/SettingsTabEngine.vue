<template>
  <div class="animate-in fade-in duration-300 space-y-10">
    <section class="space-y-5">
      <div class="border-b border-border pb-2">
        <h4 class="text-sm font-bold text-foreground">Core Engine</h4>
        <p class="text-xs text-muted-foreground mt-0.5">{{ info.desc }}</p>
      </div>
      
      <div class="space-y-6">
        <PropertyRow label="Simulation Tick Rate">
          <div class="flex items-center gap-3">
            <BaseNumber v-model="tickRate" prefix="FPS" :min="1" :max="240" :step="1" height="2.5rem" text-size="text-sm" label-size="text-sm" class="font-mono flex-1" />
            <div class="text-sm font-mono text-muted-foreground bg-muted px-4 h-10 flex items-center rounded-md border border-border">
              {{ tickInterval }}ms
            </div>
          </div>
        </PropertyRow>

        <PropertyRow label="Global Background">
          <BaseColor v-model="backgroundColor" :show-input="true" class="w-full" />
        </PropertyRow>
      </div>
    </section>

    <section class="space-y-5">
      <div class="border-b border-border pb-2">
        <h4 class="text-sm font-bold text-foreground">Viewport & Resolution</h4>
        <p class="text-xs text-muted-foreground mt-0.5">Configure resolution settings for the render canvas and UI layer.</p>
      </div>
      
      <div class="space-y-6">
        <div class="flex items-center gap-8 py-2">
          <BaseCheckbox v-model="active" label="Enable UI Layer" box-size="w-4 h-4" icon-size="w-3 h-3" text-size="text-sm" />
          <BaseCheckbox v-model="showBorder" label="Show UI Bounds" :disabled="!active" box-size="w-4 h-4" icon-size="w-3 h-3" text-size="text-sm" />
        </div>

        <div :class="{ 'opacity-50 pointer-events-none grayscale': !active }" class="transition-all duration-300">
          <PropertyRow label="Target Resolution">
            <div class="flex items-center gap-3">
              <div class="grid grid-cols-2 gap-3 flex-grow">
                <BaseNumber v-model="refWidth" prefix="W" :min="1" :step="10" height="2.5rem" text-size="text-sm" label-size="text-sm" class="font-mono" />
                <BaseNumber v-model="refHeight" prefix="H" :min="1" :step="10" height="2.5rem" text-size="text-sm" label-size="text-sm" class="font-mono" />
              </div>

              <BaseDropdown align="right">
                <template #trigger="{ isOpen }">
                  <button 
                    class="h-10 w-10 flex items-center justify-center rounded-md border transition-all focus:outline-none shrink-0"
                    :class="isOpen ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-background hover:bg-accent text-muted-foreground shadow-sm'"
                    title="Resolution Presets"
                  >
                    <MonitorPlay class="w-4 h-4" />
                  </button>
                </template>
                <template #default="{ close }">
                  <div class="w-[200px] flex flex-col py-1">
                    <div class="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Common Presets</div>
                    <button v-for="(preset, idx) in PRESETS" :key="idx" @click="applyPreset(preset); close()" class="relative flex items-center justify-between w-full px-3 py-2 text-xs text-left hover:bg-accent transition-colors" :class="isCurrent(preset) ? 'text-primary font-medium bg-primary/5' : 'text-foreground'">
                      <span>{{ preset.label }}</span>
                      <Check v-if="isCurrent(preset)" class="w-3.5 h-3.5" />
                      <span v-else class="text-[10px] text-muted-foreground font-mono">{{ preset.w }}x{{ preset.h }}</span>
                    </button>
                    <div class="h-px bg-border my-1"></div>
                    <button @click="swapDimensions(); close()" class="flex items-center w-full px-3 py-2 text-xs hover:bg-accent transition-colors text-foreground">
                      <ArrowRightLeft class="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                      <span>Swap Orientation</span>
                    </button>
                  </div>
                </template>
              </BaseDropdown>
            </div>
          </PropertyRow>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { MonitorPlay, Check, ArrowRightLeft } from 'lucide-vue-next';

import { useInspectorLogic } from "@editors/properties/composables/useInspectorLogic.js";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseCheckbox from '@/commons/components/inputs/BaseCheckbox.vue';
import BaseDropdown from '@ui/overlay/BaseDropdown.vue';
import BaseColor from '@/commons/components/inputs/BaseColor.vue';

defineProps({ info: Object });

const { bindSettingProp, updateUISettingsBulk } = useInspectorLogic();

const tickRate = bindSettingProp(null, 'tickRate');
const backgroundColor = bindSettingProp(null, 'backgroundColor');
const active = bindSettingProp('ui', 'active');
const showBorder = bindSettingProp('ui', 'showUIBorder');
const refWidth = bindSettingProp('ui', 'width');
const refHeight = bindSettingProp('ui', 'height');

const tickInterval = computed(() => (1000 / (tickRate.value || 60)).toFixed(2));

const PRESETS = [
  { label: 'Full HD (1080p)', w: 1920, h: 1080 },
  { label: 'HD Ready (720p)', w: 1280, h: 720 },
  { label: '4K UHD', w: 3840, h: 2160 },
  { label: 'Mobile Portrait', w: 1080, h: 1920 },
  { label: 'iPad / Tablet', w: 2048, h: 1536 },
];

const applyPreset = (p) => updateUISettingsBulk({ width: p.w, height: p.h });
const isCurrent = (p) => refWidth.value === p.w && refHeight.value === p.h;
const swapDimensions = () => {
  const temp = refWidth.value;
  refWidth.value = refHeight.value;
  refHeight.value = temp;
};
</script>

<style scoped>
:deep(.property-row) { margin-bottom: 0; }
</style>