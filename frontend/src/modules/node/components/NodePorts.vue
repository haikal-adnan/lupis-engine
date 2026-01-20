<template>
  <PropertySection title="Ports Configuration" :icon="Network" v-if="selectedNode">
    
    <div class="mb-3">
        <div class="px-2 mb-1 text-[10px] font-bold text-muted-foreground uppercase">Inputs</div>
        <div class="space-y-1">
            <div 
                v-for="(port, idx) in selectedNode.inputs" 
                :key="port._id || idx"
                class="flex items-center gap-2 px-2 py-1 bg-secondary/20 border border-border/50 rounded text-xs"
            >
                <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: getPortColor(port) }"></div>
                <span class="flex-1 truncate font-mono">{{ port.label || 'Input' }}</span>
                <span class="text-[9px] text-muted-foreground bg-muted px-1 rounded">{{ port.dataType }}</span>
            </div>
            <div v-if="selectedNode.inputs.length === 0" class="px-2 text-[10px] text-muted-foreground italic">
                No inputs.
            </div>
        </div>
    </div>

    <div>
        <div class="px-2 mb-1 text-[10px] font-bold text-muted-foreground uppercase">Outputs</div>
        <div class="space-y-1">
            <div 
                v-for="(port, idx) in selectedNode.outputs" 
                :key="port._id || idx"
                class="flex items-center gap-2 px-2 py-1 bg-secondary/20 border border-border/50 rounded text-xs"
            >
                <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: getPortColor(port) }"></div>
                <span class="flex-1 truncate font-mono">{{ port.label || 'Output' }}</span>
                <span class="text-[9px] text-muted-foreground bg-muted px-1 rounded">{{ port.dataType }}</span>
            </div>
             <div v-if="selectedNode.outputs.length === 0" class="px-2 text-[10px] text-muted-foreground italic">
                No outputs.
            </div>
        </div>
    </div>

  </PropertySection>
</template>

<script setup>
import { Network } from 'lucide-vue-next';
import { useNodeLogic } from '@/modules/node/composables/useNodeLogic.js';
import PropertySection from "@ui/display/PropertySection.vue";

const { selectedNode } = useNodeLogic();

function getPortColor(port) {
    // Bisa ambil dari port.color atau mapping berdasarkan dataType
    if (port.color) return port.color;
    
    switch(port.dataType) {
        case 'execution': return '#ffffff';
        case 'boolean': return '#f44336';
        case 'string': return '#9c27b0';
        case 'number': return '#00e676';
        case 'vector': return '#ffc107';
        default: return '#777777';
    }
}
</script>