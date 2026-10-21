<!-- lokasi: src/editor/nodes/components/NodeData.vue -->
<template>
  <PropertySection 
    v-if="node && (isVariableNode || hasTopData || hasInputPorts || isDynamicNode)" 
    title="Parameters" 
    :icon="Sliders"
  >
    <!-- ================================================================= -->
    <!-- KHUSUS: NODE VARIABLE (GET & SET VARIABLE)                        -->
    <!-- ================================================================= -->
    <template v-if="isVariableNode">
      <!-- 1. Pemilihan Target Variabel -->
      <PropertyRow label="Variable">
        <VariableSelect
          :model-value="node.data?.variableId"
          :filter-by-type="false"
          @update:model-value="onSelectVariable"
        />
      </PropertyRow>

      <!-- 2. Khusus Variable Set: Kontrol Value Input (Direct / Variable Binding) -->
      <template v-if="(node.type === 'variableSet' || node.type === 'variable_set') && variableSetInputPort">
        <PropertyRow 
          label="Value"
          data-testid="node-inspector-port-row"
          :data-port-id="variableSetInputPort.id"
        >
          <!-- Badge LINKED / NOT SET -->
          <template #actions>
            <span v-if="isInputConnected(variableSetInputPort.id)" class="text-[9px] font-mono text-green-400 animate-pulse font-bold" data-testid="node-inspector-port-linked-badge">
              LINKED
            </span>
            <span v-else-if="isErrorNotSet(variableSetInputPort.id, getPortValue(variableSetInputPort))" class="text-[9px] font-mono text-red-500 font-bold uppercase tracking-tighter">
              NOT SET
            </span>
          </template>

          <!-- Control Wrapper -->
          <div 
            class="flex items-start gap-1.5 w-full rounded-md transition-all"
            :class="{ 
              'opacity-40 pointer-events-none filter grayscale': isInputConnected(variableSetInputPort.id),
              'ring-1 ring-red-500/30': !isInputConnected(variableSetInputPort.id) && isErrorNotSet(variableSetInputPort.id, getPortValue(variableSetInputPort)) 
            }"
          >
            <!-- Switch Mode Button -->
            <IconButton
              @click="handleToggleMode(variableSetInputPort.id)"
              :disabled="isInputConnected(variableSetInputPort.id)"
              :active="getMode(variableSetInputPort.id) === 'variable'"
              :tooltip="getMode(variableSetInputPort.id) === 'variable' ? 'Switch to Direct Input' : 'Switch to Variable'"
              class="shrink-0"
              data-testid="node-inspector-port-mode-toggle"
            >
              <Variable v-if="getMode(variableSetInputPort.id) === 'variable'" class="w-3.5 h-3.5 text-purple-400" />
              <Edit3 v-else class="w-3.5 h-3.5" />
            </IconButton>

            <!-- MODE 1: VARIABLE BINDING (Ambil Nilai dari Variabel Lain) -->
            <div v-if="getMode(variableSetInputPort.id) === 'variable'" class="flex-1 min-w-0" data-testid="node-inspector-port-variable-group">
              <VariableInputGroup
                :binding-value="getVariableBinding(variableSetInputPort.id)"
                :data-type="getInputDataType(variableSetInputPort, getPortValue(variableSetInputPort))"
                :modifier="getVariableModifier(variableSetInputPort.id)"
                :custom-text="getCustomText(variableSetInputPort.id)"
                :disabled="isInputConnected(variableSetInputPort.id)"
                @update:binding-value="handleSetVariableBinding(variableSetInputPort.id, $event)"
                @update:modifier="handleSetVariableModifier(variableSetInputPort.id, $event)"
                @update:custom-text="handleSetCustomText(variableSetInputPort.id, $event)"
                @clear:modifier="handleClearVariableModifier(variableSetInputPort.id)"
              />
            </div>

            <!-- MODE 2: DIRECT VALUE INPUT (BaseNumber, BaseSelect, BaseInput) -->
            <div v-else class="flex-1 min-w-0">
              <BaseSelect 
                v-if="getInputDataType(variableSetInputPort, getPortValue(variableSetInputPort)) === 'boolean'"
                :model-value="getPortValue(variableSetInputPort)"
                :options="booleanOptions"
                placeholder="Choose..."
                @update:model-value="handleUpdateDirectValue(variableSetInputPort.id, $event)"
                data-testid="node-inspector-port-boolean-select"
              />

              <BaseNumber 
                v-else-if="getInputDataType(variableSetInputPort, getPortValue(variableSetInputPort)) === 'number'"
                :model-value="getPortValue(variableSetInputPort)"
                @focus="startScriptTransaction"
                @blur="endScriptTransactionWithDelay(0)"
                @update:model-value="handleUpdateDirectValue(variableSetInputPort.id, $event)"
                class="font-mono w-full"
                :placeholder="getPlaceholder(variableSetInputPort.id, getPortValue(variableSetInputPort), 'Number')"
                data-testid="node-inspector-port-number-input"
              />

              <BaseInput 
                v-else
                :model-value="getPortValue(variableSetInputPort)"
                :model-value-live="getPortValue(variableSetInputPort)"
                @update:model-value="handleUpdateDirectValue(variableSetInputPort.id, $event)"
                class="w-full"
                :placeholder="getPlaceholder(variableSetInputPort.id, getPortValue(variableSetInputPort), 'String')"
                data-testid="node-inspector-port-text-input"
              />
            </div>
          </div>
        </PropertyRow>
      </template>
    </template>

    <!-- ================================================================= -->
    <!-- GENERIC NODE INSPECTOR                                            -->
    <!-- ================================================================= -->
    <template v-else>
      <template v-for="(value, key) in node.data" :key="'data-'+key">
        <PropertyRow 
          v-if="shouldShowDataField(key)" 
          :label="formatLabel(key)"
          data-testid="node-inspector-data-row"
          :data-field-key="key"
        >
          <BaseSelect 
            v-if="typeof value === 'boolean'"
            :model-value="value"
            :options="booleanOptions"
            @update:model-value="updateData(key, $event)"
          />

          <BaseNumber 
            v-else-if="typeof value === 'number'"
            :model-value="value"
            @focus="startScriptTransaction"
            @blur="endScriptTransactionWithDelay(0)"
            @update:model-value="updateData(key, $event)"
            class="font-mono"
          />

          <BaseInput 
            v-else-if="isPrimitive(value)"
            :model-value="value"
            @update:model-value="updateData(key, $event)"
          />
        </PropertyRow>
      </template>

      <template v-for="(port, idx) in nonExecutionInputs" :key="'port-'+port.id">
        <PropertyRow 
          :label="port.label || formatLabel(port.id)"
          data-testid="node-inspector-port-row"
          :data-port-id="port.id"
          :data-port-index="idx"
        >
          <template #actions>
            <span v-if="isInputConnected(port.id)" class="text-[9px] font-mono text-green-400 animate-pulse font-bold" data-testid="node-inspector-port-linked-badge">
              LINKED
            </span>
            <span v-else-if="isErrorNotSet(port.id, getPortValue(port))" class="text-[9px] font-mono text-red-500 font-bold uppercase tracking-tighter">
              NOT SET
            </span>

            <button 
              v-if="canDeleteInput(port.id)" 
              type="button"
              @click="removeDynamicInput(port.id, 'input')"
              class="text-xs text-muted-foreground hover:text-red-400 transition-colors px-1"
              title="Remove Port"
            >
              &times;
            </button>
          </template>

          <div 
            class="flex items-start gap-1.5 w-full rounded-md transition-all"
            :class="{ 
              'opacity-40 pointer-events-none filter grayscale': isInputConnected(port.id),
              'ring-1 ring-red-500/30': !isInputConnected(port.id) && isErrorNotSet(port.id, getPortValue(port)) 
            }"
          >
            <IconButton
              @click="toggleMode(port.id)"
              :disabled="isInputConnected(port.id)"
              :active="getMode(port.id) === 'variable'"
              :tooltip="getMode(port.id) === 'variable' ? 'Switch to Direct Input' : 'Switch to Variable'"
              class="shrink-0"
              data-testid="node-inspector-port-mode-toggle"
            >
              <Variable v-if="getMode(port.id) === 'variable'" class="w-3.5 h-3.5 text-purple-400" />
              <Edit3 v-else class="w-3.5 h-3.5" />
            </IconButton>

            <div v-if="getMode(port.id) === 'variable'" class="flex-1 min-w-0" data-testid="node-inspector-port-variable-group">
              <VariableInputGroup
                :binding-value="getVariableBinding(port.id)"
                :data-type="getInputDataType(port, getPortValue(port))"
                :modifier="getVariableModifier(port.id)"
                :custom-text="getCustomText(port.id)"
                :disabled="isInputConnected(port.id)"
                @update:binding-value="setVariableBinding(port.id, $event)"
                @update:modifier="setVariableModifier(port.id, $event)"
                @update:custom-text="handleSetCustomText(port.id, $event)"
                @clear:modifier="clearVariableModifier(port.id)"
              />
            </div>

            <div v-else class="flex-1 min-w-0">
              <BaseSelect 
                v-if="hasOptions(port.id)"
                :model-value="getPortValue(port)"
                :options="getOptions(port.id)"
                placeholder="Choose option..."
                @update:model-value="updateNodeValue(port.id, $event)"
                data-testid="node-inspector-port-options-select"
              />

              <BaseSelect 
                v-else-if="getInputDataType(port, getPortValue(port)) === 'boolean'"
                :model-value="getPortValue(port)"
                :options="booleanOptions"
                placeholder="Choose..."
                @update:model-value="updateNodeValue(port.id, $event)"
                data-testid="node-inspector-port-boolean-select"
              />

              <BaseNumber 
                v-else-if="getInputDataType(port, getPortValue(port)) === 'number'"
                :model-value="getPortValue(port)"
                @focus="startScriptTransaction"
                @blur="endScriptTransactionWithDelay(0)"
                @update:model-value="updateNodeValue(port.id, $event)"
                class="font-mono w-full"
                :placeholder="getPlaceholder(port.id, getPortValue(port), 'Number')"
                data-testid="node-inspector-port-number-input"
              />

              <BaseInput 
                v-else
                :model-value="getPortValue(port)"
                :model-value-live="getPortValue(port)"
                @update:model-value="updateNodeValue(port.id, $event)"
                class="w-full"
                :placeholder="getPlaceholder(port.id, getPortValue(port), 'String')"
                data-testid="node-inspector-port-text-input"
              />
            </div>
          </div>
        </PropertyRow>
      </template>

      <template v-if="effectiveDynamicMode === 'outputProperty'">
        <template v-for="port in nonExecutionOutputs" :key="'out-port-'+port.id">
          <PropertyRow :label="port.label || formatLabel(port.id)">
            <template #actions>
              <button 
                type="button"
                @click="removeDynamicInput(port.id, 'output')"
                class="text-xs text-muted-foreground hover:text-red-400 transition-colors px-1"
                title="Remove Port"
              >
                &times;
              </button>
            </template>
            <div class="text-xs text-muted-foreground font-mono py-1 px-2 rounded bg-muted/40 border border-border">
              Output: {{ port.dataType }}
            </div>
          </PropertyRow>
        </template>
      </template>

      <div v-if="isPropertyNode && availableOptions.length > 0" class="pt-2 border-t border-border">
        <PropertyRow label="Add Property">
          <BaseSelect
            :model-value="''"
            :options="availableOptions"
            placeholder="+ Select property..."
            @update:model-value="onAddPropertySelected"
          />
        </PropertyRow>
      </div>

      <div v-if="isSequentialNode" class="pt-2 border-t border-border">
        <button
          type="button"
          @click="handleAddPort('input')"
          class="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-mono border border-dashed border-border rounded-md text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors bg-secondary/10 hover:bg-secondary/20"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>+ Add Value (Val {{ nextSequentialNumber }})</span>
        </button>
      </div>

      <div v-if="isSwitchNode" class="pt-2 border-t border-border">
        <button
          type="button"
          @click="handleAddPort('input')"
          class="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-mono border border-dashed border-border rounded-md text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors bg-secondary/10 hover:bg-secondary/20"
          data-testid="node-inspector-add-case-btn"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>+ Add Case</span>
        </button>
      </div>

      <div v-if="isKeyNode" class="pt-2 border-t border-border">
        <button
          type="button"
          @click="handleAddPort('input')"
          class="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-mono border border-dashed border-border rounded-md text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors bg-secondary/10 hover:bg-secondary/20"
          data-testid="node-inspector-add-key-btn"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>+ Add Key</span>
        </button>
      </div>
    </template>

    <!-- Empty State -->
    <div 
      v-if="!isVariableNode && !hasTopData && !hasInputPorts && !isDynamicNode" 
      class="px-2 py-4 text-center text-xs text-muted-foreground italic"
    >
      No editable parameters.
    </div>
  </PropertySection>
