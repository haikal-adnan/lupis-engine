<template>
  <PropertySection title="Movement Settings" :icon="Footprints" v-if="node">
    
    <div class="pt-2 pb-1 mt-1">
      <div class="px-1 mb-2 flex items-center justify-between">
        <div class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert class="w-3 h-3" />
          Solid Collision
        </div>

        <span v-if="isConnected('sweep')" class="text-[9px] text-yellow-500 font-mono bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
          LINKED
        </span>
      </div>

      <div 
        class="px-1 transition-all duration-300"
        :class="{ 'opacity-40 pointer-events-none filter grayscale': isConnected('sweep') }"
      >
        <BaseButton 
          :active="sweepValue"
          @click="updateData('sweep', !sweepValue)"
          class="w-full h-7 text-xs gap-2 justify-center px-3 border border-border/50 bg-background/50 hover:bg-accent transition-all"
          ghost
        >

          <span :class="sweepValue ? 'text-foreground font-medium' : 'text-muted-foreground'">
            {{ sweepValue ? 'Enabled (Physics)' : 'Disabled (Ghost)' }}
          </span>
        </BaseButton>
      </div>

      <div class="px-1 mt-2">
        <p class="text-[9px] text-muted-foreground opacity-70 leading-tight">
          <span v-if="isConnected('sweep')">Controlled by <b>Node Connection</b>.</span>
          <span v-else-if="sweepValue">Object will <b class="text-foreground">stop & slide</b> against walls.</span>
          <span v-else>Object will <b class="text-foreground">pass through</b> walls.</span>
        </p>
      </div>
    </div>

    <div class="border-t border-border mt-3 pt-3 px-1">
      <div class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
        <Move class="w-3 h-3" />
        Translation Delta
      </div>

      <div class="grid grid-cols-2 gap-2">
          
          <div class="bg-secondary/20 p-2 rounded border border-border relative overflow-hidden">
             
             <div v-if="isConnected('dx')" class="absolute top-2 right-2 text-[9px] text-green-400 font-mono z-10">
               LINKED
             </div>

             <div :class="{ 'opacity-40 pointer-events-none filter grayscale': isConnected('dx') }">
               <label class="text-[9px] text-muted-foreground uppercase font-bold block mb-1">Delta X</label>
               <BaseNumber 
                 :model-value="dxValue" 
                 @update:model-value="(v) => updateData('dx', v)"
                 class="h-7 text-xs font-mono w-full text-center"
               />
             </div>
          </div>

          <div class="bg-secondary/20 p-2 rounded border border-border relative overflow-hidden">
             
             <div v-if="isConnected('dy')" class="absolute top-2 right-2 text-[9px] text-green-400 font-mono z-10">
               LINKED
             </div>
             
             <div :class="{ 'opacity-40 pointer-events-none filter grayscale': isConnected('dy') }">
               <label class="text-[9px] text-muted-foreground uppercase font-bold block mb-1">Delta Y</label>
               <BaseNumber 
                 :model-value="dyValue" 
                 @update:model-value="(v) => updateData('dy', v)"
                 class="h-7 text-xs font-mono w-full text-center"
               />
             </div>
          </div>

      </div>
    </div>

  </PropertySection>
</template>

<script setup>
import { computed } from 'vue';
import { Footprints, ShieldAlert, Move } from 'lucide-vue-next';
import { useScriptStore } from '@/stores/useScriptStore.js';

// Atomic Components
import PropertySection from "@ui/display/PropertySection.vue";
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseButton from '@/commons/components/buttons/BaseButton.vue';

const props = defineProps({ node: Object });
const store = useScriptStore();

// --- GETTERS ---
const dxValue = computed(() => props.node.data?.dx ?? 0);
const dyValue = computed(() => props.node.data?.dy ?? 0);
const sweepValue = computed(() => props.node.data?.sweep ?? true);

// --- HELPER: CHECK CONNECTION ---
const isConnected = (inputId) => {
    return store.isInputConnected(props.node._id, inputId); 
};

// --- UPDATE LOGIC ---
const updateData = (field, value) => {
  // Cegah update jika terhubung kabel (Logic Safety)
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