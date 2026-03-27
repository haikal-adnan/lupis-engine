<template>
  <PropertySection title="Text Renderer" :icon="Type" v-if="hasComponent">
    
    <template #header-extra>
      <div 
        v-if="prefabId"
        class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border select-none shrink-0"
        :class="overridden ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'"
      >
        {{ overridden ? 'Override' : 'Sync' }}
      </div>
    </template>

    <template #menu="{ close }">
      <div class="p-1 space-y-0.5 min-w-[160px]">
        <template v-if="prefabId">
          <button @click="syncComponent('TextRenderer'); close()" :disabled="!overridden" class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <RefreshCw class="w-3.5 h-3.5 mr-2 opacity-70" /> Sync Component
          </button>
          <div class="h-px bg-border my-1"></div>
        </template>
        <button @click="removeComponent('TextRenderer'); close()" class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors">
          <Trash2 class="w-3.5 h-3.5 mr-2" /> Remove Component
        </button>
      </div>
    </template>

    <div class="flex gap-2.5 mb-2 pt-1 items-center">
      <div class="w-[52px] h-[52px] shrink-0 bg-muted/20 border border-border rounded flex items-center justify-center overflow-hidden relative group">
         <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: radial-gradient(#444 1px, transparent 1px); background-size: 4px 4px;"></div>
         <span class="text-sm font-bold select-none transition-all duration-200" :style="{ color: color, opacity: rawOpacity }">Aa</span>
      </div>

      <div class="w-full space-y-1.5">
        <PropertyRow label="Font" :no-margin="true">
          <button type="button" class="group flex items-center w-full relative text-left bg-secondary/40 border border-border rounded-md h-7 overflow-hidden">
            <span class="flex-1 px-2 text-[11px] font-mono text-muted-foreground/90 truncate">Inter</span>
            <div class="px-2 h-full flex items-center justify-center border-l border-border bg-muted/10"><FolderSearch class="w-3 h-3" /></div>
          </button>
        </PropertyRow>
        <PropertyRow label="Mode" :no-margin="true">
          <BaseSelect v-model="mode" :options="[{ label: 'Static', value: 'static' }, { label: 'Rich Text', value: 'rich' }]" />
        </PropertyRow>
      </div>
    </div>

    <PropertyRow label="Text">
      <BaseTextArea v-model="textValue" placeholder="Type something..." height="auto" minHeight="64px" resize="vertical" class="w-full" />
    </PropertyRow>

    <div class="grid grid-cols-2 gap-2 mt-2">
      <PropertyRow label="Font Size">
        <div class="flex items-center gap-1">
          <BaseNumber v-model="fontSize" prefix="SZ" :min="1" :scrubbable="true" class="flex-grow font-mono" />
          <IconButton @click="resetTextRatio" tooltip="Reset / Auto-fit Size"><RefreshCcw class="w-3.5 h-3.5" /></IconButton>
        </div>
      </PropertyRow>
      <PropertyRow label="Max Width">
        <BaseNumber v-model="maxWidth" prefix="W" :min="0" :scrubbable="true" class="w-full font-mono" />
      </PropertyRow>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <PropertyRow label="Max Line">
        <BaseNumber v-model="maxLine" prefix="L" :min="0" :step="1" :precision="0" :scrubbable="true" class="w-full font-mono" />
      </PropertyRow>
      <PropertyRow label="Overflow">
        <BaseSelect v-model="overflow" :options="[{ label: 'Wrap', value: 'wrap' }, { label: 'Ellipsis', value: 'ellipsis' }]" />
      </PropertyRow>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <PropertyRow label="Line Space">
        <BaseNumber v-model="lineSpacing" prefix="H" :step="0.1" :precision="2" :scrubbable="true" class="w-full font-mono" />
      </PropertyRow>
      <PropertyRow label="Char Space">
        <BaseNumber v-model="letterSpacing" prefix="S" :step="0.1" :precision="2" :scrubbable="true" class="w-full font-mono" />
      </PropertyRow>
    </div>

    <div class="px-1 mb-2 mt-1">
      <BaseCheckbox v-model="autoFit" label="Auto Fit Transform to Text" />
    </div>

    <PropertyRow label="Alignment">
      <div class="flex bg-secondary/30 rounded-md border border-border w-full">
        <BaseButton v-for="opt in alignOptions" :key="opt.value" ghost :active="align === opt.value" @click="align = opt.value" class="flex-1 h-7 !rounded-[3px]">
          <component :is="opt.icon" class="w-3.5 h-3.5" />
        </BaseButton>
      </div>
    </PropertyRow>

    <div class="h-px bg-border my-3"></div>

    <div class="space-y-2">
      <PropertyRow label="Text Color">
        <div class="flex gap-2">
          <BaseColor v-model="color" :show-label="false" height="1.75rem" class="flex-1" />
          <BaseNumber prefix="OP" v-model="displayOpacity" :min="0" :max="100" :step="1" :scrubbable="true" class="font-mono w-[45%]" />
        </div>
      </PropertyRow>

      <PropertyRow label="Outline">
        <div class="flex gap-2">
          <BaseColor v-model="outlineColor" :show-label="false" height="1.75rem" class="flex-1" />
          <BaseNumber v-model="outlineWidth" prefix="W" :min="0" :max="1" :step="0.05" :precision="2" :scrubbable="true" class="font-mono w-[45%]" />
        </div>
      </PropertyRow>

      <PropertyRow label="Advanced">
        <div class="grid grid-cols-2 gap-2">
          <BaseNumber v-model="smoothing" prefix="SM" :min="0.01" :max="1" :step="0.05" :precision="2" :scrubbable="true" class="font-mono" tooltip="Anti-aliasing / Smoothing" />
          <BaseNumber v-model="bias" prefix="BS" :min="-0.2" :max="0.2" :step="0.01" :precision="2" :scrubbable="true" class="font-mono" tooltip="Font Bias (Fix holes / Bold effect)" />
        </div>
      </PropertyRow>
    </div>

    <div class="h-px bg-border my-3"></div>

    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium text-muted-foreground">Drop Shadow</span>
        <BaseCheckbox v-model="shadowEnabled" label="" />
      </div>

      <div v-if="shadowEnabled" class="space-y-2">
        <PropertyRow label="Color">
          <div class="flex gap-2">
            <BaseColor v-model="shadowColor" :show-label="false" height="1.75rem" class="flex-1" />
            <BaseNumber v-model="displayShadowOpacity" prefix="OP" :min="0" :max="100" :step="1" :scrubbable="true" class="font-mono w-[45%]" />
          </div>
        </PropertyRow>
        <PropertyRow label="Offset">
          <div class="grid grid-cols-2 gap-2">
            <BaseNumber v-model="shadowOffsetX" prefix="X" :step="1" :scrubbable="true" class="font-mono" />
            <BaseNumber v-model="shadowOffsetY" prefix="Y" :step="1" :scrubbable="true" class="font-mono" />
          </div>
        </PropertyRow>
        <PropertyRow label="Blur">
          <BaseNumber v-model="shadowBlur" prefix="B" :min="0" :max="20" :step="1" :scrubbable="true" class="font-mono w-full" />
        </PropertyRow>
      </div>
    </div>

  </PropertySection>
</template>

<script setup>
import { computed } from "vue";
import { 
  Type, Trash2, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  FolderSearch, RefreshCcw, RefreshCw
} from "lucide-vue-next"; 
import { useInspectorLogic } from "@editors/properties/composables/useInspectorLogic.js"; 

import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseNumber from "@/commons/components/inputs/BaseNumber.vue";
import BaseTextArea from "@/commons/components/inputs/BaseTextArea.vue";
import BaseColor from "@/commons/components/inputs/BaseColor.vue";
import BaseButton from "@/commons/components/buttons/BaseButton.vue";
import IconButton from "@/commons/components/buttons/IconButton.vue";
import BaseCheckbox from "@/commons/components/inputs/BaseCheckbox.vue";
import BaseSelect from "@/commons/components/inputs/BaseSelect.vue"; 

const { 
  selectedEntity, removeComponent, bindComponentProp,
  resetTextRatio, prefabId, syncComponent, getComponentOverrideStatus  
} = useInspectorLogic();

const hasComponent = computed(() => !!selectedEntity.value?.components?.TextRenderer);
const overridden = getComponentOverrideStatus('TextRenderer');

const textValue = bindComponentProp('TextRenderer', 'value');
const mode = bindComponentProp('TextRenderer', 'mode');
const fontSize = bindComponentProp('TextRenderer', 'fontSize');
const color = bindComponentProp('TextRenderer', 'color');
const align = bindComponentProp('TextRenderer', 'align');
const maxWidth = bindComponentProp('TextRenderer', 'maxWidth');
const maxLine = bindComponentProp('TextRenderer', 'maxLine');
const lineSpacing = bindComponentProp('TextRenderer', 'lineSpacing');
const letterSpacing = bindComponentProp('TextRenderer', 'letterSpacing');
const overflow = bindComponentProp('TextRenderer', 'overflow');
const rawOpacity = bindComponentProp('TextRenderer', 'opacity');
const autoFit = bindComponentProp('TextRenderer', 'autoFit');

const smoothing = bindComponentProp('TextRenderer', 'smoothing');
const bias = bindComponentProp('TextRenderer', 'bias');
const outlineWidth = bindComponentProp('TextRenderer', 'outlineWidth');
const outlineColor = bindComponentProp('TextRenderer', 'outlineColor');

const shadowEnabled = bindComponentProp('TextRenderer', 'shadowEnabled');
const shadowColor = bindComponentProp('TextRenderer', 'shadowColor');
const rawShadowOpacity = bindComponentProp('TextRenderer', 'shadowOpacity');
const shadowOffsetX = bindComponentProp('TextRenderer', 'shadowOffsetX');
const shadowOffsetY = bindComponentProp('TextRenderer', 'shadowOffsetY');
const shadowBlur = bindComponentProp('TextRenderer', 'shadowBlur');

const displayOpacity = computed({
  get: () => Math.round((rawOpacity.value ?? 1) * 100),
  set: (val) => { rawOpacity.value = parseFloat((val / 100).toFixed(2)); }
});

const displayShadowOpacity = computed({
  get: () => Math.round((rawShadowOpacity.value ?? 0.5) * 100),
  set: (val) => { rawShadowOpacity.value = parseFloat((val / 100).toFixed(2)); }
});

const alignOptions = [
    { label: 'Left', value: 'left', icon: AlignLeft },
    { label: 'Center', value: 'center', icon: AlignCenter },
    { label: 'Right', value: 'right', icon: AlignRight },
    { label: 'Justify', value: 'justify', icon: AlignJustify }
];
</script>