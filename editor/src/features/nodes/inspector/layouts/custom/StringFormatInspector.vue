<template>
  <div class="space-y-2" data-testid="string-format-inspector">
    <PropertySection title="String Format Templates" :icon="FileText">
      <template #actions>
        <button
          @click="unlockToCustom"
          class="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          title="Unlock code and switch to Custom Script Inspector"
        >
          <Unlock class="w-3 h-3" />
          <span>Unlock</span>
        </button>
      </template>

      <!-- FORMAT TEMPLATES LIST -->
      <div class="px-1 py-1 space-y-3">
        <div class="space-y-3 pl-2 border-l-2 border-dashed border-border">
          <div 
            v-for="(fmt, index) in formats" 
            :key="'fmt_' + index" 
            class="relative group mt-2"
            data-testid="node-inspector-port-row"
            :data-port-id="getFormatPortId(index)"
          >
            <div class="absolute -left-[14px] top-1/2 w-3 h-[2px] bg-border"></div>

            <div class="bg-secondary/20 p-2 pt-2.5 rounded border border-border relative">
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-1.5">
                  <span class="text-[9px] font-mono font-bold text-pink-400">
                    Port: {{ getFormatPortId(index) }}
                  </span>
                  <span class="text-muted-foreground/40 text-[9px]">→</span>
                  <span class="text-[9px] font-mono font-bold text-amber-400">
                    Output: {{ getOutputPortId(index) }}
                  </span>
                </div>

                <div class="flex items-center gap-1">
                  <span v-if="isConnected(getFormatPortId(index))" class="text-[9px] text-green-400 font-mono font-bold">
                    LINKED
                  </span>
                  <button 
                    v-if="formats.length > 1"
                    @click="removeFormat(index)"
                    class="p-0.5 rounded text-muted-foreground hover:text-red-400 transition-colors"
                    title="Remove Format Template"
                  >
                    <Trash2 class="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div :class="{ 'opacity-40 pointer-events-none filter grayscale': isConnected(getFormatPortId(index)) }">
                <BaseInput 
                  :model-value="fmt" 
                  @update:model-value="(v) => updateFormat(index, v)" 
                  placeholder="e.g. Player: {name} | HP: {hp}" 
                  class="w-full text-xs font-mono"
                  data-testid="node-inspector-port-text-input"
                />
              </div>
            </div>
          </div>
        </div>

        <button 
          @click="addFormat"
          type="button"
          class="w-full py-1.5 border border-dashed border-border rounded text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/50 flex items-center justify-center gap-1 transition-colors group"
        >
          <Plus class="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span>Add Format Template</span>
        </button>
      </div>

      <!-- DETECTED VARIABLES INPUTS -->
      <div class="px-1 pt-3 pb-1 border-t border-border/50 space-y-2 mt-3">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Detected Variable Ports ({{ detectedVariables.length }})
          </span>
        </div>

        <div class="space-y-2 pl-2 border-l-2 border-dashed border-blue-500/30">
          <div 
            v-for="varName in detectedVariables" 
            :key="varName"
            class="bg-secondary/20 p-2 rounded border border-border relative"
            data-testid="node-inspector-port-row"
            :data-port-id="varName"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] font-mono font-bold text-blue-400">{ {{ varName }} }</span>
              <span v-if="isConnected(varName)" class="text-[9px] text-green-400 font-mono font-bold">
                LINKED
              </span>
            </div>

            <div :class="{ 'opacity-40 pointer-events-none filter grayscale': isConnected(varName) }">
              <BaseInput 
                :model-value="getValue(varName)" 
                @update:model-value="(v) => updateValue(varName, v)"
                placeholder="Default value..."
                class="h-7 text-xs w-full bg-background/50 focus:bg-background font-mono"
                data-testid="node-inspector-port-text-input"
              />
            </div>
          </div>

          <div v-if="detectedVariables.length === 0" class="text-[10px] text-muted-foreground/60 italic py-1">
            No {variables} detected in template text yet.
          </div>
        </div>
      </div>
    </PropertySection>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { FileText, Trash2, Plus, Unlock } from 'lucide-vue-next';
import { useScriptStore } from '@scripts/scripts.js';
import { useConfirm, usePopAlert } from '@composables/composables.js';
import { PropertySection, BaseInput } from '@components/components.js';

const props = defineProps({
  node: {
    type: Object,
    required: true
  }
});

