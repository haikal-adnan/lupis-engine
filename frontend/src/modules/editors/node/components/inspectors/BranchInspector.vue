<template>
  <PropertySection title="Branch Logic" :icon="GitBranch" v-if="node && node.type === 'logic_branch'">
    
    <div class="px-1 py-2 space-y-3">
      
      <div class="bg-secondary/20 p-2 rounded border border-border relative">
         <label class="text-[9px] text-green-400 uppercase font-bold block mb-1">If (Main)</label>
         <div class="text-[10px] text-muted-foreground italic flex items-center justify-between">
           <span>Evaluated first</span>
           <span v-if="isConnected('cond_0')" class="text-green-400 font-mono text-[9px] animate-pulse">LINKED</span>
         </div>
      </div>

      <div class="relative pl-3 border-l-2 border-dashed border-border space-y-3">
        
        <div v-for="(branch, index) in branches" :key="index" class="relative group animate-in fade-in slide-in-from-left-2">
          
          <div class="absolute -left-[19px] top-1/2 w-4 h-[2px] bg-border"></div>

          <div class="bg-secondary/20 p-2 rounded border border-border relative">
            
            <button 
              @click="removeBranch(index)"
              class="absolute -top-2 -right-2 bg-background border border-border p-1 rounded-full opacity-0 group-hover:opacity-100 hover:text-red-400 hover:border-red-400 transition-all z-20 shadow-sm"
            >
              <Trash2 class="w-3 h-3" />
            </button>

            <div v-if="branch === 'else_if'">
              <div class="flex items-center gap-1.5 mb-1">
                <label class="text-[9px] text-amber-400 uppercase font-bold">Else If</label>
                <span class="text-[10px] font-mono font-bold text-muted-foreground">({{ index + 1 }})</span>
              </div>
              <div class="text-[10px] text-muted-foreground italic flex items-center justify-between">
                 <span>Sequential check</span>
                 <span v-if="isConnected(`cond_${index + 1}`)" class="text-green-400 font-mono text-[9px] animate-pulse">LINKED</span>
              </div>
            </div>

            <div v-else>
              <label class="text-[9px] text-red-400 uppercase font-bold block mb-1">Else (Final)</label>
              <div class="text-[10px] text-muted-foreground italic">
                Fallback if no conditions met
              </div>
            </div>

          </div>
        </div>
      </div>

      <div class="flex gap-2 pt-2" v-if="!hasElse">
        <button @click="addElseIf" class="flex-1 py-2 border border-dashed border-amber-500/50 rounded text-xs text-amber-500 hover:bg-amber-500/10 flex items-center justify-center gap-1.5 font-bold">
          <Plus class="w-3.5 h-3.5" /> Else If
        </button>
        <button @click="addElse" class="flex-1 py-2 border border-dashed border-red-500/50 rounded text-xs text-red-500 hover:bg-red-500/10 flex items-center justify-center gap-1.5 font-bold">
          <Plus class="w-3.5 h-3.5" /> Else
        </button>
      </div>

    </div>

  </PropertySection>
</template>

<script setup>
import { computed } from 'vue';
import { GitBranch, Trash2, Plus } from 'lucide-vue-next';
import { useScriptStore } from '@/stores/useScriptStore.js';
import PropertySection from "@ui/display/PropertySection.vue";

const props = defineProps({ node: Object });
const store = useScriptStore();

const branches = computed(() => props.node.data?.branches || []);
const hasElse = computed(() => branches.value.includes('else'));

const isConnected = (inputId) => store.isInputConnected(props.node._id, inputId);

const syncStructure = (newBranches) => {
    const currentInputs = props.node.inputs || [];
    const currentOutputs = props.node.outputs || [];

    const execIn = currentInputs.find(i => i._id === 'exec_in') || { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' };
    const cond0 = { _id: 'cond_0', label: 'If Condition', dataType: 'boolean', color: '#4CAF50' };
    const out0 = { _id: 'out_0', label: 'If True', dataType: 'execution', color: '#4CAF50' };

    const finalInputs = [execIn, cond0];
    const finalOutputs = [out0];

    let containsElse = false;

    newBranches.forEach((bType, index) => {
        const orderNum = index + 1; // Penanda nomor urut
        if (bType === 'else_if') {
            finalInputs.push({ _id: `cond_${orderNum}`, label: `Else If Cond (${orderNum})`, dataType: 'boolean', color: '#4CAF50' });
            finalOutputs.push({ _id: `out_${orderNum}`, label: `Else If True (${orderNum})`, dataType: 'execution', color: '#4CAF50' });
        } else if (bType === 'else') {
            containsElse = true;
            finalOutputs.push({ _id: 'out_else', label: 'Else', dataType: 'execution', color: '#F44336' });
        }
    });

    if (!containsElse) {
        finalOutputs.push({ _id: 'out_false', label: 'False', dataType: 'execution', color: '#F44336' });
    }

    store.updateNodeInActive(props.node._id, {
        data: { ...props.node.data, branches: newBranches },
        inputs: finalInputs,
        outputs: finalOutputs
    });
};

const addElseIf = () => !hasElse.value && syncStructure([...branches.value, 'else_if']);
const addElse = () => !hasElse.value && syncStructure([...branches.value, 'else']);
const removeBranch = (index) => {
    const newBranches = [...branches.value];
    newBranches.splice(index, 1);
    syncStructure(newBranches);
};
</script>