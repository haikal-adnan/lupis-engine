<template>
  <PropertySection title="Shape Renderer" :icon="Square" v-if="hasComponent">
    
    <template #menu="{ close }">
      <div class="p-1 space-y-0.5">
        <button 
          @click="removeComponent('ShapeRenderer'); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors"
        >
          <Trash2 class="w-3 h-3 mr-2" />
          Remove Component
        </button>
      </div>
    </template>

    <div class="flex gap-2.5 mb-1 pt-1">
      
      <div class="w-[52px] h-[52px] shrink-0 bg-muted/20 border border-border rounded flex items-center justify-center p-2 relative overflow-hidden">
        <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(#444 1px, transparent 1px); background-size: 6px 6px;"></div>
        
        <svg viewBox="0 0 24 24" class="w-full h-full relative z-10 drop-shadow-sm transition-all duration-300">
          <circle v-if="type === 'circle'" cx="12" cy="12" r="10" :fill="color" />
          <rect v-else x="2" y="2" width="20" height="20" rx="4" :fill="color" />
        </svg>
      </div>

      <div class="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
        <PropertyRow label="Shape Type" :no-margin="true">
           <BaseSelect 
             v-model="type" 
             :options="shapeTypes" 
             class="w-full"
           />
        </PropertyRow>
      </div>
    </div>

    <PropertyRow label="Fill Color" :no-margin="true">
      <BaseColor 
        v-model="color" 
        :show-label="false"
      />
    </PropertyRow>

  </PropertySection>
</template>

<script setup>
import { computed } from "vue";
import { Square, Trash2 } from "lucide-vue-next"; 
import { useInspectorLogic } from "@/modules/properties/composables/useInspectorLogic.js"; 

// Atomic Components
import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseSelect from "@/commons/components/inputs/BaseSelect.vue";
import BaseColor from "@/commons/components/inputs/BaseColor.vue";

const { selectedEntity, removeComponent, bindComponentProp } = useInspectorLogic();
const hasComponent = computed(() => !!selectedEntity.value?.components?.ShapeRenderer);

// BINDING GRANULAR (Agar memicu action Pinia)
const type = bindComponentProp('ShapeRenderer', 'type');
const color = bindComponentProp('ShapeRenderer', 'color');

const shapeTypes = [
  { label: 'Rectangle', value: 'rectangle' },
  { label: 'Circle', value: 'circle' }
];
</script>