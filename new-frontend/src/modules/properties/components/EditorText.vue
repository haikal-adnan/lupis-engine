<template>
  <PropertySection title="Text Renderer" :icon="Type" v-if="hasComponent">
    
    <template #menu="{ close }">
      <div class="p-1 space-y-0.5">
        <button 
          @click="removeComponent('TextRenderer'); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors"
        >
          <Trash2 class="w-3 h-3 mr-2" />
          Remove Component
        </button>
      </div>
    </template>

    <div class="flex gap-2.5 mb-2 pt-1 items-center">
      <div class="w-[52px] h-[52px] shrink-0 bg-muted/20 border border-border rounded flex items-center justify-center overflow-hidden relative group">
         <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: radial-gradient(#444 1px, transparent 1px); background-size: 4px 4px;"></div>
         <span class="text-sm font-bold select-none" :style="{ color: color }">Aa</span>
      </div>

      <PropertyRow label="Font" :no-margin="true">
        <button type="button" class="group flex items-center w-full relative text-left bg-secondary/40 border border-border rounded-md h-7 overflow-hidden">
          <span class="flex-1 px-2 text-[11px] font-mono text-muted-foreground/90 truncate">Inter</span>
          <div class="px-2 h-full flex items-center justify-center border-l border-border bg-muted/10">
            <FolderSearch class="w-3 h-3" />
          </div>
        </button>
      </PropertyRow>
    </div>

    <PropertyRow label="Text">
      <BaseTextArea
        v-model="textValue"
        placeholder="Type something..."
        height="auto"
        minHeight="64px"
        resize="vertical"
        class="w-full"
      />
    </PropertyRow>

    <PropertyRow label="Font Size">
      <BaseNumber v-model="fontSize" prefix="PX" :min="1" class="w-full" />
    </PropertyRow>

    <PropertyRow label="Text Color">
      <BaseColor v-model="color" :show-label="true" height="2rem" />
    </PropertyRow>

    <PropertyRow label="Alignment">
      <div class="flex bg-secondary/30 rounded-md border border-border w-full">
        <BaseButton 
          v-for="opt in alignOptions" 
          :key="opt.value"
          ghost
          :active="align === opt.value"
          @click="align = opt.value"
          class="flex-1 h-7 !rounded-[3px]"
        >
          <component :is="opt.icon" class="w-3.5 h-3.5" />
        </BaseButton>
      </div>
    </PropertyRow>

  </PropertySection>
</template>

<script setup>
import { computed } from "vue";
import { Type, Trash2, AlignLeft, AlignCenter, AlignRight, FolderSearch } from "lucide-vue-next"; 
import { useInspectorLogic } from "@/modules/properties/composables/useInspectorLogic.js"; 

// Components
import PropertySection from "@/modules/properties/parts/PropertySection.vue";
import PropertyRow from "@/modules/properties/parts/PropertyRow.vue";
import BaseNumber from "@/commons/components/inputs/BaseNumber.vue";
import BaseTextArea from "@/commons/components/inputs/BaseTextArea.vue";
import BaseColor from "@/commons/components/inputs/BaseColor.vue";
import BaseButton from "@/commons/components/buttons/BaseButton.vue";

const { selectedEntity, removeComponent, bindComponentProp } = useInspectorLogic();
const hasComponent = computed(() => !!selectedEntity.value?.components?.TextRenderer);

// BINDINGS
const textValue = bindComponentProp('TextRenderer', 'value');
const fontSize = bindComponentProp('TextRenderer', 'fontSize');
const color = bindComponentProp('TextRenderer', 'color');
const align = bindComponentProp('TextRenderer', 'align');

const alignOptions = [
    { label: 'Left', value: 'left', icon: AlignLeft },
    { label: 'Center', value: 'center', icon: AlignCenter },
    { label: 'Right', value: 'right', icon: AlignRight }
];
</script>