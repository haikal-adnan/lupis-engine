<template>
  <PropertySection title="String Formats" :icon="FileText" v-if="node">
    
    <div class="px-2 py-3 border-b border-border space-y-3">
      <div class="flex justify-between items-center mb-1">
        <span class="text-[10px] text-muted-foreground uppercase font-bold">Format Templates</span>
      </div>

      <div class="space-y-3 pl-2 border-l-2 border-dashed border-border">
        <div v-for="(fmt, index) in formats" :key="'fmt_'+index" class="relative group mt-2">
          
          <div class="absolute -left-[14px] top-1/2 w-3 h-[2px] bg-border"></div>
          
          <div class="bg-secondary/20 p-2 pt-3 rounded border border-border relative">
            
            <div class="absolute -top-2 left-2 bg-background border border-border px-1.5 py-0.5 rounded text-[9px] font-black text-orange-400 z-10 shadow-sm">
              Output: Format {{ index + 1 }}
            </div>

            <button 
              v-if="formats.length > 1"
              @click="removeFormat(index)"
              class="absolute -top-2 -right-2 bg-background border border-border p-1 rounded-full opacity-0 group-hover:opacity-100 hover:text-red-400 hover:border-red-400 transition-all z-20 shadow-sm"
              title="Remove Format"
            >
              <Trash2 class="w-3 h-3" />
            </button>

            <BaseInput 
              :model-value="fmt" 
              @update:model-value="(v) => updateFormat(index, v)" 
              placeholder="Teks format {variabel}..." 
              class="w-full text-xs font-mono mt-1"
            />
          </div>
        </div>
      </div>

      <button 
        @click="addFormat"
        class="w-full py-1.5 mt-2 border border-dashed border-border rounded text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/50 flex items-center justify-center gap-1 transition-colors group"
      >
        <Plus class="w-3 h-3 group-hover:scale-110 transition-transform" />
        Add Format String
      </button>
    </div>

    <div class="px-2 py-3 space-y-3">
      <div class="flex justify-between items-center mb-1">
        <span class="text-[10px] text-muted-foreground uppercase font-bold">Shared Variables</span>
      </div>
      
      <div class="space-y-3 pl-2 border-l-2 border-dashed border-border">
        <div v-for="port in formatInputs" :key="port._id" class="relative group mt-2">
          
          <div class="absolute -left-[14px] top-1/2 w-3 h-[2px] bg-border"></div>
          
          <div class="bg-secondary/20 p-2 pt-3 rounded border border-border relative">
            
            <div class="absolute -top-2 left-2 bg-background border border-border px-1.5 py-0.5 rounded text-[9px] font-black text-blue-400 z-10 shadow-sm">
              Input: {{ port.label || 'var' }}
            </div>

            <button 
              @click="removeVariable(port._id)"
              class="absolute -top-2 -right-2 bg-background border border-border p-1 rounded-full opacity-0 group-hover:opacity-100 hover:text-red-400 hover:border-red-400 transition-all z-20 shadow-sm"
              title="Remove Variable"
            >
              <Trash2 class="w-3 h-3" />
            </button>

            <div class="mb-2 mt-1">
               <label class="text-[9px] text-muted-foreground uppercase font-bold block mb-1">Name</label>
               <BaseInput 
                 :model-value="port.label"
                 @update:model-value="(v) => renameVariable(port._id, v)"
                 placeholder="var_name"
                 class="h-7 text-xs w-full font-mono bg-background/50 focus:bg-background"
               />
            </div>

            <div class="relative overflow-hidden mt-2">
               <div v-if="isConnected(port._id)" class="absolute top-1 right-1 text-[9px] text-green-400 font-mono z-10 animate-pulse">
                 LINKED
               </div>

               <div :class="{ 'opacity-40 pointer-events-none filter grayscale': isConnected(port._id) }">
                 <label class="text-[9px] text-muted-foreground uppercase font-bold block mb-1">Default Value</label>
                 <BaseInput 
                   :model-value="getValue(port._id)" 
                   @update:model-value="(v) => updateValue(port._id, v)"
                   placeholder="Empty..."
                   class="h-7 text-xs w-full bg-background/50 focus:bg-background"
                 />
               </div>
            </div>

          </div>
        </div>

        <div v-if="formatInputs.length === 0" class="text-[10px] text-muted-foreground italic px-2 py-1">
          Belum ada variabel.
        </div>
      </div>
      
      <button 
        @click="addVariable"
        class="w-full py-1.5 mt-2 border border-dashed border-border rounded text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/50 flex items-center justify-center gap-1 transition-colors group"
      >
        <Plus class="w-3 h-3 group-hover:scale-110 transition-transform" />
        Add Variable
      </button>
    </div>

  </PropertySection>
