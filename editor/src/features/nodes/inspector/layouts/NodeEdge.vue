<!-- Location: NodeEdge.vue -->
<template>
  <div v-if="selectedEdge" class="w-full space-y-3">
    <!-- Connection Port Info -->
    <PropertySection title="Edge Modifier" :icon="GitCommit" data-testid="node-inspector-edge-section">
      <div class="px-2 py-1.5 bg-secondary/20 border border-border rounded text-[10px] space-y-1 font-mono" data-testid="node-inspector-edge-info">
        <div class="flex items-center justify-between text-muted-foreground">
          <span>From: <strong class="text-foreground" data-testid="node-inspector-edge-source-title">{{ sourceNodeTitle }}</strong> ({{ selectedEdge.sourceHandle }})</span>
        </div>
        <div class="flex items-center justify-between text-muted-foreground">
          <span>To: <strong class="text-foreground" data-testid="node-inspector-edge-target-title">{{ targetNodeTitle }}</strong> ({{ selectedEdge.targetHandle }})</span>
        </div>
      </div>

      <!-- Callout for Execution Flow -->
      <div 
        v-if="edgeDataType === 'execution'" 
        class="p-2 bg-secondary/20 border border-border rounded text-[11px] text-muted-foreground leading-tight space-y-1"
        data-testid="node-inspector-edge-execution-callout"
      >
        <p class="font-medium text-foreground">Execution Flow</p>
        <p class="text-[10px] opacity-90">
          Execution connections manage logic flow order and do not support value modifiers.
        </p>
      </div>

      <!-- Callout for Collection -->
      <div 
        v-else-if="['list', 'map'].includes(edgeDataType)" 
        class="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] text-amber-500 leading-tight space-y-1"
        data-testid="node-inspector-edge-collection-callout"
      >
        <p class="font-medium">Direct Operations Disabled</p>
        <p class="text-[10px] opacity-90">
          Data manipulation for <strong>{{ edgeDataType.toUpperCase() }}</strong> is handled via dedicated library nodes (e.g. <em>List Get Item</em>, <em>Map Get Value</em>) for structured data flow.
        </p>
      </div>

      <!-- Operation Type -->
      <PropertyRow v-else label="Operation" data-testid="node-inspector-edge-operation-row">
        <BaseSelect
          :model-value="selectedEdge.modifier?.type || 'none'"
          :options="availableModifierOptions"
          @update:model-value="updateModifierType"
          data-testid="node-inspector-edge-operation-select"
        />
      </PropertyRow>

      <!-- Input Value -->
      <PropertyRow v-if="needsValueInput && edgeDataType !== 'execution'" :label="valueInputLabel" data-testid="node-inspector-edge-operand-row">
        <BaseNumber
          v-if="isNumberModifier"
          :model-value="selectedEdge.modifier?.value ?? 0"
          @update:model-value="updateModifierValue"
          class="font-mono w-full"
          data-testid="node-inspector-edge-operand-number-input"
        />
        <BaseInput
          v-else
          :model-value="selectedEdge.modifier?.value ?? ''"
          @update:model-value="updateModifierValue"
          placeholder="Enter value..."
          class="w-full"
          data-testid="node-inspector-edge-operand-text-input"
        />
      </PropertyRow>

      <!-- Quick Action: Remove Edge -->
      <div class="pt-2 border-t border-border flex justify-between items-center text-[10px]">
        <span class="text-muted-foreground font-mono truncate max-w-[120px]" data-testid="node-inspector-edge-id">ID: {{ selectedEdge.id }}</span>
        <IconButton
          @click="deleteSelectedEdge"
          tooltip="Remove Connection"
          variant="ghost"
          size="xs"
          class="text-destructive hover:bg-destructive/10"
          data-testid="node-inspector-edge-delete-btn"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </IconButton>
      </div>
    </PropertySection>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { GitCommit, Trash2 } from 'lucide-vue-next';
