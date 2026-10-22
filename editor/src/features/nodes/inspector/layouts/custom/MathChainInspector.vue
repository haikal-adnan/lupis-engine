<template>
  <div class="space-y-2" data-testid="math-chain-inspector">
    <PropertySection title="Math Calculation Chain" :icon="Calculator">
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

      <div class="px-1 py-1 space-y-3">
        <!-- BASE VALUE (v0) -->
        <div class="bg-secondary/20 p-2 rounded border border-border relative overflow-hidden group">
          <div class="flex items-center justify-between mb-1">
            <label class="text-[9px] text-muted-foreground uppercase font-bold">
              Base Value (v0)
            </label>
            <span v-if="isConnected('v0')" class="text-[9px] text-green-400 font-mono font-bold">
              LINKED
            </span>
          </div>

          <div :class="{ 'opacity-40 pointer-events-none filter grayscale': isConnected('v0') }">
            <BaseNumber 
              :model-value="getValue('v0')" 
              @update:model-value="(v) => updateValue('v0', v)"
              class="h-7 text-xs font-mono w-full text-center bg-background/50 focus:bg-background transition-colors"
            />
          </div>
        </div>

        <!-- CHAIN STEPS -->
        <div class="relative pl-3 border-l-2 border-dashed border-border space-y-3">
          <div 
            v-for="(op, index) in ops" 
            :key="index" 
            class="relative group"
          >
            <div class="absolute -left-[19px] top-1/2 w-4 h-[2px] bg-border"></div>

            <div class="bg-secondary/20 p-2 rounded border border-border relative">
              <button 
                @click="removeStep(index)"
                class="absolute -top-2 -right-2 bg-background border border-border p-1 rounded-full opacity-0 group-hover:opacity-100 hover:text-red-400 hover:border-red-400 transition-all z-20 shadow-sm"
                title="Remove Calculation Step"
              >
                <Trash2 class="w-3 h-3" />
              </button>

              <div class="mb-2">
                <label class="text-[9px] text-muted-foreground uppercase font-bold block mb-1">
                  Operation #{{ index + 1 }}
                </label>
                <BaseSelect 
                  :model-value="op"
                  @update:model-value="(v) => updateOp(index, v)"
                  :options="operatorOptions"
                  class="w-full font-mono text-xs"
                />
              </div>

              <div class="relative overflow-hidden">
                <div class="flex items-center justify-between mb-1">
                  <label class="text-[9px] text-muted-foreground uppercase font-bold">
                    Operand (v{{ index + 1 }})
                  </label>
                  <span v-if="isConnected(`v${index + 1}`)" class="text-[9px] text-green-400 font-mono font-bold">
                    LINKED
                  </span>
                </div>

                <div :class="{ 'opacity-40 pointer-events-none filter grayscale': isConnected(`v${index + 1}`) }">
                  <BaseNumber 
                    :model-value="getValue(`v${index + 1}`)" 
                    @update:model-value="(v) => updateValue(`v${index + 1}`, v)"
                    class="h-7 text-xs font-mono w-full text-center bg-background/50 focus:bg-background"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <button 
          @click="addStep"
          type="button"
          class="w-full py-2 border border-dashed border-border rounded text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 flex items-center justify-center gap-2 transition-colors group"
        >
          <Plus class="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span>Add Calculation Step</span>
        </button>
      </div>
    </PropertySection>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Calculator, Trash2, Plus, Unlock } from 'lucide-vue-next';
import { useScriptStore } from '@scripts/scripts.js';
import { useConfirm, usePopAlert } from '@composables/composables.js';
import { PropertySection, BaseNumber, BaseSelect } from '@components/components.js';

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

const operatorOptions = [
  { label: 'Add (+)', value: 'add' },
  { label: 'Subtract (-)', value: 'subtract' },
  { label: 'Multiply (×)', value: 'multiply' },
  { label: 'Divide (÷)', value: 'divide' },
  { label: 'Modulo (%)', value: 'modulo' }
];

const ops = computed(() => props.node.data?.ops || []);

function isConnected(portId) {
  return store.isInputConnected(props.node.id, portId);
}

function getValue(portId) {
  return props.node.data?.values?.[portId] ?? 0;
}

function updateValue(portId, newValue) {
  if (isConnected(portId)) return;
  const currentValues = props.node.data?.values || {};
  store.updateNodeInActive(props.node.id, {
    data: {
      ...props.node.data,
      values: { ...currentValues, [portId]: Number(newValue) || 0 }
    }
  });
}

function updateOp(index, newOp) {
  const newOps = [...ops.value];
  newOps[index] = newOp;
  syncStructure(newOps);
}

function generateMathCode(opList) {
  return `let res = Number(inputs.v0) || 0;
${opList.map((op, idx) => {
  const v = `(Number(inputs.v${idx + 1}) || 0)`;
  if (op === 'subtract') return `res = res - ${v};`;
  if (op === 'multiply') return `res = res * ${v};`;
  if (op === 'divide') return `res = ${v} !== 0 ? res / ${v} : 0;`;
  if (op === 'modulo') return `res = ${v} !== 0 ? res % ${v} : 0;`;
  return `res = res + ${v};`;
}).join('\n')}

outputs.result = Number(res.toFixed(6));
return;`;
}

function syncStructure(newOps) {
  const currentInputs = props.node.inputs || [];
  const currentValues = props.node.data?.values || {};
  const newValues = { ...currentValues };

  const v0 = currentInputs.find(i => i.id === 'v0') || {
    id: 'v0',
    dataType: 'number',
    color: '#64B5F6',
    defaultValue: 0
  };

  if (newValues.v0 === undefined) newValues.v0 = 0;

  const nextInputs = newOps.map((_, index) => {
    const id = `v${index + 1}`;
    if (newValues[id] === undefined) newValues[id] = 0;
    return {
      id,
      dataType: 'number',
      color: '#64B5F6',
      defaultValue: 0
    };
  });

  const finalInputs = [v0, ...nextInputs];
  const validKeys = new Set(finalInputs.map(i => i.id));

  Object.keys(newValues).forEach(key => {
    if (!validKeys.has(key)) {
      delete newValues[key];
    }
  });

  if (store.activeScript?.edges) {
    store.activeScript.edges = store.activeScript.edges.filter(edge => {
      if (edge.target === props.node.id) {
        return validKeys.has(edge.targetHandle);
      }
      return true;
    });
  }

  const finalOutputs = [{
    id: 'result',
    dataType: 'number',
    color: '#64B5F6'
  }];

  store.updateNodeInActive(props.node.id, {
    data: {
      ...props.node.data,
      ops: newOps,
      values: newValues,
      code: generateMathCode(newOps)
    },
    inputs: finalInputs,
    outputs: finalOutputs
  });
}

function addStep() {
  const newOps = [...ops.value, 'add'];
  syncStructure(newOps);
}

function removeStep(index) {
  const newOps = [...ops.value];
  newOps.splice(index, 1);
  syncStructure(newOps);
}

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
      const nodeTitle = props.node.settings?.headerTitle || props.node.label || 'Math Chain';
      showPop({
        title: 'Custom Inspector Detached',
        message: `Node "${nodeTitle}" has been unlocked to custom script. Code is now fully editable in the code panel.`,
        type: 'success'
      });
    }
  }
}
</script>
