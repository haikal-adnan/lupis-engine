<template>
  <PropertySection title="Switch Options" :icon="GitPullRequest" v-if="node && node.type === 'logic_switch'">
    
    <div class="px-1 py-2 space-y-3">
      
      <div class="bg-background/80 p-2 rounded border border-border">
         <label class="text-[9px] text-muted-foreground uppercase font-bold block mb-1">Target Data Type</label>
         <BaseSelect 
            :model-value="dataType"
            @update:model-value="updateDataType"
            :options="typeOptions"
            class="h-7 text-xs w-full font-mono bg-secondary/20"
         />
         <div class="text-[10px] text-muted-foreground italic mt-1.5 flex justify-between">
           <span>Input Value</span>
           <span v-if="isConnected('value')" class="text-green-400 font-mono text-[9px] animate-pulse">LINKED</span>
           <span v-else class="text-destructive/80 font-mono text-[9px]">UNLINKED</span>
         </div>
      </div>

      <div class="relative pl-3 border-l-2 border-dashed border-border space-y-3">
        
        <div v-for="(caseValue, index) in cases" :key="index" class="relative group animate-in fade-in slide-in-from-left-2">
          
          <div class="absolute -left-[19px] top-1/2 w-4 h-[2px] bg-border"></div>

          <div class="bg-secondary/20 p-2 rounded border border-border relative">
            
            <button 
              @click="removeCase(index)"
              class="absolute -top-2 -right-2 bg-background border border-border p-1 rounded-full opacity-0 group-hover:opacity-100 hover:text-red-400 hover:border-red-400 transition-all z-20 shadow-sm"
              title="Remove Case"
            >
              <Trash2 class="w-3 h-3" />
            </button>

            <div class="flex flex-col gap-1.5">
              <div class="flex items-center gap-1.5">
                <label class="text-[9px] text-amber-400 uppercase font-bold">Case</label>
                <span class="text-[10px] font-mono font-bold text-muted-foreground">({{ index + 1 }})</span>
              </div>
              
              <BaseSelect 
                v-if="dataType === 'boolean'"
                :model-value="caseValue"
                @update:model-value="(v) => updateCase(index, v)"
                :options="boolOptions"
                class="h-7 text-xs w-full"
              />

              <BaseNumber 
                v-else-if="dataType === 'number'"
                :model-value="caseValue"
                @update:model-value="(v) => updateCase(index, v)"
                class="h-7 text-xs font-mono w-full"
              />

              <BaseInput 
                v-else
                :model-value="caseValue"
                @update:model-value="(v) => updateCase(index, v)"
                placeholder="String value..."
                class="h-7 text-xs font-mono w-full"
              />
            </div>

          </div>
        </div>
      </div>

      <div class="relative pl-3 border-l-2 border-dashed border-border mt-3 pt-1">
          <div class="absolute -left-[19px] top-1/2 w-4 h-[2px] bg-border"></div>
          <div class="bg-secondary/20 p-2 rounded border border-border relative">
              <label class="text-[9px] text-muted-foreground uppercase font-bold block mb-1">Default</label>
              <div class="text-[10px] text-muted-foreground italic">
                Fallback if no case matches
              </div>
          </div>
      </div>

      <div class="pt-3">
        <button 
          v-if="dataType !== 'boolean' || cases.length < 2" 
          @click="addCase" 
          class="w-full py-2 border border-dashed border-primary/50 rounded text-xs text-primary hover:bg-primary/10 flex items-center justify-center gap-1.5 font-bold transition-colors"
        >
          <Plus class="w-3.5 h-3.5" /> Add Case
        </button>
        <div v-else class="text-center text-[10px] text-muted-foreground italic">
          Boolean switch is limited to True/False.
        </div>
      </div>

    </div>

  </PropertySection>
</template>

<script setup>
import { computed } from 'vue';
import { GitPullRequest, Trash2, Plus } from 'lucide-vue-next';
import { useScriptStore } from '@/stores/useScriptStore.js';
import PropertySection from "@ui/display/PropertySection.vue";
import BaseInput from '@/commons/components/inputs/BaseInput.vue';
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue';
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';

const props = defineProps({ node: Object });
const store = useScriptStore();

const cases = computed(() => props.node.data?.cases || []);
const dataType = computed(() => props.node.data?.dataType || 'string');

const isConnected = (inputId) => store.isInputConnected(props.node._id, inputId);

const typeOptions = [
  { label: 'String', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' }
];

const boolOptions = [
  { label: 'True', value: true },
  { label: 'False', value: false }
];

// Warna port/kabel untuk merepresentasikan tipe data
const getTypeColor = (type) => {
    switch(type) {
        case 'number': return '#B2FF59'; // Hijau muda
        case 'boolean': return '#4CAF50'; // Hijau tua
        default: return '#03A9F4'; // Biru (String)
    }
};

const syncStructure = (newCases, newDataType) => {
    const currentInputs = props.node.inputs || [];
    
    // Perbarui pin Value to Check sesuai tipe data baru
    const valColor = getTypeColor(newDataType);
    
    const execIn = currentInputs.find(i => i._id === 'exec_in') || { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' };
    const valIn = { _id: 'value', label: 'Value', dataType: newDataType, color: valColor };
    
    const finalInputs = [execIn, valIn];
    const finalOutputs = [];

    newCases.forEach((val, index) => {
        let displayLabel = `Case (${val})`;
        if (newDataType === 'string') displayLabel = `Case "${val}"`;
        if (newDataType === 'boolean') displayLabel = `Case ${val ? 'True' : 'False'}`;

        finalOutputs.push({ 
            _id: `out_case_${index}`, 
            label: displayLabel, 
            dataType: 'execution', 
            color: '#FFB300' 
        });
    });

    finalOutputs.push({ _id: 'out_default', label: 'Default', dataType: 'execution', color: '#9E9E9E' });

    store.updateNodeInActive(props.node._id, {
        data: { ...props.node.data, cases: newCases, dataType: newDataType },
        inputs: finalInputs,
        outputs: finalOutputs
    });
};

const updateDataType = (newType) => {
    if (newType === dataType.value) return;

    // Jika ganti tipe, reset cases agar tipe data lama tidak bikin bug
    let newCases = [];
    if (newType === 'boolean') {
        newCases = [true, false]; // Default untuk boolean langsung terisi 2
    } else if (newType === 'number') {
        newCases = [0, 1];
    } else {
        newCases = ['case_A', 'case_B'];
    }

    syncStructure(newCases, newType);
};

const updateCase = (index, newValue) => {
    const newCases = [...cases.value];
    newCases[index] = newValue;
    syncStructure(newCases, dataType.value);
};

const addCase = () => {
    if (dataType.value === 'boolean' && cases.value.length >= 2) return;
    
    const defaultValue = dataType.value === 'number' ? 0 : '';
    syncStructure([...cases.value, defaultValue], dataType.value);
};

const removeCase = (index) => {
    const newCases = [...cases.value];
    newCases.splice(index, 1);
    syncStructure(newCases, dataType.value);
};
</script>