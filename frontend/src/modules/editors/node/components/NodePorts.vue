<template>
  <PropertySection title="Ports Configuration" :icon="Network" v-if="selectedNode">
    
    <div class="mb-3">
        <div class="px-2 mb-1 flex justify-between items-center">
             <span class="text-[10px] font-bold text-muted-foreground uppercase">Inputs</span>
             <span v-if="selectedNode.allowDynamicInputs" class="text-[9px] text-blue-400 bg-blue-400/10 px-1 rounded">Dynamic</span>
        </div>

        <div class="space-y-1">
            <div 
                v-for="(port, idx) in selectedNode.inputs" 
                :key="port._id || idx"
                class="group flex items-center gap-1 w-full" 
            >
                <div class="flex-1 flex items-center gap-2 px-2 py-1 bg-secondary/20 border border-border rounded text-xs hover:bg-secondary/30 transition-colors">
                    <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: getPortColor(port) }"></div>
                    <span class="flex-1 truncate font-mono">{{ port.label || 'Input' }}</span>
                    <span class="text-[9px] text-muted-foreground bg-muted px-1 rounded shrink-0">{{ port.dataType || port.type }}</span>
                </div>

                <IconButton 
                    v-if="selectedNode.allowDynamicInputs"
                    @click="removeDynamicInput(port._id, 'input')"
                    class="opacity-30 group-hover:opacity-100 transition-opacity w-6 h-6 shrink-0"
                    variant="ghost" 
                    size="xs"
                    tooltip="Remove Input"
                >
                    <Trash2 class="w-3.5 h-3.5 text-muted-foreground hover:text-red-400" />
                </IconButton>
            </div>

            <div v-if="selectedNode.inputs.length === 0" class="px-2 text-[10px] text-muted-foreground italic">
                No inputs.
            </div>

            <div v-if="selectedNode.allowDynamicInputs" class="mt-2">
                
                <div v-if="activeDropdownTarget === 'input'" class="animate-in fade-in slide-in-from-top-1 bg-secondary/20 p-2 rounded border border-dashed border-border">
                    <div class="text-[10px] text-muted-foreground mb-1.5 ml-1">Select Property:</div>
                    <BaseSelect 
                        placeholder="Choose..." 
                        :options="availableOptions"
                        :model-value="null"
                        @update:model-value="addFromDropdown"
                    />
                    <button 
                        @click="activeDropdownTarget = null" 
                        class="text-[10px] text-muted-foreground w-full text-center mt-2 hover:text-foreground underline decoration-dashed underline-offset-2"
                    >
                        Cancel
                    </button>
                </div>

                <button 
                    v-else
                    @click="handleAddPort('input')"
                    class="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 rounded transition-colors group"
                >
                    <Plus class="w-3 h-3 group-hover:scale-110 transition-transform" />
                    <span>Add Input Port</span>
                </button>
            </div>

        </div>
    </div>

    <div>
        <div class="px-2 mb-1 flex justify-between items-center">
            <span class="text-[10px] font-bold text-muted-foreground uppercase">Outputs</span>
            <span v-if="selectedNode.allowDynamicOutputs" class="text-[9px] text-blue-400 bg-blue-400/10 px-1 rounded">Dynamic</span>
        </div>
        
        <div class="space-y-1">
            <div 
               v-for="(port, idx) in selectedNode.outputs" 
               :key="port._id || idx"
               class="group flex items-center gap-1 w-full"
            >
                <div class="flex-1 flex items-center gap-2 px-2 py-1 bg-secondary/20 border border-border rounded text-xs hover:bg-secondary/30 transition-colors">
                    <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: getPortColor(port) }"></div>
                    <span class="flex-1 truncate font-mono">{{ port.label || 'Output' }}</span>
                    <span class="text-[9px] text-muted-foreground bg-muted px-1 rounded shrink-0">{{ port.dataType || port.type }}</span>
                </div>
                
                <IconButton 
                    v-if="selectedNode.allowDynamicOutputs"
                    @click="removeDynamicInput(port._id, 'output')"
                    class="opacity-30 group-hover:opacity-100 transition-opacity w-6 h-6 shrink-0"
                    variant="ghost" 
                    size="xs"
                    tooltip="Remove Output"
                >
                    <Trash2 class="w-3.5 h-3.5 text-muted-foreground hover:text-red-400" />
                </IconButton>
            </div>

             <div v-if="selectedNode.outputs.length === 0" class="px-2 text-[10px] text-muted-foreground italic">
                No outputs.
            </div>
            
            <div v-if="selectedNode.allowDynamicOutputs" class="mt-2">
                 
                 <div v-if="activeDropdownTarget === 'output'" class="animate-in fade-in slide-in-from-top-1 bg-secondary/20 p-2 rounded border border-dashed border-border">
                    <div class="text-[10px] text-muted-foreground mb-1.5 ml-1">Select Property:</div>
                    <BaseSelect 
                        placeholder="Choose..." 
                        :options="availableOptions"
                        :model-value="null"
                        @update:model-value="addFromDropdown"
                    />
                    <button 
                        @click="activeDropdownTarget = null" 
                        class="text-[10px] text-muted-foreground w-full text-center mt-2 hover:text-foreground underline decoration-dashed underline-offset-2"
                    >
                        Cancel
                    </button>
                </div>

                <button 
                    v-else
                    @click="handleAddPort('output')"
                    class="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 rounded transition-colors group"
                >
                    <Plus class="w-3 h-3 group-hover:scale-110 transition-transform" />
                    <span>Add Output Port</span>
                </button>
            </div>
        </div>
    </div>

  </PropertySection>
</template>

<script setup>
import { Network, Trash2, Plus } from 'lucide-vue-next';
import { useNodeLogic } from '@editors/node/composables/useNodeLogic.js';
import PropertySection from "@ui/display/PropertySection.vue";
import IconButton from '@/commons/components/buttons/IconButton.vue';
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue';

const { 
  selectedNode, 
  activeDropdownTarget,
  availableOptions,   
  handleAddPort,   
  addFromDropdown,   
  removeDynamicInput 
} = useNodeLogic();

function getPortColor(port) {
   if (port.color) return port.color;
   
   const type = (port.dataType || port.type || 'any').toLowerCase();
   
   switch(type) {
       case 'execution': return '#ffffff'; 
       case 'boolean':   return '#f44336';
       case 'string':    return '#9c27b0'; 
       case 'number':    return '#00e676'; 
       case 'list':      return '#00bcd4'; 
       case 'map':       return '#ff9800'; 
       case 'any':       return '#9ca3af'; 
       default:          return '#777777';
   }
}
</script>