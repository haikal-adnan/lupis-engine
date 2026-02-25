<template>
  <PropertySection title="Movement" :icon="Footprints" v-if="node">
    
    <div class="px-1 py-2">
      <div class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
        <Move class="w-3 h-3 text-primary" />
        Velocity Delta
      </div>

      <div class="grid grid-cols-2 gap-3">
          
          <div class="bg-secondary/20 p-2 rounded border border-border relative overflow-hidden group">
             <div v-if="isConnected('vel_x')" 
                  class="absolute top-2 right-2 text-[9px] text-green-400 font-mono z-10 animate-pulse">
               LINKED
             </div>

             <div :class="{ 'opacity-40 pointer-events-none filter grayscale': isConnected('vel_x') }">
               <label class="text-[9px] text-muted-foreground uppercase font-bold block mb-1">X Velocity</label>
               <BaseNumber 
                 :model-value="velXValue" 
                 @update:model-value="(v) => updateData('vel_x', v)"
                 class="h-8 text-xs font-mono w-full text-center bg-background/50 focus:bg-background transition-colors"
               />
             </div>
          </div>

          <div class="bg-secondary/20 p-2 rounded border border-border relative overflow-hidden group">
             <div v-if="isConnected('vel_y')" 
                  class="absolute top-2 right-2 text-[9px] text-green-400 font-mono z-10 animate-pulse">
               LINKED
             </div>
             
             <div :class="{ 'opacity-40 pointer-events-none filter grayscale': isConnected('vel_y') }">
               <label class="text-[9px] text-muted-foreground uppercase font-bold block mb-1">Y Velocity</label>
               <BaseNumber 
                 :model-value="velYValue" 
                 @update:model-value="(v) => updateData('vel_y', v)"
                 class="h-8 text-xs font-mono w-full text-center bg-background/50 focus:bg-background transition-colors"
               />
             </div>
          </div>

      </div>
    </div>

  </PropertySection>
</template>

<script setup>
import { computed } from 'vue';
import { Footprints, Move, Info } from 'lucide-vue-next';
import { useScriptStore } from '@/stores/useScriptStore.js';

import PropertySection from "@ui/display/PropertySection.vue";
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';

const props = defineProps({ node: Object });
const store = useScriptStore();


const velXValue = computed(() => props.node.data?.vel_x ?? 0);
const velYValue = computed(() => props.node.data?.vel_y ?? 0);

const isConnected = (inputId) => {
    return store.isInputConnected(props.node._id, inputId); 
};

const updateData = (field, value) => {
  if (isConnected(field)) return;

  const newData = { ...props.node.data, [field]: value };

  const currentInputs = props.node.inputs || [];
  const newInputs = currentInputs.map(input => {
      if (input._id === field) {
          return { ...input, value: value };
      }
      return input;
  });

  store.updateNodeInActive(props.node._id, {
    data: newData,
    inputs: newInputs
  });
};
</script>