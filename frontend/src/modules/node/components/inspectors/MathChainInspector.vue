<template>
  <PropertySection title="Math Chain" :icon="Calculator" v-if="node">
    
    <div class="px-1 py-2 space-y-3">
      
      <div class="bg-secondary/20 p-2 rounded border border-border relative overflow-hidden group">
         <div v-if="isConnected('v0')" 
              class="absolute top-2 right-2 text-[9px] text-green-400 font-mono z-10 animate-pulse">
           LINKED
         </div>

         <div :class="{ 'opacity-40 pointer-events-none filter grayscale': isConnected('v0') }">
           <label class="text-[9px] text-muted-foreground uppercase font-bold block mb-1">
             Value 1
           </label>
           <BaseNumber 
             :model-value="getValue('v0')" 
             @update:model-value="(v) => updateValue('v0', v)"
             class="h-8 text-xs font-mono w-full text-center bg-background/50 focus:bg-background transition-colors"
           />
         </div>
      </div>

      <div class="relative pl-3 border-l-2 border-dashed border-border space-y-3">
        
        <div v-for="(op, index) in ops" :key="index" class="relative group animate-in fade-in slide-in-from-left-2">
          
          <div class="absolute -left-[19px] top-1/2 w-4 h-[2px] bg-border"></div>

          <div class="bg-secondary/20 p-2 rounded border border-border relative">
            
            <button 
              @click="removeStep(index)"
              class="absolute -top-2 -right-2 bg-background border border-border p-1 rounded-full opacity-0 group-hover:opacity-100 hover:text-red-400 hover:border-red-400 transition-all z-20 shadow-sm"
              title="Remove Step"
            >
              <Trash2 class="w-3 h-3" />
            </button>

            <div class="mb-2">
              <label class="text-[9px] text-muted-foreground uppercase font-bold block mb-1">Operation</label>
              <BaseSelect 
                :model-value="op"
                @update:model-value="(v) => updateOp(index, v)"
                :options="operatorOptions"
                height="1.75rem"
                class="w-full font-mono text-xs"
              />
            </div>

            <div class="relative overflow-hidden">
               <div v-if="isConnected(`v${index + 1}`)" 
                    class="absolute top-1 right-1 text-[9px] text-green-400 font-mono z-10 animate-pulse">
                 LINKED
               </div>

               <div :class="{ 'opacity-40 pointer-events-none filter grayscale': isConnected(`v${index + 1}`) }">
                 <label class="text-[9px] text-muted-foreground uppercase font-bold block mb-1">
                   Value {{ index + 2 }}
                 </label>
                 <BaseNumber 
                   :model-value="getValue(`v${index + 1}`)" 
                   @update:model-value="(v) => updateValue(`v${index + 1}`, v)"
                   class="h-7 text-xs font-mono w-full text-center bg-background/50 focus:bg-background"
                 />
               </div>
            </div>

          </div>
        </div>

      </div>

      <button 
        @click="addStep"
        class="w-full py-2 border border-dashed border-border rounded text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 flex items-center justify-center gap-2 transition-colors group"
      >
        <Plus class="w-3 h-3 group-hover:scale-110 transition-transform" />
        Add Calculation Step
      </button>

    </div>

  </PropertySection>
</template>

<script setup>
import { computed } from 'vue';
import { Calculator, Trash2, Plus } from 'lucide-vue-next';
import { useScriptStore } from '@/stores/useScriptStore.js';
import PropertySection from "@ui/display/PropertySection.vue";
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue';

const props = defineProps({ node: Object });
const store = useScriptStore();

const operatorOptions = [
  { label: 'Add (+)', value: 'add' },
  { label: 'Subtract (-)', value: 'subtract' },
  { label: 'Multiply (×)', value: 'multiply' },
  { label: 'Divide (÷)', value: 'divide' },
  { label: 'Modulo (%)', value: 'modulo' },
];

const ops = computed(() => props.node.data?.ops || []);

const isConnected = (inputId) => store.isInputConnected(props.node._id, inputId);

const getValue = (inputId) => {
    const input = props.node.inputs?.find(i => i._id === inputId);
    return input?.value ?? 0;
};

const updateValue = (inputId, newValue) => {
  if (isConnected(inputId)) return;
  const currentInputs = props.node.inputs || [];
  const newInputs = currentInputs.map(input => {
      if (input._id === inputId) {
          return { ...input, value: newValue };
      }
      return input;
  });
  store.updateNodeInActive(props.node._id, { inputs: newInputs });
};

const updateOp = (index, newOp) => {
  const newOps = [...ops.value];
  newOps[index] = newOp;
  store.updateNodeInActive(props.node._id, { data: { ...props.node.data, ops: newOps } });
};

const syncStructure = (newOps) => {
    const currentInputs = props.node.inputs || [];
    
    const v0 = currentInputs.find(i => i._id === 'v0') || { 
        _id: 'v0', label: 'Val 1', dataType: 'number', color: '#B2FF59', value: 0 
    };
    if(v0.label !== 'Val 1') v0.label = 'Val 1';

    const nextInputs = newOps.map((_, index) => {
        const id = `v${index + 1}`;
        const existing = currentInputs.find(i => i._id === id);
        
        const correctLabel = `Val ${index + 2}`;

        if (existing) {
             existing.label = correctLabel; 
             return existing;
        }
        
        return {
            _id: id,
            label: correctLabel,
            dataType: 'number',
            color: '#B2FF59',
            value: 0
        };
    });

    const execIn = currentInputs.find(i => i._id === 'in') || { _id: 'in', label: 'In', dataType: 'execution', color: '#fff' };
    
    const finalInputs = [execIn, v0, ...nextInputs];

    store.updateNodeInActive(props.node._id, {
        data: { ...props.node.data, ops: newOps },
        inputs: finalInputs
    });
};

const addStep = () => {
    const newOps = [...ops.value, 'add'];
    syncStructure(newOps);
};

const removeStep = (index) => {
    const newOps = [...ops.value];
    newOps.splice(index, 1);
    syncStructure(newOps);
};
</script>