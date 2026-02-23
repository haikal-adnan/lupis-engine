<template>
  <div class="w-full">
    <PropertySection 
      :title="title" 
      :icon="Database"
    >
      <template v-if="targetVariable">
        
        <PropertyRow label="Variable Name">
          <BaseInput 
            :model-value="targetVariable.name" 
            @update:model-value="(val) => handleUpdate('name', val)"
            placeholder="Enter variable name..."
            :error="nameError"
          />
        </PropertyRow>

        <PropertyRow label="Scope">
          <BaseInput 
            :model-value="currentScope" 
            class="opacity-40 pointer-events-none filter grayscale" 
          />
        </PropertyRow>
        
        <PropertyRow label="Type">
          <BaseSelect 
            :model-value="targetVariable.type"
            @update:model-value="(val) => handleUpdate('type', val)"
            :options="typeOptions"
            class="h-8 text-xs"
          />
        </PropertyRow>

        <PropertyRow label="Default Value">
          
          <BaseSelect 
            v-if="targetVariable.type === 'Boolean'"
            :model-value="targetVariable.defaultValue"
            @update:model-value="(val) => handleUpdate('defaultValue', val)"
            :options="boolOptions"
            class="h-8 text-xs"
          />

          <BaseNumber 
            v-else-if="targetVariable.type === 'Number'"
            :model-value="targetVariable.defaultValue"
            @update:model-value="(val) => handleUpdate('defaultValue', val)"
            class="h-8 text-xs font-mono"
          />

          <BaseInput 
            v-else
            :model-value="targetVariable.defaultValue"
            @update:model-value="(val) => handleUpdate('defaultValue', val)"
            placeholder="Value..."
            class="h-8 text-xs"
          />
        </PropertyRow>

      </template>
      
      <div v-else class="p-4 text-center text-xs text-muted-foreground">
        Variable not found or deleted.
      </div>

    </PropertySection>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { Database } from 'lucide-vue-next';
import { useScriptStore } from '@/stores/useScriptStore.js';
import { useProjectStore } from '@/stores/useProjectStore.js';
import { useVariableLogic } from '@/modules/variable/composables/useVariableLogic.js';

import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseInput from '@/commons/components/inputs/BaseInput.vue';
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue';
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue'; 

const props = defineProps({
  node: {
    type: Object,
    required: true
  }
});

const scriptStore = useScriptStore();
const projectStore = useProjectStore();
const nameError = ref(null);

const currentScope = computed(() => {
  if (props.node.data?.scope) return props.node.data.scope;
  const varId = props.node.data?.variableId;
  const isGlobal = projectStore.activeProject?.globalVariables?.some(v => v._id === varId);
  return isGlobal ? 'Global' : 'Local';
});

const { variables, updateVariable } = useVariableLogic(currentScope.value);

const title = computed(() => props.node.type === 'variable_set' ? 'Set Variable' : 'Get Variable');

const typeOptions = [
  { label: 'String', value: 'String' },
  { label: 'Number', value: 'Number' },
  { label: 'Boolean', value: 'Boolean' }
];

const boolOptions = [
  { label: 'False', value: false },
  { label: 'True', value: true },
];

const targetVariable = computed(() => {
  if (!props.node.data?.variableId) return null;
  return variables.value.find(v => v._id === props.node.data.variableId);
});

const handleUpdate = (key, value) => {
  if (!props.node.data?.variableId) return;

  const index = variables.value.findIndex(v => v._id === props.node.data.variableId);

  if (index !== -1) {
    updateVariable(index, key, value);
    if (key === 'name') nameError.value = null;
  }
};
</script>