const store = useScriptStore();
const confirmComposable = typeof useConfirm === 'function' ? useConfirm() : null;
const confirm = confirmComposable?.confirm;
const popComposable = typeof usePopAlert === 'function' ? usePopAlert() : null;
const showPop = popComposable?.showPop;

const formats = computed(() => {
  if (Array.isArray(props.node.data?.formats) && props.node.data.formats.length > 0) {
    return props.node.data.formats;
  }
  if (props.node.data?.values?.format !== undefined && props.node.data.values.format !== '') {
    return [props.node.data.values.format];
  }
  if (props.node.data?.format) {
    return [props.node.data.format];
  }
  const formatInput = props.node.inputs?.find(p => p.id === 'format');
  if (formatInput?.defaultValue !== undefined && formatInput.defaultValue !== '') {
    return [formatInput.defaultValue];
  }
  return ['Score: {v0} / {v1}'];
});

function getFormatPortId(index, total = formats.value.length) {
  return total === 1 ? 'format' : `format${index}`;
}

function getOutputPortId(index, total = formats.value.length) {
  return total === 1 ? 'result' : `result${index}`;
}

const detectedVariables = computed(() => {
  const vars = new Set();
  const formatPortIds = new Set(formats.value.map((_, i) => getFormatPortId(i)));

  formats.value.forEach(fmt => {
    const matches = [...String(fmt || '').matchAll(/\{([^{}]+)\}/g)];
    matches.forEach(m => {
      const raw = m[1].split('.')[0].trim();
      let varName = null;
      if (/^[A-Za-z][A-Za-z0-9]*$/.test(raw)) {
        varName = raw;
      } else if (/^[0-9]+$/.test(raw)) {
        varName = `v${raw}`;
      }
      if (varName && !formatPortIds.has(varName)) {
        vars.add(varName);
      }
    });
  });
  return Array.from(vars);
});

function isConnected(portId) {
  return store.isInputConnected(props.node.id, portId);
}

function getValue(portId) {
  return props.node.data?.values?.[portId] ?? '';
}

function updateValue(portId, newValue) {
  if (isConnected(portId)) return;
  const currentValues = props.node.data?.values || {};
  store.updateNodeInActive(props.node.id, {
    data: {
      ...props.node.data,
      values: { ...currentValues, [portId]: newValue }
    }
  });
}

function generateStringCode(fmtList) {
  const blocks = fmtList.map((fmt, i) => {
    const inPort = getFormatPortId(i, fmtList.length);
    const outPort = getOutputPortId(i, fmtList.length);
    const safeFmt = JSON.stringify(fmt || '');
    return [
      'const rawFmt' + i + ' = inputs.' + inPort + ' !== undefined && inputs.' + inPort + ' !== null ? inputs.' + inPort + ' : ' + safeFmt + ';',
      'const fmt' + i + ' = String(rawFmt' + i + ');',
      'outputs.' + outPort + ' = fmt' + i + '.replace(/\\{([^{}]+)\\}/g, function(_, path) {',
      '  const parts = path.split(".");',
      '  const rootKey = parts[0].trim();',
      '  let val = inputs[rootKey] !== undefined ? inputs[rootKey] : (inputs["v" + rootKey] !== undefined ? inputs["v" + rootKey] : undefined);',
      '  for (let p = 1; p < parts.length; p++) {',
      '    if (val && typeof val === "object") {',
      '      val = val[parts[p].trim()];',
      '    }',
      '  }',
      '  return typeof val === "object" ? JSON.stringify(val) : String(val !== undefined ? val : "");',
      '});'
    ].join('\n');
  });

  return blocks.join('\n\n') + '\n\nreturn;';
}

