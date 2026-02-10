<template>
  <div class="w-full">
    <PropertySection title="Comparison Logic" :icon="Scale" v-if="node">
      
      <PropertyRow label="Value A">
        <div class="flex gap-2 w-full relative group">
          
          <div v-if="isConnected('a')" 
               class="absolute -top-5 right-0 text-[9px] text-green-400 font-mono animate-pulse flex items-center gap-1">
            <Zap class="w-3 h-3" /> LINKED
          </div>

          <div class="flex-1 min-w-0" :class="{ 'opacity-50 pointer-events-none grayscale': isConnected('a') }">
             <BaseInput 
                v-if="getType('a') === 'string'"
                :model-value="getValue('a')" 
                @update:model-value="(v) => updateValue('a', v)"
                placeholder="text..."
                class="w-full"
              />

              <BaseNumber 
                v-else-if="getType('a') === 'number'"
                :model-value="getValue('a')" 
                @update:model-value="(v) => updateValue('a', Number(v))"
                class="w-full font-mono"
              />

              <BaseSelect 
                v-else-if="getType('a') === 'boolean'"
                :model-value="getValue('a')"
                @update:model-value="(v) => updateValue('a', v)"
                :options="[{label: 'False', value: false}, {label: 'True', value: true}]"
                class="w-full"
              />
          </div>

          <div class="w-24 shrink-0">
             <BaseSelect 
                :model-value="getType('a')"
                @update:model-value="(newType) => updateType('a', newType)"
                :options="dataTypeOptions"
                class="w-full"
             />
          </div>
        </div>
      </PropertyRow>

      <div class="flex justify-center -my-1 opacity-30">
        <div class="h-4 w-0.5 border-l border-dashed border-foreground"></div>
      </div>

      <PropertyRow label="Condition">
        <BaseSelect 
            :model-value="op"
            @update:model-value="updateOp"
            :options="operatorOptions"
            class="w-full font-bold text-center"
        />
      </PropertyRow>

      <div class="flex justify-center -my-1 opacity-30">
        <div class="h-4 w-0.5 border-l border-dashed border-foreground"></div>
      </div>

      <PropertyRow label="Value B">
        <div class="flex gap-2 w-full relative">
          
          <div v-if="isConnected('b')" 
               class="absolute -top-5 right-0 text-[9px] text-green-400 font-mono animate-pulse flex items-center gap-1">
            <Zap class="w-3 h-3" /> LINKED
          </div>

          <div class="flex-1 min-w-0" :class="{ 'opacity-50 pointer-events-none grayscale': isConnected('b') }">
             <BaseInput 
                v-if="getType('b') === 'string'"
                :model-value="getValue('b')" 
                @update:model-value="(v) => updateValue('b', v)"
                placeholder="text..."
                class="w-full"
              />

              <BaseNumber 
                v-else-if="getType('b') === 'number'"
                :model-value="getValue('b')" 
                @update:model-value="(v) => updateValue('b', Number(v))"
                class="w-full font-mono"
              />

              <BaseSelect 
                v-else-if="getType('b') === 'boolean'"
                :model-value="getValue('b')"
                @update:model-value="(v) => updateValue('b', v)"
                :options="[{label: 'False', value: false}, {label: 'True', value: true}]"
                class="w-full"
              />
          </div>

          <div class="w-24 shrink-0">
             <BaseSelect 
                :model-value="getType('b')"
                @update:model-value="(newType) => updateType('b', newType)"
                :options="dataTypeOptions"
                class="w-full"
             />
          </div>
        </div>
      </PropertyRow>

    </PropertySection>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Scale, Zap } from 'lucide-vue-next';
import { useScriptStore } from '@/stores/useScriptStore.js';
import { usePopAlert } from '@/composables/usePopAlert';

// Components
import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue"; // Menggunakan PropertyRow
import BaseInput from '@/commons/components/inputs/BaseInput.vue';
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue';
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';

const props = defineProps({ node: Object });
const store = useScriptStore();
const { showPop } = usePopAlert();

// --- Options ---
const operatorOptions = [
  { label: '== Equal', value: 'equal' },
  { label: '!= Not Equal', value: 'not_equal' },
  { label: '> Greater', value: 'greater' },
  { label: '< Less', value: 'less' },
  { label: '>= Gr. Equal', value: 'greater_equal' },
  { label: '<= Ls. Equal', value: 'less_equal' }
];

const dataTypeOptions = [
  { label: 'String', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
];

const op = computed(() => props.node.data?.op || 'equal');

// --- Helpers ---
const isConnected = (inputId) => store.isInputConnected(props.node._id, inputId);

const getValue = (inputId) => {
    const input = props.node.inputs?.find(i => i._id === inputId);
    return input?.value ?? '';
};

// Fallback logic for type
const getType = (inputId) => {
    const input = props.node.inputs?.find(i => i._id === inputId);
    const type = input?.dataType || 'number'; 
    return (type === 'any') ? 'number' : type; 
};

// --- Logic ---
const updateValue = (inputId, newValue) => {
  if (isConnected(inputId)) return;
  const currentInputs = props.node.inputs || [];
  const newInputs = currentInputs.map(input => {
      if (input._id === inputId) {
          return { ...input, value: newValue };
      }
      return input;
  });
  store.updateNodeInActive(props.node._id, { inputs: newInputs });
};

const updateType = (inputId, newType) => {
  const currentInputs = props.node.inputs || [];
  
  // Logic Disconnect
  const existingEdges = store.activeScript.edges.filter(e => 
    e.target === props.node._id && e.targetHandle === inputId
  );

  let disconnectedCount = 0;
  existingEdges.forEach(edge => {
      const sourceNode = store.activeScript.nodes.find(n => n._id === edge.source);
      if (!sourceNode) return;
      const sourceOutput = sourceNode.outputs.find(o => o._id === edge.sourceHandle);
      const sourceType = sourceOutput?.dataType || 'any';

      if (sourceType !== 'any' && sourceType !== newType) {
          store.removeEdge(edge.id);
          disconnectedCount++;
      }
  });

  if (disconnectedCount > 0) {
      showPop({
        title: 'Type Changed',
        message: `Connection removed. Incompatible with ${newType}.`,
        type: 'warning'
      });
  }

  // Update Color & Data Type
  const colorMap = {
      'string': '#9c27b0',
      'number': '#00e676',
      'boolean': '#f44336'
  };

  // Reset defaults
  let defaultValue = '';
  if (newType === 'number') defaultValue = 0;
  if (newType === 'boolean') defaultValue = false;

  const newInputs = currentInputs.map(input => {
      if (input._id === inputId) {
          return { 
              ...input, 
              dataType: newType, 
              color: colorMap[newType] || '#ffffff',
              value: input.dataType !== newType ? defaultValue : input.value 
          };
      }
      return input;
  });

  store.updateNodeInActive(props.node._id, { inputs: newInputs });
};

const updateOp = (newOp) => {
  store.updateNodeInActive(props.node._id, { data: { ...props.node.data, op: newOp } });
  
  const labelMap = {
      'equal': '==', 'not_equal': '!=', 'greater': '>', 
      'less': '<', 'greater_equal': '>=', 'less_equal': '<='
  };
  store.updateNodeInActive(props.node._id, {
      settings: { ...props.node.settings, headerTitle: `Compare (${labelMap[newOp]})` }
  });
};
</script>