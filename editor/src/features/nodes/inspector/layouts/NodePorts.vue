<!-- lokasi: src/editor/nodes/components/NodePorts.vue -->
<template>
  <PropertySection title="Ports Configuration" :icon="Network" v-if="selectedNode" data-testid="node-inspector-ports-section">
    <!-- INPUT PORTS -->
    <div class="mb-3">
      <div class="px-2 mb-1 flex justify-between items-center">
        <span class="text-[10px] font-bold text-muted-foreground uppercase">Inputs</span>
        <span v-if="isInputDynamic" class="text-[9px] text-blue-400 border border-blue-400 px-1 rounded uppercase">
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
          <div class="flex-1 min-w-0 flex items-center gap-2 px-2 py-1 bg-secondary/20 border border-border rounded text-xs hover:bg-secondary/30 transition-colors">
            <div class="w-2 h-2 rounded-full shrink-0 border border-slate-300 dark:border-slate-600" :style="{ backgroundColor: getPortColor(port) }"></div>
            
            <input 
              :value="port.label || port.id"
              :readonly="!isCustomNode"
              @change="updatePortLabel(port.id, 'input', $event.target.value)"
              placeholder="Input"
              maxlength="32"
              spellcheck="false"
              class="flex-1 w-full min-w-0 bg-transparent outline-none font-mono text-xs truncate rounded px-1 py-0.5 -ml-1 transition-all"
              :class="isCustomNode ? 'focus:bg-background focus:ring-1 focus:ring-border text-foreground cursor-text' : 'text-muted-foreground cursor-default select-text'"
              :title="isCustomNode ? 'Rename port' : 'System port name is locked'"
              data-testid="node-inspector-input-port-label-input"
            />

            <!-- Type badge (clean & compact, just like system node!) -->
            <span class="text-[9px] text-muted-foreground bg-muted px-1 rounded shrink-0 select-none">
              {{ port.dataType || port.type }}
            </span>
          </div>

          <!-- Burger Menu for Custom Node Data Ports -->
          <BaseDropdown v-if="isCustomNode && port.dataType !== 'execution'" align="right">
            <template #trigger="{ isOpen }">
              <button 
                type="button" 
                class="w-6 h-6 flex items-center justify-center rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted/80 transition-colors opacity-70 group-hover:opacity-100"
                :class="{ '!opacity-100 bg-muted/80 text-foreground': isOpen }"
                title="Port Options"
                data-testid="node-inspector-input-port-menu-trigger"
              >
                <MoreVertical class="w-3.5 h-3.5" />
              </button>
            </template>

            <template #default="{ close }">
              <div class="p-1 space-y-0.5 min-w-[140px] text-xs" role="menu">
                <!-- Data Type Selection -->
                <div class="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-tight">
                  Data Type
                </div>
                
                <button 
                  type="button"
                  @click="updatePortDataType(port.id, 'input', 'number'); close()"
                  class="flex w-full items-center justify-between rounded px-2 py-1 hover:bg-accent text-foreground transition-colors cursor-pointer"
                  :class="{ 'font-semibold text-blue-400': (port.dataType || 'number') === 'number' }"
                >
                  <span class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-[#64B5F6]"></span>
                    number
                  </span>
                  <Check v-if="(port.dataType || 'number') === 'number'" class="w-3.5 h-3.5 text-blue-400" />
                </button>

                <button 
                  type="button"
                  @click="updatePortDataType(port.id, 'input', 'string'); close()"
                  class="flex w-full items-center justify-between rounded px-2 py-1 hover:bg-accent text-foreground transition-colors cursor-pointer"
                  :class="{ 'font-semibold text-pink-400': port.dataType === 'string' }"
                >
                  <span class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-[#F48FB1]"></span>
                    string
                  </span>
                  <Check v-if="port.dataType === 'string'" class="w-3.5 h-3.5 text-pink-400" />
                </button>

                <button 
                  type="button"
                  @click="updatePortDataType(port.id, 'input', 'boolean'); close()"
                  class="flex w-full items-center justify-between rounded px-2 py-1 hover:bg-accent text-foreground transition-colors cursor-pointer"
                  :class="{ 'font-semibold text-red-400': port.dataType === 'boolean' }"
                >
                  <span class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-[#E57373]"></span>
                    boolean
                  </span>
                  <Check v-if="port.dataType === 'boolean'" class="w-3.5 h-3.5 text-red-400" />
                </button>

                <div class="h-px bg-border my-1"></div>

                <!-- Reorder -->
                <div class="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-tight">
                  Order
                </div>

                <button 
                  type="button"
                  :disabled="idx === 0 || (idx === 1 && selectedNode.inputs[0]?.dataType === 'execution')"
                  @click="movePort(port.id, 'input', 'up'); close()"
                  class="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-accent text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ArrowUp class="w-3 h-3" />
                  <span>Move Up</span>
                </button>

                <button 
                  type="button"
                  :disabled="idx >= selectedNode.inputs.length - 1"
                  @click="movePort(port.id, 'input', 'down'); close()"
                  class="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-accent text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ArrowDown class="w-3 h-3" />
                  <span>Move Down</span>
                </button>

                <template v-if="canDeleteInputPort(selectedNode, port.id)">
                  <div class="h-px bg-border my-1"></div>
                  <button 
                    type="button"
                    @click="removeDynamicInput(port.id, 'input'); close()"
                    class="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors cursor-pointer"
                  >
                    <Trash2 class="w-3 h-3" />
                    <span>Delete Port</span>
                  </button>
                </template>
              </div>
            </template>
          </BaseDropdown>

          <!-- Standard remove button for system dynamic removable ports -->
          <IconButton 
            v-else-if="canDeleteInputPort(selectedNode, port.id)"
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
            <span>{{ isCustomNode ? '+ Add Input Port' : (effectiveDynamicMode === 'sequential' ? '+ Add Value' : (selectedNode?.type === 'logicSwitch' ? '+ Add Case' : (selectedNode?.type === 'eventOnKey' || selectedNode?.type === 'eventAdvancedKey' ? '+ Add Key' : 'Add Input Port'))) }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- OUTPUT PORTS -->
    <div>
      <div class="px-2 mb-1 flex justify-between items-center">
        <span class="text-[10px] font-bold text-muted-foreground uppercase">Outputs</span>
        <span v-if="isOutputDynamic" class="text-[9px] text-blue-400 border border-blue-400 px-1 rounded uppercase">
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
          <div class="flex-1 min-w-0 flex items-center gap-2 px-2 py-1 bg-secondary/20 border border-border rounded text-xs hover:bg-secondary/30 transition-colors">
            <div class="w-2 h-2 rounded-full shrink-0 border border-slate-300 dark:border-slate-600" :style="{ backgroundColor: getPortColor(port) }"></div>
            
            <input 
              :value="port.label || port.id"
              :readonly="!isCustomNode"
              @change="updatePortLabel(port.id, 'output', $event.target.value)"
              placeholder="Output"
              maxlength="32"
              spellcheck="false"
              class="flex-1 w-full min-w-0 bg-transparent outline-none font-mono text-xs truncate rounded px-1 py-0.5 -ml-1 transition-all"
              :class="isCustomNode ? 'focus:bg-background focus:ring-1 focus:ring-border text-foreground cursor-text' : 'text-muted-foreground cursor-default select-text'"
              :title="isCustomNode ? 'Rename port' : 'System port name is locked'"
              data-testid="node-inspector-output-port-label-input"
            />

            <!-- Type badge (clean & compact, just like system node!) -->
            <span class="text-[9px] text-muted-foreground bg-muted px-1 rounded shrink-0 select-none">
              {{ port.dataType || port.type }}
            </span>
          </div>

          <!-- Burger Menu for Custom Node Data Ports -->
          <BaseDropdown v-if="isCustomNode && port.dataType !== 'execution'" align="right">
            <template #trigger="{ isOpen }">
              <button 
                type="button" 
                class="w-6 h-6 flex items-center justify-center rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted/80 transition-colors opacity-70 group-hover:opacity-100"
                :class="{ '!opacity-100 bg-muted/80 text-foreground': isOpen }"
                title="Port Options"
                data-testid="node-inspector-output-port-menu-trigger"
              >
                <MoreVertical class="w-3.5 h-3.5" />
              </button>
            </template>

            <template #default="{ close }">
              <div class="p-1 space-y-0.5 min-w-[140px] text-xs" role="menu">
                <!-- Data Type Selection -->
                <div class="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-tight">
                  Data Type
                </div>
                
                <button 
                  type="button"
                  @click="updatePortDataType(port.id, 'output', 'number'); close()"
                  class="flex w-full items-center justify-between rounded px-2 py-1 hover:bg-accent text-foreground transition-colors cursor-pointer"
                  :class="{ 'font-semibold text-blue-400': (port.dataType || 'number') === 'number' }"
                >
                  <span class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-[#64B5F6]"></span>
                    number
                  </span>
                  <Check v-if="(port.dataType || 'number') === 'number'" class="w-3.5 h-3.5 text-blue-400" />
                </button>

                <button 
                  type="button"
                  @click="updatePortDataType(port.id, 'output', 'string'); close()"
                  class="flex w-full items-center justify-between rounded px-2 py-1 hover:bg-accent text-foreground transition-colors cursor-pointer"
                  :class="{ 'font-semibold text-pink-400': port.dataType === 'string' }"
                >
                  <span class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-[#F48FB1]"></span>
                    string
                  </span>
                  <Check v-if="port.dataType === 'string'" class="w-3.5 h-3.5 text-pink-400" />
                </button>

                <button 
                  type="button"
                  @click="updatePortDataType(port.id, 'output', 'boolean'); close()"
                  class="flex w-full items-center justify-between rounded px-2 py-1 hover:bg-accent text-foreground transition-colors cursor-pointer"
                  :class="{ 'font-semibold text-red-400': port.dataType === 'boolean' }"
                >
                  <span class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-[#E57373]"></span>
                    boolean
                  </span>
                  <Check v-if="port.dataType === 'boolean'" class="w-3.5 h-3.5 text-red-400" />
                </button>

                <div class="h-px bg-border my-1"></div>

                <!-- Reorder -->
                <div class="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-tight">
                  Order
                </div>

                <button 
                  type="button"
                  :disabled="idx === 0 || (idx === 1 && selectedNode.outputs[0]?.dataType === 'execution')"
                  @click="movePort(port.id, 'output', 'up'); close()"
                  class="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-accent text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ArrowUp class="w-3 h-3" />
                  <span>Move Up</span>
                </button>

                <button 
                  type="button"
                  :disabled="idx >= selectedNode.outputs.length - 1"
                  @click="movePort(port.id, 'output', 'down'); close()"
                  class="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-accent text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ArrowDown class="w-3 h-3" />
                  <span>Move Down</span>
                </button>

                <template v-if="canDeleteOutputPort(selectedNode, port.id)">
                  <div class="h-px bg-border my-1"></div>
                  <button 
                    type="button"
                    @click="removeDynamicInput(port.id, 'output'); close()"
                    class="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors cursor-pointer"
                  >
                    <Trash2 class="w-3 h-3" />
                    <span>Delete Port</span>
                  </button>
                </template>
              </div>
            </template>
          </BaseDropdown>

          <!-- Standard remove button for system dynamic removable ports -->
          <IconButton 
            v-else-if="canDeleteOutputPort(selectedNode, port.id)"
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
            <span>{{ isCustomNode ? '+ Add Output Port' : (selectedNode?.type === 'logicSwitch' ? '+ Add Case' : (selectedNode?.type === 'eventOnKey' || selectedNode?.type === 'eventAdvancedKey' ? '+ Add Key' : 'Add Output Port')) }}</span>
          </button>
        </div>
      </div>
    </div>
  </PropertySection>
</template>

<script setup>
import { computed } from 'vue';
import { 
  Network, 
  Trash2, 
  Plus, 
  MoreVertical, 
  Check, 
  ArrowUp, 
  ArrowDown 
} from 'lucide-vue-next';
import { useNodeLogic, isUserCustomNode } from '@nodes/nodes.js';
import { PropertySection, IconButton, BaseSelect, BaseDropdown } from '@components/components.js';

const { 
  selectedNode, 
  activeDropdownTarget,
  availableOptions,
  effectiveDynamicMode,   
  handleAddPort,   
  addFromDropdown,   
  removeDynamicInput,
  updatePortLabel,
  updatePortDataType,
  movePort,
  canDeleteInputPort,
  canDeleteOutputPort
} = useNodeLogic();

const isCustomNode = computed(() => {
  return isUserCustomNode(selectedNode.value);
});

const dynamicModeLabel = computed(() => isCustomNode.value ? 'Custom' : effectiveDynamicMode.value);

const isInputDynamic = computed(() => {
  if (isCustomNode.value) return true;
  const mode = effectiveDynamicMode.value;
  return mode === 'sequential' || mode === 'inputProperty' || mode === 'switch' || mode === 'keyboard' || selectedNode.value?.type === 'logicSwitch' || selectedNode.value?.type === 'eventOnKey' || selectedNode.value?.type === 'eventAdvancedKey';
});

const isOutputDynamic = computed(() => {
  if (isCustomNode.value) return true;
  const mode = effectiveDynamicMode.value;
  return mode === 'outputProperty' || mode === 'switch' || mode === 'keyboard' || selectedNode.value?.type === 'logicSwitch' || selectedNode.value?.type === 'eventOnKey' || selectedNode.value?.type === 'eventAdvancedKey';
});

function getPortColor(port) {
  if (port.color) return port.color;
  
  const type = (port.dataType || port.type || 'any').toLowerCase();
  
  switch(type) {
    case 'execution': return '#ffffff'; 
    case 'boolean':   return '#E57373';
    case 'string':    return '#F48FB1'; 
    case 'number':    return '#64B5F6'; 
    case 'list':      return '#4DD0E1'; 
    case 'map':       return '#FF8A65'; 
    case 'any':       return '#B0BEC5'; 
    default:          return '#777777';
  }
}
</script>