function syncStructure(newFormats) {
  const oldTotal = formats.value.length;
  const newTotal = newFormats.length;

  const formatInputs = newFormats.map((fmt, i) => {
    const id = getFormatPortId(i, newTotal);
    return {
      id,
      dataType: 'string',
      color: '#F48FB1',
      defaultValue: fmt ?? ''
    };
  });

  const formatPortIds = new Set(formatInputs.map(p => p.id));
  const vars = new Set();
  newFormats.forEach(fmt => {
    const matches = [...String(fmt || '').matchAll(/\{([^{}]+)\}/g)];
    matches.forEach(m => {
      const raw = m[1].split('.')[0].trim();
      let varName = null;
      if (/^[A-Za-z][A-Za-z0-9]*$/.test(raw)) {
        varName = raw;
      } else if (/^[0-9]+$/.test(raw)) {
        varName = `v${raw}`;
      }
      if (varName && !formatPortIds.has(varName)) {
        vars.add(varName);
      }
    });
  });

  const currentValues = props.node.data?.values || {};
  const newValues = { ...currentValues };

  newFormats.forEach((fmt, i) => {
    const portId = getFormatPortId(i, newTotal);
    newValues[portId] = fmt ?? '';
  });
  if (newTotal === 1) {
    newValues.format = newFormats[0] ?? '';
  }

  const varInputs = Array.from(vars).map(varName => {
    if (newValues[varName] === undefined) {
      newValues[varName] = '';
    }
    return {
      id: varName,
      dataType: 'any',
      color: '#B0BEC5',
      defaultValue: ''
    };
  });

  const newInputs = [...formatInputs, ...varInputs];

  const newOutputs = newFormats.map((_, i) => ({
    id: getOutputPortId(i, newTotal),
    dataType: 'string',
    color: '#F48FB1'
  }));

  // Remap and clean edges
  if (store.activeScript?.edges) {
    store.activeScript.edges = store.activeScript.edges.map(edge => {
      // Transition 1 -> >1: remap format -> format0 and result -> result0
      if (oldTotal === 1 && newTotal > 1) {
        if (edge.target === props.node.id && edge.targetHandle === 'format') {
          return { ...edge, targetHandle: 'format0' };
        }
        if (edge.source === props.node.id && edge.sourceHandle === 'result') {
          return { ...edge, sourceHandle: 'result0' };
        }
      }
      // Transition >1 -> 1: remap format0 -> format and result0 -> result
      if (oldTotal > 1 && newTotal === 1) {
        if (edge.target === props.node.id && edge.targetHandle === 'format0') {
          return { ...edge, targetHandle: 'format' };
        }
        if (edge.source === props.node.id && edge.sourceHandle === 'result0') {
          return { ...edge, sourceHandle: 'result' };
        }
      }
      return edge;
    });

    const validInKeys = new Set(newInputs.map(p => p.id));
    const validOutKeys = new Set(newOutputs.map(p => p.id));

    store.activeScript.edges = store.activeScript.edges.filter(edge => {
      if (edge.target === props.node.id) {
        return validInKeys.has(edge.targetHandle);
      }
      if (edge.source === props.node.id) {
        return validOutKeys.has(edge.sourceHandle);
      }
      return true;
    });
  }

  store.updateNodeInActive(props.node.id, {
    data: {
      ...props.node.data,
      formats: newFormats,
      values: newValues,
      code: generateStringCode(newFormats)
    },
    inputs: newInputs,
    outputs: newOutputs
  });
}

function updateFormat(index, newText) {
  const newFormats = [...formats.value];
  newFormats[index] = newText;
  syncStructure(newFormats);
}

function addFormat() {
  const newFormats = [...formats.value, 'Value: {v0}'];
  syncStructure(newFormats);
}

function removeFormat(index) {
  const newFormats = [...formats.value];
  newFormats.splice(index, 1);
  syncStructure(newFormats);
}

onMounted(() => {
  const currentInputs = props.node.inputs || [];
  const expectedFormatPortId = getFormatPortId(0, formats.value.length);
  const hasFormatPort = currentInputs.some(p => p.id === expectedFormatPortId || p.id === 'format');
  const hasCode = Boolean(props.node.data?.code);
  if (!hasFormatPort || !hasCode) {
    syncStructure(formats.value);
  }
});

async function unlockToCustom() {
  let isConfirmed = false;
  if (confirm) {
    isConfirmed = await confirm({
      title: 'Unlock Node to Custom Script',
      message: 'Unlock this node to custom script? Its custom inspector will be detached and code will become fully editable.',
      confirmText: 'Unlock',
      cancelText: 'Cancel',
      type: 'warning'
    });
  } else if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
    isConfirmed = window.confirm('Unlock this node to custom script? Its custom inspector will be detached and code will become fully editable.');
  } else {
    isConfirmed = true;
  }

  if (isConfirmed) {
    store.updateNodeInActive(props.node.id, {
      isCustomScript: true,
      originalType: props.node.type
    });
    if (showPop) {
      const nodeTitle = props.node.settings?.headerTitle || props.node.label || 'String Format';
      showPop({
        title: 'Custom Inspector Detached',
        message: `Node "${nodeTitle}" has been unlocked to custom script. Code is now fully editable in the code panel.`,
        type: 'success'
      });
    }
  }
}
</script>