<!-- lokasi: src/editor/nodes/components/NodePorts.vue -->
<template>
  <PropertySection title="Ports Configuration" :icon="Network" v-if="selectedNode" data-testid="node-inspector-ports-section">
    <!-- INPUT PORTS -->
    <div class="mb-3">
      <div class="px-2 mb-1 flex justify-between items-center">
        <span class="text-[10px] font-bold text-muted-foreground uppercase">Inputs</span>
        <span v-if="isInputDynamic" class="text-[9px] text-blue-400 bg-blue-400/10 px-1 rounded uppercase">
          {{ dynamicModeLabel }}
        </span>
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
              :value="port.label || port.id"
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
            v-if="canDeleteInputPort(selectedNode, port.id)"
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

        <!-- Input Dynamic Controls -->
        <div v-if="isInputDynamic" class="mt-2">
          <!-- Dynamic Input Property Dropdown -->
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
              type="button"
              @click="activeDropdownTarget = null" 
              class="text-[10px] text-muted-foreground w-full text-center mt-2 hover:text-foreground underline decoration-dashed underline-offset-2"
              data-testid="node-inspector-cancel-add-input-port-btn"
            >
              Cancel
            </button>
          </div>

          <!-- Add Input Port Button -->
          <button 
            v-else
            type="button"
            @click="handleAddPort('input')"
            class="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 rounded transition-colors group"
            data-testid="node-inspector-add-input-port-btn"
          >
            <Plus class="w-3 h-3 group-hover:scale-110 transition-transform" />
            <span>{{ effectiveDynamicMode === 'sequential' ? '+ Add Value' : (selectedNode?.type === 'logicSwitch' ? '+ Add Case' : (selectedNode?.type === 'eventOnKey' || selectedNode?.type === 'eventAdvancedKey' ? '+ Add Key' : 'Add Input Port')) }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- OUTPUT PORTS -->
    <div>
      <div class="px-2 mb-1 flex justify-between items-center">
        <span class="text-[10px] font-bold text-muted-foreground uppercase">Outputs</span>
        <span v-if="isOutputDynamic" class="text-[9px] text-blue-400 bg-blue-400/10 px-1 rounded uppercase">
          {{ dynamicModeLabel }}
        </span>
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
              :value="port.label || port.id"
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
            v-if="canDeleteOutputPort(selectedNode, port.id)"
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
        
        <!-- Output Dynamic Controls -->
        <div v-if="isOutputDynamic" class="mt-2">
          <!-- Dynamic Output Property Dropdown -->
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
              type="button"
              @click="activeDropdownTarget = null" 
              class="text-[10px] text-muted-foreground w-full text-center mt-2 hover:text-foreground underline decoration-dashed underline-offset-2"
              data-testid="node-inspector-cancel-add-output-port-btn"
            >
              Cancel
            </button>
          </div>

          <!-- Add Output Port Button -->
          <button 
            v-else
            type="button"
            @click="handleAddPort('output')"
            class="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 rounded transition-colors group"
            data-testid="node-inspector-add-output-port-btn"
          >
            <Plus class="w-3 h-3 group-hover:scale-110 transition-transform" />
            <span>{{ selectedNode?.type === 'logicSwitch' ? '+ Add Case' : (selectedNode?.type === 'eventOnKey' || selectedNode?.type === 'eventAdvancedKey' ? '+ Add Key' : 'Add Output Port') }}</span>
          </button>
        </div>
      </div>
    </div>
  </PropertySection>
</template>

<script setup>
import { computed } from 'vue';
import { Network, Trash2, Plus } from 'lucide-vue-next';
import { useNodeLogic } from '@nodes/nodes.js';
import { PropertySection, IconButton, BaseSelect } from '@components/components.js';

const { 
  selectedNode, 
  activeDropdownTarget,
  availableOptions,
  effectiveDynamicMode,   
  handleAddPort,   
  addFromDropdown,   
  removeDynamicInput,
  updatePortLabel,
  canDeleteInputPort,
  canDeleteOutputPort
} = useNodeLogic();

const dynamicModeLabel = computed(() => effectiveDynamicMode.value);

const isInputDynamic = computed(() => {
  const mode = effectiveDynamicMode.value;
  return mode === 'sequential' || mode === 'inputProperty' || mode === 'switch' || mode === 'keyboard' || selectedNode.value?.type === 'logicSwitch' || selectedNode.value?.type === 'eventOnKey' || selectedNode.value?.type === 'eventAdvancedKey';
});

const isOutputDynamic = computed(() => {
  const mode = effectiveDynamicMode.value;
  return mode === 'outputProperty' || mode === 'switch' || mode === 'keyboard' || selectedNode.value?.type === 'logicSwitch' || selectedNode.value?.type === 'eventOnKey' || selectedNode.value?.type === 'eventAdvancedKey';
});

function isRemovablePort(portId) {
  return canDeleteInputPort(selectedNode.value, portId);
}

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