</template>

<script setup>
import { computed } from 'vue';
import { Sliders, Variable, Edit3, Plus } from 'lucide-vue-next';
import { VariableInputGroup, VariableSelect, useNodeInspector, useVariableConfig, useNodeBlueprint } from '@nodes/nodes.js';
import { PropertySection, PropertyRow, BaseInput, BaseNumber, BaseSelect, IconButton } from '@components/components.js';
import { useScriptStore } from '@scripts/scripts.js';
import { useProjectStore } from '@projects/projects.js';

const props = defineProps({ node: Object });
const scriptStore = useScriptStore();
const projectStore = useProjectStore();
const { getVarColor, getDefaultValueForType, sanitizeVariableValue } = useVariableConfig();
const { getNodeBlueprint } = useNodeBlueprint();

const { 
  node, 
  isInputConnected, 
  isErrorNotSet, 
  getMode, 
  toggleMode, 
  getVariableBinding, 
  setVariableBinding, 
  getVariableModifier, 
  setVariableModifier, 
  clearVariableModifier, 
  updateNodeDataField, 
  updateNodeValue, 
  startScriptTransaction, 
  endScriptTransactionWithDelay,
  availableOptions,
  activeDropdownTarget,
  effectiveDynamicMode,
  handleAddPort,
  addFromDropdown,
  removeDynamicInput,
  canDeleteInputPort
} = useNodeInspector(props);