import { useScriptStore } from '@scripts/scripts.js';
import { useScriptHistory } from '@historys/historys.js';
import { 
  PropertySection, 
  PropertyRow, 
  BaseSelect, 
  BaseNumber, 
  BaseInput, 
  IconButton 
} from '@components/components.js';

const scriptStore = useScriptStore();
const scriptHistory = useScriptHistory();

const selectedEdge = computed(() => {
  if (!scriptStore.activeScript || !scriptStore.selectedEdgeId) return null;
  return scriptStore.activeScript.edges.find(e => e.id === scriptStore.selectedEdgeId);
});

const sourceNode = computed(() => {
  if (!selectedEdge.value || !scriptStore.activeScript) return null;
  return scriptStore.activeScript.nodes.find(n => n.id === selectedEdge.value.source);
});

const targetNode = computed(() => {
  if (!selectedEdge.value || !scriptStore.activeScript) return null;
  return scriptStore.activeScript.nodes.find(n => n.id === selectedEdge.value.target);
});

const sourceNodeTitle = computed(() => sourceNode.value?.settings?.headerTitle || sourceNode.value?.type || 'Node');
const targetNodeTitle = computed(() => targetNode.value?.settings?.headerTitle || targetNode.value?.type || 'Node');

const edgeDataType = computed(() => {
  if (!sourceNode.value || !selectedEdge.value) return 'number';

  const handle = selectedEdge.value.sourceHandle;
  const outputs = sourceNode.value.outputs || [];
  const inputs = sourceNode.value.inputs || [];

  const port = outputs.find(p => p.id === handle || p.label === handle) ||
               inputs.find(p => p.id === handle || p.label === handle) ||
               outputs[0];

  const rawType = String(port?.dataType || port?.type || '').toLowerCase();
  const srcType = String(sourceNode.value.type || '').toLowerCase();

  if (['execution', 'exec', 'flow'].includes(rawType) || handle?.toLowerCase().includes('exec')) {
    return 'execution';
  }

  // Also check target port
  if (targetNode.value) {
    const targetHandle = selectedEdge.value.targetHandle;
    const targetPort = (targetNode.value.inputs || []).find(p => p.id === targetHandle || p.label === targetHandle);
    const targetRawType = String(targetPort?.dataType || targetPort?.type || '').toLowerCase();
    if (['execution', 'exec', 'flow'].includes(targetRawType) || targetHandle?.toLowerCase().includes('exec')) {
      return 'execution';
    }
    if (rawType === 'any' || !rawType) {
      if (['list', 'array'].includes(targetRawType)) return 'list';
      if (['map', 'object', 'dictionary'].includes(targetRawType)) return 'map';
      if (['boolean', 'bool'].includes(targetRawType)) return 'boolean';
      if (['string', 'text', 'str'].includes(targetRawType)) return 'string';
      if (['number', 'int', 'float'].includes(targetRawType)) return 'number';
    }
  }

  if (['list', 'array'].includes(rawType)) return 'list';
  if (['map', 'object', 'dictionary'].includes(rawType)) return 'map';

  if (['boolean', 'bool'].includes(rawType) || srcType.startsWith('logic_') || srcType.includes('bool')) {
    return 'boolean';
  }
  if (['string', 'text', 'str'].includes(rawType) || srcType.includes('string') || srcType.includes('text')) {
    return 'string';
  }
  if (['number', 'int', 'float'].includes(rawType)) {
    return 'number';
  }

  if (rawType === 'any') return 'any';

  return 'number';
});

