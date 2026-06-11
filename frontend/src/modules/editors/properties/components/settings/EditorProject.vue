<template>
  <div class="flex flex-col h-full w-full relative outline-none select-none">
    
    <PropertySection title="Quick Actions" :icon="Zap" :default-open="true">
      <div class="flex flex-col gap-2 px-1 py-1">
        <BaseCheckbox v-model="visible" label="Show Grid Guide" text-size="text-xs" />
        <BaseCheckbox v-model="snap" label="Snap to Grid" text-size="text-xs" />
        <BaseCheckbox v-model="showRulers" label="Show Editor Rulers" text-size="text-xs" />
        <BaseCheckbox v-model="active" label="Enable UI Layer" text-size="text-xs" />
        <BaseCheckbox v-model="showBorder" label="Show UI Bounds" :disabled="!active" text-size="text-xs" />
      </div>
    </PropertySection>
  </div>
</template>

<script setup>
import { Zap, Settings2 } from 'lucide-vue-next';
import { useInspectorLogic } from "@editors/properties/composables/useInspectorLogic.js";

import PropertySection from "@ui/display/PropertySection.vue";
import BaseCheckbox from '@/commons/components/inputs/BaseCheckbox.vue';

const { bindSettingProp } = useInspectorLogic();

const active     = bindSettingProp('ui', 'active');
const showBorder = bindSettingProp('ui', 'showUIBorder');
const visible    = bindSettingProp('grid', 'visible');
const snap       = bindSettingProp('grid', 'snap');
const showRulers = bindSettingProp(null, 'showRulers');
</script>