<template>
  <PropertySection title="Ports Configuration" :icon="Network" v-if="selectedNode" data-testid="node-inspector-ports-section">
    <!-- INPUT PORTS -->
    <div class="mb-3">
      <div class="px-2 mb-1 flex justify-between items-center">
        <span class="text-[10px] font-bold text-muted-foreground uppercase">Inputs</span>
        <span v-if="selectedNode.allowDynamicInputs" class="text-[9px] text-blue-400 bg-blue-400/10 px-1 rounded">Dynamic</span>
      </div>

      <div class="space-y-1">
        <div 
          v-for="(port, idx) in selectedNode.inputs" 
          :key="port.id || idx"
          class="group flex items-center gap-1 w-full" 
          data-testid="node-inspector-input-port-row"
          :data-port-id="port.id"
        >
          <div class="flex-1 flex items-center gap-2 px-2 py-1 bg-secondary/20 border border-border rounded text-xs hover:bg-secondary/30 transition-colors">
            <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: getPortColor(port) }"></div>
            
            <input 
              :value="port.label"
              @change="updatePortLabel(port.id, 'input', $event.target.value)"
              placeholder="Input"
              maxlength="20"
              spellcheck="false"
              class="flex-1 w-full min-w-0 bg-transparent outline-none font-mono text-xs truncate focus:bg-background focus:ring-1 focus:ring-border rounded px-1 py-0.5 -ml-1 transition-all"
              data-testid="node-inspector-input-port-label-input"
            />

            <span class="text-[9px] text-muted-foreground bg-muted px-1 rounded shrink-0">{{ port.dataType || port.type }}</span>
          </div>

          <IconButton 
            v-if="selectedNode.allowDynamicInputs"
            @click="removeDynamicInput(port.id, 'input')"
            class="opacity-30 group-hover:opacity-100 transition-opacity w-6 h-6 shrink-0"
            variant="ghost" 
            size="xs"
            tooltip="Remove Input"
            data-testid="node-inspector-input-port-remove-btn"
          >
            <Trash2 class="w-3.5 h-3.5 text-muted-foreground hover:text-red-400" />
          </IconButton>
        </div>

        <div v-if="selectedNode.inputs.length === 0" class="px-2 text-[10px] text-muted-foreground italic" data-testid="node-inspector-no-inputs-msg">
          No inputs.
        </div>

        <div v-if="selectedNode.allowDynamicInputs" class="mt-2">
          <div v-if="activeDropdownTarget === 'input'" class="animate-in fade-in slide-in-from-top-1 bg-secondary/20 p-2 rounded border border-dashed border-border" data-testid="node-inspector-add-input-port-dropdown-container">
            <div class="text-[10px] text-muted-foreground mb-1.5 ml-1">Select Property:</div>
            <BaseSelect 
              placeholder="Choose..." 
              :options="availableOptions"
              :model-value="null"
              @update:model-value="addFromDropdown"
              data-testid="node-inspector-add-input-port-select"
            />
            <button 
              @click="activeDropdownTarget = null" 
              class="text-[10px] text-muted-foreground w-full text-center mt-2 hover:text-foreground underline decoration-dashed underline-offset-2"
              data-testid="node-inspector-cancel-add-input-port-btn"
            >
              Cancel
            </button>
          </div>

          <button 
            v-else
            @click="handleAddPort('input')"
            class="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 rounded transition-colors group"
            data-testid="node-inspector-add-input-port-btn"
          >
            <Plus class="w-3 h-3 group-hover:scale-110 transition-transform" />
            <span>Add Input Port</span>
          </button>
        </div>
      </div>
    </div>

    <!-- OUTPUT PORTS -->
    <div>
      <div class="px-2 mb-1 flex justify-between items-center">
        <span class="text-[10px] font-bold text-muted-foreground uppercase">Outputs</span>
        <span v-if="selectedNode.allowDynamicOutputs" class="text-[9px] text-blue-400 bg-blue-400/10 px-1 rounded">Dynamic</span>
      </div>
      
      <div class="space-y-1">
        <div 
          v-for="(port, idx) in selectedNode.outputs" 
          :key="port.id || idx"
          class="group flex items-center gap-1 w-full"
          data-testid="node-inspector-output-port-row"
          :data-port-id="port.id"
        >
          <div class="flex-1 flex items-center gap-2 px-2 py-1 bg-secondary/20 border border-border rounded text-xs hover:bg-secondary/30 transition-colors">
            <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: getPortColor(port) }"></div>
            
            <input 
              :value="port.label"
              @change="updatePortLabel(port.id, 'output', $event.target.value)"
              placeholder="Output"
              maxlength="20"
              spellcheck="false"
              class="flex-1 w-full min-w-0 bg-transparent outline-none font-mono text-xs truncate focus:bg-background focus:ring-1 focus:ring-border rounded px-1 py-0.5 -ml-1 transition-all"
              data-testid="node-inspector-output-port-label-input"
            />

            <span class="text-[9px] text-muted-foreground bg-muted px-1 rounded shrink-0">{{ port.dataType || port.type }}</span>
          </div>
          
          <IconButton 
            v-if="selectedNode.allowDynamicOutputs"
            @click="removeDynamicInput(port.id, 'output')"
            class="opacity-30 group-hover:opacity-100 transition-opacity w-6 h-6 shrink-0"
            variant="ghost" 
            size="xs"
            tooltip="Remove Output"
            data-testid="node-inspector-output-port-remove-btn"
          >
            <Trash2 class="w-3.5 h-3.5 text-muted-foreground hover:text-red-400" />
          </IconButton>
        </div>

        <div v-if="selectedNode.outputs.length === 0" class="px-2 text-[10px] text-muted-foreground italic" data-testid="node-inspector-no-outputs-msg">
          No outputs.
        </div>
        
        <div v-if="selectedNode.allowDynamicOutputs" class="mt-2">
          <div v-if="activeDropdownTarget === 'output'" class="animate-in fade-in slide-in-from-top-1 bg-secondary/20 p-2 rounded border border-dashed border-border" data-testid="node-inspector-add-output-port-dropdown-container">
            <div class="text-[10px] text-muted-foreground mb-1.5 ml-1">Select Property:</div>
            <BaseSelect 
              placeholder="Choose..." 
              :options="availableOptions"
              :model-value="null"
              @update:model-value="addFromDropdown"
              data-testid="node-inspector-add-output-port-select"
            />
            <button 
              @click="activeDropdownTarget = null" 
              class="text-[10px] text-muted-foreground w-full text-center mt-2 hover:text-foreground underline decoration-dashed underline-offset-2"
              data-testid="node-inspector-cancel-add-output-port-btn"
            >
              Cancel
            </button>
          </div>

          <button 
            v-else
            @click="handleAddPort('output')"
            class="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 rounded transition-colors group"
            data-testid="node-inspector-add-output-port-btn"
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
import { useNodeLogic } from '@nodes/nodes.js';
import {
  PropertySection,
  IconButton,
  BaseSelect
} from '@components/components.js';

const { 
  selectedNode, 
  activeDropdownTarget,
  availableOptions,   
  handleAddPort,   
  addFromDropdown,   
  removeDynamicInput,
  updatePortLabel
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