const booleanOptions = [
  { label: 'True', value: true },
  { label: 'False', value: false }
];

const IGNORED_KEYS = [
  'code', 'values', 'propertyOptions', 'dynamicMode', 
  'mappings', 'options', 'valueModes', 'variableBindings', 'variableModifiers',
  'variableId', 'scope', 'items', 'cases'
];

const isVariableNode = computed(() => {
  return ['variableGet', 'variable_get', 'variableSet', 'variable_set'].includes(node.value?.type);
});

const variableSetInputPort = computed(() => {
  if ((node.value?.type !== 'variableSet' && node.value?.type !== 'variable_set') || !node.value.inputs) return null;
  return node.value.inputs.find(port => {
    const dType = String(port.dataType || '').toLowerCase();
    const pId = String(port.id || '').toLowerCase();
    return dType !== 'execution';
  }) || null;
});

const isSwitchNode = computed(() => {
  return node.value?.type === 'logicSwitch';
});

const isKeyNode = computed(() => {
  return node.value?.type === 'eventOnKey' || node.value?.type === 'eventAdvancedKey';
});

const isDynamicNode = computed(() => {
  const mode = effectiveDynamicMode.value;
  return mode === 'inputProperty' || mode === 'outputProperty' || mode === 'sequential' || mode === 'switch' || mode === 'keyboard' || isSwitchNode.value || isKeyNode.value;
});