const availableModifierOptions = computed(() => {
  const type = edgeDataType.value;

  if (type === 'number') {
    return [
      { label: 'None (Pass Through)', value: 'none' },
      { label: 'Add (+)', value: 'add' },
      { label: 'Subtract (-)', value: 'subtract' },
      { label: 'Multiply (x)', value: 'multiply' },
      { label: 'Divide (÷)', value: 'divide' },
      { label: 'Invert (-X)', value: 'invert' },
      { label: 'Absolute (|X|)', value: 'abs' }
    ];
  } else if (type === 'string') {
    return [
      { label: 'None (Pass Through)', value: 'none' },
      { label: 'Append (Suffix)', value: 'append' },
      { label: 'Prepend (Prefix)', value: 'prepend' },
      { label: 'Uppercase', value: 'uppercase' },
      { label: 'Lowercase', value: 'lowercase' },
      { label: 'Trim', value: 'trim' }
    ];
  } else if (type === 'boolean') {
    return [
      { label: 'None (Pass Through)', value: 'none' },
      { label: 'Invert (NOT !)', value: 'not' }
    ];
  } else if (type === 'any') {
    return [
      { label: 'None (Pass Through)', value: 'none' },
      { label: 'Add (+)', value: 'add' },
      { label: 'Subtract (-)', value: 'subtract' },
      { label: 'Multiply (x)', value: 'multiply' },
      { label: 'Divide (÷)', value: 'divide' },
      { label: 'Invert (-X)', value: 'invert' },
      { label: 'Absolute (|X|)', value: 'abs' },
      { label: 'Append (Suffix)', value: 'append' },
      { label: 'Prepend (Prefix)', value: 'prepend' },
      { label: 'Uppercase', value: 'uppercase' },
      { label: 'Lowercase', value: 'lowercase' },
      { label: 'Trim', value: 'trim' },
      { label: 'Invert (NOT !)', value: 'not' }
    ];
  }

  return [{ label: 'None (Pass Through)', value: 'none' }];
});

const needsValueInput = computed(() => {
  const modType = selectedEdge.value?.modifier?.type;
  return ['add', 'subtract', 'multiply', 'divide', 'append', 'prepend'].includes(modType);
});

const isNumberModifier = computed(() => {
  const modType = selectedEdge.value?.modifier?.type;
  if (['subtract', 'multiply', 'divide'].includes(modType)) return true;
  if (modType === 'add') {
    return edgeDataType.value === 'number' || typeof selectedEdge.value?.modifier?.value === 'number';
  }
  return edgeDataType.value === 'number';
});

const valueInputLabel = computed(() => 'Operand Value');

function updateModifierType(type) {
  if (!selectedEdge.value) return;
  const isNum = ['add', 'subtract', 'multiply', 'divide'].includes(type) || edgeDataType.value === 'number';
  const defaultValue = isNum ? 0 : '';
  const currentVal = selectedEdge.value.modifier?.value;
  const oldModifier = selectedEdge.value.modifier ? { ...selectedEdge.value.modifier } : null;
  const newModifier = {
    type,
    value: (currentVal !== undefined && currentVal !== null && currentVal !== '') 
      ? (isNum && typeof currentVal === 'string' && !isNaN(Number(currentVal)) ? Number(currentVal) : currentVal) 
      : defaultValue
  };
  scriptHistory.recordEdgeModifierChange(selectedEdge.value.id, oldModifier, newModifier);
  scriptStore.updateEdgeModifier(selectedEdge.value.id, newModifier);
}

function updateModifierValue(val) {
  if (!selectedEdge.value) return;
  const oldModifier = selectedEdge.value.modifier ? { ...selectedEdge.value.modifier } : null;
  const newModifier = {
    type: selectedEdge.value.modifier?.type || 'none',
    value: val
  };
  scriptHistory.recordEdgeModifierChange(selectedEdge.value.id, oldModifier, newModifier);
  scriptStore.updateEdgeModifier(selectedEdge.value.id, newModifier);
}

function deleteSelectedEdge() {
  if (selectedEdge.value) {
    scriptStore.removeEdgeFromActive(selectedEdge.value.id);
    scriptStore.selectedEdgeId = null;
  }
}
</script>