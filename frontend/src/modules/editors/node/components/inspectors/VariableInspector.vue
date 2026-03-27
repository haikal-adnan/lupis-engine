<template>
  <div class="w-full">
    <PropertySection 
      :title="title" 
      :icon="Database"
    >
      <template v-if="targetVariable">
        
        <div class="py-1">
          <div class="flex items-center justify-between group">
            <div class="flex items-center gap-2 overflow-hidden">
              <div class="flex flex-col min-w-0">
                <span class="text-xs font-bold truncate">{{ targetVariable.name }}</span>
                <span class="text-[10px] text-muted-foreground uppercase tracking-tight">
                  {{ currentScope }} • {{ targetVariable.type }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <PropertyRow v-if="node.type === 'variable_set'" label="Assign Value">
          
          <div v-if="isComplexType" class="text-[10px] text-muted-foreground italic py-1.5 px-2 bg-muted/20 rounded border border-dashed border-border text-center">
            {{ targetVariable.type }} values must be passed via node connections.
          </div>

          <div v-else class="relative w-full">
            <div class="absolute -top-3 right-0 text-[9px] font-mono z-10 px-1 rounded bg-background/80 flex gap-1">
              <span v-if="isValueLinked" class="text-green-400 animate-pulse font-bold">
                LINKED
              </span>
              <span v-else-if="isNotSet(currentAssignValue)" class="text-red-500 font-bold uppercase tracking-tighter">
                NOT SET
              </span>
            </div>

            <div :class="{ 
              'opacity-40 pointer-events-none filter grayscale transition-all': isValueLinked,
              'border-red-500/20': !isValueLinked && isNotSet(currentAssignValue) 
            }">
              
              <BaseSelect 
                v-if="targetVariable.type?.toLowerCase() === 'boolean'"
                :model-value="currentAssignValue"
                @update:model-value="updateAssignValue"
                :options="boolOptions"
                class="h-8 text-xs w-full"
                placeholder="Choose..."
              />

              <BaseNumber 
                v-else-if="targetVariable.type?.toLowerCase() === 'number'"
                :model-value="currentAssignValue"
                @update:model-value="updateAssignValue"
                class="h-8 text-xs font-mono w-full"
                :placeholder="getPlaceholder('Number')"
              />

              <BaseInput 
                v-else
                :model-value="currentAssignValue"
                @update:model-value="updateAssignValue"
                class="h-8 text-xs w-full"
                :placeholder="getPlaceholder('String')"
              />
            </div>
          </div>
        </PropertyRow>

        <div v-if="node.type === 'variable_get'" class="px-2 py-1 text-[10px] text-muted-foreground italic">
          Reading value from {{ currentScope }} memory.
        </div>

      </template>
      
      <div v-else class="p-4 text-center text-xs text-muted-foreground italic">
        Variable reference missing.
      </div>

    </PropertySection>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Database, Type, Hash, ToggleLeft } from 'lucide-vue-next'; 
import { useScriptStore } from '@/stores/useScriptStore.js';
import { useProjectStore } from '@/stores/useProjectStore.js';
import { useVariableLogic } from '@editors/variable/composables/useVariableLogic.js';

import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseInput from '@/commons/components/inputs/BaseInput.vue';
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue';
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue'; 

const props = defineProps({
  node: { type: Object, required: true }
});

const scriptStore = useScriptStore();
const projectStore = useProjectStore();
const PORT_ID = 'val_in';

const currentScope = computed(() => {
  if (props.node.data?.scope) return props.node.data.scope;
  const varId = props.node.data?.variableId;
  const isGlobal = projectStore.activeProject?.globalVariables?.some(v => v._id === varId);
  return isGlobal ? 'Global' : 'Local';
});

const { variables } = useVariableLogic(currentScope.value);

const targetVariable = computed(() => {
  if (!props.node.data?.variableId) return null;
  return variables.value.find(v => v._id === props.node.data.variableId);
});

const isComplexType = computed(() => {
  const type = targetVariable.value?.type?.toLowerCase();
  return type === 'list' || type === 'map';
});

const isValueLinked = computed(() => scriptStore.isInputConnected(props.node._id, PORT_ID));
const currentAssignValue = computed(() => props.node.data?.values?.[PORT_ID] ?? null);

const isNotSet = (val) => val === undefined || val === null || val === '';
const getPlaceholder = (type) => isNotSet(currentAssignValue.value) ? `Empty ${type} (Active Value)...` : '';

function updateAssignValue(val) {
  const currentValues = props.node.data?.values || {};
  scriptStore.updateNodeInActive(props.node._id, {
    data: { values: { ...currentValues, [PORT_ID]: val } }
  });
}

const title = computed(() => props.node.type === 'variable_set' ? 'Set Variable' : 'Get Variable');
const boolOptions = [{ label: 'False', value: false }, { label: 'True', value: true }];
</script>