const isPropertyNode = computed(() => {
  const mode = effectiveDynamicMode.value;
  return mode === 'inputProperty' || mode === 'outputProperty';
});

const isSequentialNode = computed(() => {
  return effectiveDynamicMode.value === 'sequential';
});

const nextSequentialNumber = computed(() => {
  if (!node.value?.inputs) return 1;
  return node.value.inputs.filter(p => !['execIn', 'targetEntity', 'targetLayer'].includes(p.id)).length + 1;
});

const nonExecutionInputs = computed(() => {
  if (!node.value || !Array.isArray(node.value.inputs)) return [];
  return node.value.inputs.filter(port => {
    const dType = String(port.dataType || '').toLowerCase();
    const pId = String(port.id || '').toLowerCase();
    return dType !== 'execution';
  });
});

const nonExecutionOutputs = computed(() => {
  if (!node.value || !Array.isArray(node.value.outputs)) return [];
  return node.value.outputs.filter(port => {
    const dType = String(port.dataType || '').toLowerCase();
    const pId = String(port.id || '').toLowerCase();
    return dType !== 'execution';
  });
});

const hasInputPorts = computed(() => nonExecutionInputs.value.length > 0);

const hasTopData = computed(() => {
  const data = node.value?.data || {};
  return Object.keys(data).filter(k => shouldShowDataField(k)).length > 0;
});

