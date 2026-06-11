<template>
  <div class="animate-in fade-in duration-300 space-y-10">
    <section class="space-y-5">
      <div class="border-b border-border pb-2">
        <h4 class="text-sm font-bold text-foreground">Editor Grid</h4>
        <p class="text-xs text-muted-foreground mt-0.5">{{ info.desc }}</p>
      </div>
      
      <div class="space-y-6">
        <div class="flex items-center gap-8 py-2">
          <BaseCheckbox v-model="visible" label="Show Grid" box-size="w-4 h-4" icon-size="w-3 h-3" text-size="text-sm" />
          <BaseCheckbox v-model="snap" label="Snap to Grid" box-size="w-4 h-4" icon-size="w-3 h-3" text-size="text-sm" />
        </div>
        
        <PropertyRow label="Cell Dimensions">
          <div class="flex items-center gap-3">
            <div class="grid grid-cols-2 gap-3 flex-grow">
              <BaseNumber v-model="width" @update:model-value="onWidthChange" prefix="W" height="2.5rem" text-size="text-sm" label-size="text-sm" :min="1" :step="1" class="font-mono" />
              <BaseNumber v-model="height" @update:model-value="onHeightChange" prefix="H" height="2.5rem" text-size="text-sm" label-size="text-sm" :min="1" :step="1" class="font-mono" />
            </div>
            <button 
              @click="isRatioLocked = !isRatioLocked" 
              class="h-10 w-10 flex items-center justify-center rounded-md border transition-colors focus:outline-none shrink-0"
              :class="isRatioLocked ? 'border-primary/50 bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground hover:bg-muted'"
              :title="isRatioLocked ? 'Unlock Ratio' : 'Lock Ratio'"
            >
              <Lock v-if="isRatioLocked" class="w-4 h-4" />
              <Unlock v-else class="w-4 h-4 opacity-50" />
            </button>
          </div>
        </PropertyRow>

        <PropertyRow label="Line Style">
          <div class="flex gap-3">
            <BaseColor v-model="color" class="flex-1" />
            <BaseNumber v-model="opacity" height="2.5rem" text-size="text-sm" label-size="text-sm" :min="0" :max="1" :step="0.01" prefix="Op" class="w-24 font-mono" />
          </div>
        </PropertyRow>
      </div>
    </section>

    <section class="space-y-5">
      <div class="border-b border-border pb-2">
        <h4 class="text-sm font-bold text-foreground">Editor Camera</h4>
        <p class="text-xs text-muted-foreground mt-0.5">Sudut pandang bawaan editor terhadap dunia permainan.</p>
      </div>
      
      <div class="space-y-6">
        <PropertyRow label="World Position">
          <div class="flex items-center gap-3">
            <div class="grid grid-cols-2 gap-3 flex-grow">
              <BaseNumber v-model="camX" prefix="X" height="2.5rem" text-size="text-sm" label-size="text-sm" class="font-mono" />
              <BaseNumber v-model="camY" prefix="Y" height="2.5rem" text-size="text-sm" label-size="text-sm" class="font-mono" />
            </div>
            <button 
              @click="resetCameraPosition" 
              class="h-10 w-10 flex items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
              title="Reset to Center"
            >
              <RotateCcw class="w-4 h-4" />
            </button>
          </div>
        </PropertyRow>

        <PropertyRow label="Zoom & Smoothing">
          <div class="grid grid-cols-2 gap-3">
            <BaseNumber v-model="camZoom" prefix="Zoom" height="2.5rem" text-size="text-sm" label-size="text-sm" class="font-mono" :step="0.1" :min="0.1" />
            <BaseNumber v-model="camLerp" prefix="Lerp" height="2.5rem" text-size="text-sm" label-size="text-sm" class="font-mono" :step="0.01" :min="0" :max="1" />
          </div>
        </PropertyRow>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { RotateCcw, Lock, Unlock } from 'lucide-vue-next';

import { useInspectorLogic } from "@editors/properties/composables/useInspectorLogic.js";
import { useProjectStore } from '@/stores/useProjectStore.js';

import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseCheckbox from '@/commons/components/inputs/BaseCheckbox.vue';
import BaseColor from '@/commons/components/inputs/BaseColor.vue';

defineProps({ info: Object });

const { bindSettingProp } = useInspectorLogic();
const projectStore = useProjectStore();

const visible = bindSettingProp('grid', 'visible');
const snap    = bindSettingProp('grid', 'snap');
const width   = bindSettingProp('grid', 'width');
const height  = bindSettingProp('grid', 'height');
const color   = bindSettingProp('grid', 'color');
const opacity = bindSettingProp('grid', 'opacity');

const isRatioLocked = ref(true); 
const onWidthChange = (newVal) => {
  width.value = newVal;
  if (isRatioLocked.value) height.value = newVal; 
};
const onHeightChange = (newVal) => {
  height.value = newVal; 
  if (isRatioLocked.value) width.value = newVal; 
};

const camX    = bindSettingProp('camera', 'x');
const camY    = bindSettingProp('camera', 'y');
const camZoom = bindSettingProp('camera', 'zoom');
const camLerp = bindSettingProp('camera', 'lerp');

const resetCameraPosition = () => {
  const uiWidth = projectStore.project?.settings?.ui?.width || 1920;
  const uiHeight = projectStore.project?.settings?.ui?.height || 1080;
  camX.value = uiWidth / 2;
  camY.value = uiHeight / 2;
};
</script>

<style scoped>
:deep(.property-row) { margin-bottom: 0; }
</style>