</template>

<script setup>
import { computed } from 'vue';
import { FileText, Trash2, Plus } from 'lucide-vue-next';
import { useScriptStore } from '@/stores/useScriptStore.js';
import PropertySection from "@ui/display/PropertySection.vue";
import BaseInput from '@/commons/components/inputs/BaseInput.vue';

const props = defineProps({ node: Object });
const store = useScriptStore();

// Dukungan untuk multiple formats
const formats = computed(() => {
  if (props.node.data?.formats) return props.node.data.formats;
  if (props.node.data?.format) return [props.node.data.format];
  return [""];
});

const formatInputs = computed(() => props.node.inputs || []);
const isConnected = (inputId) => store.isInputConnected(props.node._id, inputId);
const getValue = (inputId) => props.node.data?.values?.[inputId] ?? '';

const updateValue = (inputId, newValue) => {
  if (isConnected(inputId)) return;
  const currentValues = props.node.data?.values || {};
  store.updateNodeInActive(props.node._id, {
    data: { ...props.node.data, values: { ...currentValues, [inputId]: newValue } }
  });
};

// Fungsi inti untuk sinkronisasi format dengan port input/output
// Ganti fungsi syncNodeData di <script setup> Anda dengan versi ini:

const syncNodeData = (newFormats) => {
  const currentInputs = [...(props.node.inputs || [])];
  const newOutputs = [];
  const foundVars = new Set();
  
  // 1. Kumpulkan semua variabel menggunakan matchAll (Lebih aman dari regex.exec loop)
  newFormats.forEach((fmt, index) => {
    const matches = [...fmt.matchAll(/{([^{}]+)}/g)];
    
    matches.forEach(match => {
      const rawVarName = match[1];
      const baseVarName = rawVarName.split('.')[0].trim(); 
      
      if (baseVarName) {
        foundVars.add(baseVarName);
      }
    });
    
    newOutputs.push({
      _id: `res_${index}`,
      label: `Format ${index + 1}`,
      dataType: 'any',
      color: '#FFB74D'
    });
  });

  // 2. Pertahankan port lama, buat port baru untuk variabel yang belum ada
  const newInputs = currentInputs.filter(inp => inp); 
  
  foundVars.forEach(varName => {
    const exists = newInputs.some(p => p.label === varName);
    if (!exists) {
      newInputs.push({
        _id: `var_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, // Dijamin unik
        label: varName,
        dataType: 'any', 
        color: '#ffffff'
      });
    }
  });

  // 3. Terapkan ke global state
  store.updateNodeInActive(props.node._id, {
    data: { ...props.node.data, formats: newFormats },
    inputs: newInputs,
    outputs: newOutputs
  });
};

const updateFormat = (index, newText) => {
  const newFormats = [...formats.value];
  newFormats[index] = newText;
  syncNodeData(newFormats);
};

const addFormat = () => {
  const newFormats = [...formats.value, ""];
  syncNodeData(newFormats);
};

const removeFormat = (index) => {
  const newFormats = [...formats.value];
  newFormats.splice(index, 1);
  syncNodeData(newFormats);
};

// Fungsi Input Manual (Tetap ada agar user bisa menamai variabel pelan-pelan)
const addVariable = () => {
  const currentInputs = [...(props.node.inputs || [])];
  currentInputs.push({
    _id: `var_${Date.now()}`,
    label: `var_${currentInputs.length + 1}`,
    dataType: 'any',
    color: '#ffffff'
  });
  store.updateNodeInActive(props.node._id, { inputs: currentInputs });
};

const removeVariable = (portId) => {
  store.removeNodePort(props.node._id, 'input', portId);
};

const renameVariable = (portId, newLabel) => {
  const currentInputs = [...(props.node.inputs || [])];
  const portIndex = currentInputs.findIndex(p => p._id === portId);
  if (portIndex > -1) {
    currentInputs[portIndex] = { ...currentInputs[portIndex], label: newLabel };
    store.updateNodeInActive(props.node._id, { inputs: currentInputs });
  }
};
</script>