function canDeleteInput(portId) {
  return canDeleteInputPort(node.value, portId);
}

function onAddPropertySelected(optionValue) {
  if (!optionValue || !node.value) return;
  activeDropdownTarget.value = effectiveDynamicMode.value === 'outputProperty' ? 'output' : 'input';
  addFromDropdown(optionValue);
}

function getCustomText(portId) {
  return node.value?.data?.variableModifiers?.[portId]?.format || '';
}

function handleSetCustomText(portId, text) {
  const currentMods = node.value?.data?.variableModifiers || {};
  const existing = currentMods[portId] || { type: 'none', value: 0 };
  updateNodeDataField('data.variableModifiers', {
    ...currentMods,
    [portId]: { ...existing, format: text }
  });
  regenerateVariableSetCode();
}

function handleToggleMode(portId) {
  toggleMode(portId);
  regenerateVariableSetCode();
}

function handleSetVariableBinding(portId, varId) {
  setVariableBinding(portId, varId);
  regenerateVariableSetCode();
}

function handleSetVariableModifier(portId, modifier) {
  setVariableModifier(portId, modifier);
  regenerateVariableSetCode();
}

function handleClearVariableModifier(portId) {
  clearVariableModifier(portId);
  regenerateVariableSetCode();
}

function handleUpdateDirectValue(portId, value) {
  updateNodeValue(portId, value);
  regenerateVariableSetCode();
}

function findVariableMeta(varId) {
  if (!varId) return null;
  const globals = (projectStore.activeProject?.globalVariables || []).map(v => ({ ...v, scope: 'Global' }));
  const locals = (scriptStore.activeScript?.localVariables || []).map(v => ({ ...v, scope: 'Local' }));
  return [...globals, ...locals].find(v => v.id === varId) || null;
}

function regenerateVariableSetCode() {
  if (!node.value || (node.value.type !== 'variableSet' && node.value.type !== 'variable_set')) return;

  const targetVarId = node.value.data?.variableId;
  const targetVar = findVariableMeta(targetVarId);
  if (!targetVar) return;

  const varName = targetVar.name;
  const setMethod = targetVar.scope === 'Global' ? 'setGlobal' : 'setLocal';
  const portId = variableSetInputPort.value?.id || 'value';

  node.value.data.code = 
`const val = inputs.${portId};
context.${setMethod}('${varName}', val);
outputs.valueOut = val;
outputs.execOut = true;
return;`;

  scriptStore.saveActiveScript();
}

