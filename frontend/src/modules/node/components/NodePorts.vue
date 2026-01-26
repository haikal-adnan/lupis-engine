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
                    @click="removeDynamicInput(port._id)"
                    class="opacity-30 group-hover:opacity-100 transition-opacity w-6 h-6 shrink-0"
                    tooltip="Remove Input"
                    variant="ghost" 
                    size="xs"
                >
                    <Trash2 class="w-3.5 h-3.5 text-muted-foreground hover:text-red-400" />
                </IconButton>
            </div>

            <div v-if="selectedNode.inputs.length === 0" class="px-2 text-[10px] text-muted-foreground italic">
                No inputs.
            </div>

            <button 
                v-if="selectedNode.allowDynamicInputs"
                @click="addDynamicInput"
                class="w-full mt-2 flex items-center justify-center gap-1 py-1.5 text-[10px] border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 rounded transition-colors"
            >
                <Plus class="w-3 h-3" />
                <span>Add Input Port</span>
            </button>

        </div>
    </div>

    <div>
        <div class="px-2 mb-1 text-[10px] font-bold text-muted-foreground uppercase">Outputs</div>
        <div class="space-y-1">
            <div 
                v-for="(port, idx) in selectedNode.outputs" 
                :key="port._id || idx"
                class="flex items-center gap-2 px-2 py-1 bg-secondary/20 border border-border rounded text-xs"
            >
                <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: getPortColor(port) }"></div>
                <span class="flex-1 truncate font-mono">{{ port.label || 'Output' }}</span>
                <span class="text-[9px] text-muted-foreground bg-muted px-1 rounded">{{ port.dataType || port.type }}</span>
            </div>
             <div v-if="selectedNode.outputs.length === 0" class="px-2 text-[10px] text-muted-foreground italic">
                No outputs.
            </div>
        </div>
    </div>

  </PropertySection>
</template>

<script setup>
import { Network, Trash2, Plus } from 'lucide-vue-next';
import { useNodeLogic } from '@/modules/node/composables/useNodeLogic.js';
import PropertySection from "@ui/display/PropertySection.vue";
import IconButton from '@/commons/components/buttons/IconButton.vue';

const { selectedNode, addDynamicInput, removeDynamicInput } = useNodeLogic();

function getPortColor(port) {
    if (port.color) return port.color;
    
    const type = port.dataType || port.type || '';
    
    switch(type.toLowerCase()) {
        case 'execution': return '#ffffff';
        case 'boolean': return '#f44336';
        case 'string': return '#9c27b0';
        case 'number': return '#00e676';
        case 'vector': return '#ffc107';
        case 'any': return '#fff'; 
        default: return '#777777';
    }
}
</script>