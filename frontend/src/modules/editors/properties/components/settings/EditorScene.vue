<template>
  <div class="flex flex-col h-full w-full relative outline-none select-none">
    
    <PropertySection title="Scene Configuration" :icon="Settings2" :default-open="false">
      
      <PropertyRow label="Background">
        <BaseColor v-model="backgroundColor" :show-input="true" class="w-full" />
      </PropertyRow>

      <PropertyRow label="Editor View">
        <BaseCheckbox v-model="showRulers" label="Show Rulers" />
      </PropertyRow>

      <div class="pt-3 pb-1 border-t border-border mt-3">
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

      <div class="pt-3 pb-1 border-t border-border mt-3">
        <div class="px-1 mb-2 flex items-center justify-between">
          <div class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <MapPin class="w-3 h-3" /> World Boundaries
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

      <div class="pt-3 pb-1 border-t border-border mt-3">
        <div class="px-1 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <CameraIcon class="w-3 h-3" /> Camera (World)
        </div>
        
        <PropertyRow label="Position">
          <div class="flex items-center gap-2">
            <div class="grid grid-cols-2 gap-2 flex-grow">
              <BaseNumber v-model="camX" prefix="X" class="font-mono" />
              <BaseNumber v-model="camY" prefix="Y" class="font-mono" />
            </div>

            <IconButton 
              @click="resetCameraPosition"
              tooltip="Reset to UI Center"
              class="shrink-0"
            >
              <RotateCcw class="w-3.5 h-3.5 opacity-70" />
            </IconButton>
          </div>
        </PropertyRow>

        <PropertyRow label="Zoom & Lerp">
          <div class="grid grid-cols-2 gap-2">
            <BaseNumber v-model="camZoom" prefix="Z" class="font-mono" :step="0.1" :min="0.1" />
            <BaseNumber v-model="camLerp" prefix="L" class="font-mono" :step="0.01" :min="0" :max="1" />
          </div>
        </PropertyRow>
      </div>

    </PropertySection>
  </div>
</template>

<script setup>
import { 
  Settings2, MapPin, Wind, 
  Camera as CameraIcon, RotateCcw 
} from 'lucide-vue-next';

import { useInspectorLogic } from "@editors/properties/composables/useInspectorLogic.js";
import { useProjectStore } from '@/stores/useProjectStore.js';

import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseColor from '@/commons/components/inputs/BaseColor.vue';
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseCheckbox from '@/commons/components/inputs/BaseCheckbox.vue';
import IconButton from '@/commons/components/buttons/IconButton.vue';

const { bindSettingProp } = useInspectorLogic();
const projectStore = useProjectStore();

const backgroundColor = bindSettingProp(null, 'backgroundColor');
const showRulers      = bindSettingProp(null, 'showRulers');

const gravity = bindSettingProp('physics', 'gravity');
const drag    = bindSettingProp('physics', 'drag');

const boundsActive = bindSettingProp('worldBounds', 'active');
const x1 = bindSettingProp('worldBounds', 'x1');
const x2 = bindSettingProp('worldBounds', 'x2');
const y1 = bindSettingProp('worldBounds', 'y1');
const y2 = bindSettingProp('worldBounds', 'y2');

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
:deep(.property-row) {
  margin-bottom: 0.25rem;
}
</style>