function onSelectVariable(newVarId) {
  if (!node.value || !newVarId) return;

  const targetVar = findVariableMeta(newVarId);
  if (!targetVar) return;

  const isGet = node.value.type === 'variableGet' || node.value.type === 'variable_get';
  const varName = targetVar.name;
  const varType = (targetVar.type || 'String').toLowerCase();
  const varColor = getVarColor(targetVar.type);
  const scope = targetVar.scope;

  const getMethod = scope === 'Global' ? 'getGlobal' : 'getLocal';
  const newTitle = isGet ? `Get ${varName}` : `Set ${varName}`;

  node.value.data.variableId = targetVar.id;
  node.value.data.scope = scope;

  node.value.label = newTitle;
  if (node.value.settings) {
    node.value.settings.headerTitle = newTitle;
    node.value.settings.headerColor = varColor;
  }

  if (!node.value.inputs) node.value.inputs = [];
  if (!node.value.outputs) node.value.outputs = [];

  if (isGet) {
    node.value.inputs = [];
    const outPort = node.value.outputs.find(o => o.id === 'value' || o.id === 'out_0');
    if (outPort) {
      outPort.id = 'value';
      outPort.dataType = varType;
      outPort.color = varColor;
      outPort.label = varName;
    } else {
      node.value.outputs = [
        { id: 'value', label: varName, dataType: varType, color: varColor }
      ];
    }
    node.value.data.code = `outputs.value = context.${getMethod}('${varName}');\nreturn;`;
  } else {
    const valPort = node.value.inputs.find(i => i.id === 'value' || i.id === 'val_0');
    if (valPort) {
      valPort.id = 'value';
      valPort.dataType = varType;
      valPort.color = varColor;
      valPort.label = varName;
    } else {
      node.value.inputs = [
        { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
        { id: 'value', label: varName, dataType: varType, color: varColor }
      ];
    }

    const outPort = node.value.outputs.find(o => o.id === 'valueOut' || o.id === 'out_0');
    if (outPort) {
      outPort.id = 'valueOut';
      outPort.dataType = varType;
      outPort.color = varColor;
      outPort.label = varName;
    } else {
      node.value.outputs = [
        { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
        { id: 'valueOut', label: varName, dataType: varType, color: varColor }
      ];
    }

    if (!node.value.data.values) {
      node.value.data.values = {};
    }
    const defaultVal = targetVar.defaultValue !== undefined
      ? (typeof sanitizeVariableValue === 'function' ? sanitizeVariableValue(targetVar.defaultValue, targetVar.type) : targetVar.defaultValue)
      : (typeof getDefaultValueForType === 'function' ? getDefaultValueForType(varType) : '');

    node.value.data.values['value'] = defaultVal;

    node.value.data.items = [
      {
        variableId: targetVar.id,
        value: defaultVal,
        dataType: varType
      }
    ];

    regenerateVariableSetCode();
  }

  scriptStore.saveActiveScript();
}

function getPortValue(port) {
  if (!node.value?.data?.values) return port.defaultValue ?? '';
  const values = node.value.data.values;
  if (values[port.id] !== undefined) return values[port.id];
  if (values[port.label] !== undefined) return values[port.label];
  return port.defaultValue ?? '';
}

function shouldShowDataField(key) {
  if (IGNORED_KEYS.includes(key)) return false;
  const fields = node.value?.settings?.visibleDataFields;
  if (Array.isArray(fields) && fields.length > 0) return fields.includes(key);
  return true;
}

function isNotSet(value) {
  return value === undefined || value === null || value === '';
}

function getPlaceholder(key, value, type) {
  if ((String(key).startsWith('targetEntity') || String(key).startsWith('targetLayer')) && isNotSet(value)) return 'self';
  if (isNotSet(value)) return `Empty ${type}...`;
  return '';
}

function getBlueprintOptions(key) {
  if (!node.value?.type) return null;
  const bp = getNodeBlueprint(node.value.type);
  return bp?.defaultData?.data?.options?.[key] || null;
}

function hasOptions(key) {
  return !!(node.value?.data?.options?.[key] || getBlueprintOptions(key));
}

function getOptions(key) {
  return node.value?.data?.options?.[key] || getBlueprintOptions(key) || [];
}

function isPrimitive(val) {
  return val !== null && typeof val !== 'object';
}

function getInputDataType(port, val) {
  if (port && (port.dataType || port.type)) {
    const type = String(port.dataType || port.type).toLowerCase();
    if (type === 'any') return 'any';
    if (['number', 'float', 'int'].includes(type)) return 'number';
    if (['boolean', 'bool'].includes(type)) return 'boolean';
    if (['string', 'text'].includes(type)) return 'string';
    if (['list', 'array'].includes(type)) return 'list';
    if (['map', 'object'].includes(type)) return 'map';
  }
  if (val !== null && val !== undefined && val !== '') return typeof val;
  return 'string';
}

function formatLabel(key) {
  if (typeof key !== 'string') return String(key);
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

function updateData(key, value) {
  updateNodeDataField(`data.${key}`, value);
}
</script>