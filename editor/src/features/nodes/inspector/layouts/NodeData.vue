<!-- 📄 lokasi: NodeInspector.vue -->
<template>
  <div class="w-full">
    <!-- Inspector Property Section -->
    <PropertySection 
      v-if="node && (isVariableNode || hasTopData || hasInputPorts)" 
      title="Parameters" 
      :icon="Sliders"
    >
      <!-- ========================================== -->
      <!-- KHUSUS: NODE VARIABLE (GET & SET VARIABLE) -->
      <!-- ========================================== -->
      <template v-if="isVariableNode">
        <PropertyRow label="Variable">
          <VariableSelect
            :model-value="node.data?.variableId"
            :filter-by-type="false"
            @update:model-value="onSelectVariable"
          />
        </PropertyRow>
      </template>

      <!-- ========================================== -->
      <!-- GENERIC NODE INSPECTOR (Properti Ekstra)    -->
      <!-- ========================================== -->
      <template v-else>
        <!-- 1. Top Level Data Fields -->
        <template v-for="(value, key) in node.data" :key="'data-'+key">
          <PropertyRow 
            v-if="shouldShowDataField(key)" 
            :label="formatLabel(key)"
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

        <!-- 2. Node Port Values / Inputs Dynamic Controls -->
        <template v-for="port in nonExecutionInputs" :key="'port-'+port.id">
          <PropertyRow :label="port.label || formatLabel(port.id)">
            <!-- Badge LINKED / NOT SET -->
            <template #actions>
              <span v-if="isInputConnected(port.id)" class="text-[9px] font-mono text-green-400 animate-pulse font-bold">
                LINKED
              </span>
              <span v-else-if="isErrorNotSet(port.id, getPortValue(port))" class="text-[9px] font-mono text-red-500 font-bold uppercase tracking-tighter">
                NOT SET
              </span>
            </template>

            <!-- Control Wrapper -->
            <div 
              class="flex items-start gap-1.5 w-full rounded-md transition-all"
              :class="{ 
                'opacity-40 pointer-events-none filter grayscale': isInputConnected(port.id),
                'ring-1 ring-red-500/30': !isInputConnected(port.id) && isErrorNotSet(port.id, getPortValue(port)) 
              }"
            >
              <!-- Switch Button -->
              <IconButton
                @click="toggleMode(port.id)"
                :disabled="isInputConnected(port.id)"
                :active="getMode(port.id) === 'variable'"
                :tooltip="getMode(port.id) === 'variable' ? 'Switch to Direct Input' : 'Switch to Variable'"
                class="shrink-0"
              >
                <Variable v-if="getMode(port.id) === 'variable'" class="w-3.5 h-3.5 text-purple-400" />
                <Edit3 v-else class="w-3.5 h-3.5" />
              </IconButton>

              <!-- MODE 1: VARIABLE INPUT GROUP -->
              <div v-if="getMode(port.id) === 'variable'" class="flex-1 min-w-0">
                <VariableInputGroup
                  :binding-value="getVariableBinding(port.id)"
                  :data-type="getInputDataType(port, getPortValue(port))"
                  :modifier="getVariableModifier(port.id)"
                  :disabled="isInputConnected(port.id)"
                  @update:binding-value="setVariableBinding(port.id, $event)"
                  @update:modifier="setVariableModifier(port.id, $event)"
                  @clear:modifier="clearVariableModifier(port.id)"
                />
              </div>

              <!-- MODE 2: DIRECT VALUE INPUT -->
              <div v-else class="flex-1 min-w-0">
                <BaseSelect 
                  v-if="hasOptions(port.id)"
                  :model-value="getPortValue(port)"
                  :options="getOptions(port.id)"
                  placeholder="Choose option..."
                  @update:model-value="updateNodeValue(port.id, $event)"
                />

                <BaseSelect 
                  v-else-if="getInputDataType(port, getPortValue(port)) === 'boolean'"
                  :model-value="getPortValue(port)"
                  :options="booleanOptions"
                  placeholder="Choose..."
                  @update:model-value="updateNodeValue(port.id, $event)"
                />

                <BaseNumber 
                  v-else-if="getInputDataType(port, getPortValue(port)) === 'number'"
                  :model-value="getPortValue(port)"
                  @focus="startScriptTransaction"
                  @blur="endScriptTransactionWithDelay(0)"
                  @update:model-value="updateNodeValue(port.id, $event)"
                  class="font-mono w-full"
                  :placeholder="getPlaceholder(port.id, getPortValue(port), 'Number')"
                />

                <BaseInput 
                  v-else
                  :model-value="getPortValue(port)"
                  :model-value-live="getPortValue(port)"
                  @update:model-value="updateNodeValue(port.id, $event)"
                  class="w-full"
                  :placeholder="getPlaceholder(port.id, getPortValue(port), 'String')"
                />
              </div>
            </div>
          </PropertyRow>
        </template>
      </template>

      <!-- Empty State -->
      <div 
        v-if="!isVariableNode && !hasTopData && !hasInputPorts" 
        class="px-2 py-4 text-center text-xs text-muted-foreground italic"
      >
        No editable parameters.
      </div>
    </PropertySection>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Sliders, Variable, Edit3 } from 'lucide-vue-next';
import { VariableInputGroup, VariableSelect, useNodeInspector, useVariableConfig } from '@nodes/nodes.js';
import { PropertySection, PropertyRow, BaseInput, BaseNumber, BaseSelect, IconButton } from '@components/components.js';
import { useScriptStore } from '@scripts/scripts.js';
import { useProjectStore } from '@projects/projects.js';

const props = defineProps({ node: Object });
const scriptStore = useScriptStore();
const projectStore = useProjectStore();
const { getVarColor } = useVariableConfig();

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
  endScriptTransactionWithDelay 
} = useNodeInspector(props);

const booleanOptions = [
  { label: 'True', value: true },
  { label: 'False', value: false }
];

const IGNORED_KEYS = [
  'code', 'values', 'propertyOptions', 'allowDynamicInputs', 'allowDynamicOutputs', 
  'mappings', 'options', 'valueModes', 'variableBindings', 'variableModifiers',
  'variableId', 'scope', 'items'
];

const isVariableNode = computed(() => {
  return node.value?.type === 'variable_get' || node.value?.type === 'variable_set';
});

function onSelectVariable(newVarId) {
  if (!node.value || !newVarId) return;

  const globals = (projectStore.activeProject?.globalVariables || []).map(v => ({ ...v, scope: 'Global' }));
  const locals = (scriptStore.activeScript?.localVariables || []).map(v => ({ ...v, scope: 'Local' }));
  const targetVar = [...globals, ...locals].find(v => v.id === newVarId);

  if (!targetVar) return;

  const isGet = node.value.type === 'variable_get';
  const varName = targetVar.name;
  const varType = (targetVar.type || 'String').toLowerCase();
  const varColor = getVarColor(targetVar.type);
  const scope = targetVar.scope;

  const getMethod = scope === 'Global' ? 'getGlobal' : 'getLocal';
  const setMethod = scope === 'Global' ? 'setGlobal' : 'setLocal';

  const newTitle = isGet ? `Get ${varName}` : `Set ${varName}`;
  const nodeCode = isGet
    ? `outputs['out_0'] = context.${getMethod}('${varName}');\nreturn;`
    : `const val = inputs['val_0'];\ncontext.${setMethod}('${varName}', val);\noutputs['out_0'] = val;\noutputs['exec_out'] = true;\nreturn;`;

  node.value.data.variableId = targetVar.id;
  node.value.data.scope = scope;
  node.value.data.code = nodeCode;

  node.value.label = newTitle;
  if (node.value.settings) {
    node.value.settings.headerTitle = newTitle;
    node.value.settings.headerColor = varColor;
  }

  if (node.value.inputs) {
    node.value.inputs.forEach(inp => {
      if (inp.dataType !== 'execution') {
        inp.dataType = varType;
        inp.color = varColor;
        inp.label = varName;
      }
    });
  }

  if (node.value.outputs) {
    node.value.outputs.forEach(out => {
      if (out.dataType !== 'execution') {
        out.dataType = varType;
        out.color = varColor;
        out.label = varName;
      }
    });
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

const nonExecutionInputs = computed(() => {
  if (!node.value || !Array.isArray(node.value.inputs)) return [];
  return node.value.inputs.filter(port => {
    const dType = String(port.dataType || '').toLowerCase();
    const pId = String(port.id || '').toLowerCase();
    return dType !== 'execution' && pId !== 'exec_in' && pId !== 'exec_out';
  });
});

const hasInputPorts = computed(() => nonExecutionInputs.value.length > 0);

function shouldShowDataField(key) {
  if (IGNORED_KEYS.includes(key)) return false;
  const fields = node.value?.settings?.visibleDataFields;
  if (Array.isArray(fields) && fields.length > 0) return fields.includes(key);
  return true;
}

const hasTopData = computed(() => {
  const data = node.value?.data || {};
  return Object.keys(data).filter(k => shouldShowDataField(k)).length > 0;
});

function isNotSet(value) {
  return value === undefined || value === null || value === '';
}

function getPlaceholder(key, value, type) {
  if (String(key).startsWith('target_in') && isNotSet(value)) return 'self';
  if (isNotSet(value)) return `Empty ${type}...`;
  return '';
}

function hasOptions(key) {
  return !!node.value?.data?.options?.[key];
}

function getOptions(key) {
  return node.value?.data?.options?.[key] || [];
}

function isPrimitive(val) {
  return val !== null && typeof val !== 'object';
}

function getInputDataType(port, val) {
  if (val !== null && val !== undefined && val !== '') return typeof val;
  if (port && port.dataType) {
    const type = port.dataType.toLowerCase();
    if (['number', 'float', 'int'].includes(type)) return 'number';
    if (['boolean', 'bool'].includes(type)) return 'boolean';
    if (['string', 'text'].includes(type)) return 'string';
  }
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