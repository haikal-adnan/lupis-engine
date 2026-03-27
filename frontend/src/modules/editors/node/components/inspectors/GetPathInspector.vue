<template>
  <div class="w-full">
    <PropertySection title="Multi Path Configuration" :icon="ListTree">
      
      <PropertyRow label="Path">
        <div class="relative w-full">
          <div class="absolute -top-3 right-0 text-[9px] font-mono z-10 px-1 rounded bg-background/80 flex gap-1">
            <span v-if="isInputConnected('path_in')" class="text-green-400 animate-pulse font-bold">
              LINKED
            </span>
            <span v-else-if="isErrorNotSet('path_in', selectedNode.data?.values?.path)" class="text-red-500 font-bold uppercase tracking-tighter">
              NOT SET
            </span>
          </div>

          <div :class="{ 
            'opacity-40 pointer-events-none filter grayscale': isInputConnected('path_in'),
            'border border-red-500/50 rounded-md': !isInputConnected('path_in') && isErrorNotSet('path_in', selectedNode.data?.values?.path)
          }">
            <BaseInput 
              :model-value="selectedNode.data?.values?.path || ''"
              @update:model-value="updateBaseValue($event)"
              placeholder="e.g. player.stats.hp"
            />
          </div>
        </div>
      </PropertyRow>

      <div v-for="dynamic in dynamicPaths" :key="dynamic.id" class="mt-2">
        <PropertyRow :label="`Path ${dynamic.id}`">
          <div class="relative w-full flex items-center gap-1">
            
            <div class="absolute -top-3 right-8 text-[9px] font-mono z-10 px-1 rounded bg-background/80 flex gap-1">
              <span v-if="isInputConnected(`path_in_${dynamic.id}`)" class="text-green-400 animate-pulse font-bold">
                LINKED
              </span>
              <span v-else-if="isErrorNotSet(`path_in_${dynamic.id}`, selectedNode.data?.values?.[`path_in_${dynamic.id}`])" class="text-red-500 font-bold uppercase tracking-tighter">
                NOT SET
              </span>
            </div>
            
            <div 
              class="flex-1" 
              :class="{ 
                'opacity-40 pointer-events-none filter grayscale': isInputConnected(`path_in_${dynamic.id}`),
                'border border-red-500/50 rounded-md': !isInputConnected(`path_in_${dynamic.id}`) && isErrorNotSet(`path_in_${dynamic.id}`, selectedNode.data?.values?.[`path_in_${dynamic.id}`])
              }"
            >
              <BaseInput 
                :model-value="selectedNode.data?.values?.[`path_in_${dynamic.id}`] || ''"
                @update:model-value="updateDynamicValue(`path_in_${dynamic.id}`, $event)"
                placeholder="e.g. inventory[0].id"
              />
            </div>
            
            <IconButton 
              @click="removePath(dynamic.id)" 
              variant="ghost" 
              size="xs" 
              class="shrink-0 hover:bg-red-500/10"
              tooltip="Remove Path"
            >
              <Trash2 class="w-3.5 h-3.5 text-red-400" />
            </IconButton>
          </div>
        </PropertyRow>
      </div>

      <button 
        @click="addPath" 
        class="w-full flex items-center justify-center gap-1 mt-3 py-1.5 text-[10px] border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 rounded transition-colors group"
      >
        <Plus class="w-3 h-3 group-hover:scale-110 transition-transform" />
        <span>Add Path</span>
      </button>

    </PropertySection>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ListTree, Trash2, Plus } from 'lucide-vue-next';
import { useNodeLogic } from '@editors/node/composables/useNodeLogic.js';
import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseInput from '@/commons/components/inputs/BaseInput.vue';
import IconButton from '@/commons/components/buttons/IconButton.vue';

const { selectedNode, scriptStore, isInputConnected } = useNodeLogic();

/**
 * Helper: Cek apakah nilai kosong/null
 */
function isNotSet(value) {
  return value === undefined || value === null || value === '';
}

/**
 * Helper: Pengecekan error untuk status "NOT SET"
 */
function isErrorNotSet(key, value) {
  return isNotSet(value);
}

const dynamicPaths = computed(() => {
  if (!selectedNode.value?.inputs) return [];
  
  return selectedNode.value.inputs
    .filter(port => port._id.startsWith('path_in_'))
    .map(port => {
      const idStr = port._id.replace('path_in_', '');
      return { id: parseInt(idStr) };
    })
    .sort((a, b) => a.id - b.id);
});

function updateBaseValue(value) {
  const currentValues = selectedNode.value.data?.values || {};
  scriptStore.updateNodeInActive(selectedNode.value._id, {
    data: { values: { ...currentValues, path: value } }
  });
}

function updateDynamicValue(key, value) {
  const currentValues = selectedNode.value.data?.values || {};
  scriptStore.updateNodeInActive(selectedNode.value._id, {
    data: { values: { ...currentValues, [key]: value } }
  });
}

function addPath() {
  const currentIds = dynamicPaths.value.map(p => p.id);
  let newId = 1;
  while (currentIds.includes(newId)) {
    newId++;
  }

  const inputId = `path_in_${newId}`;
  const outputId = `result_${newId}`;

  const newInputs = [
    ...selectedNode.value.inputs,
    { _id: inputId, label: `Path ${newId}`, dataType: 'string', color: '#FFB74D' }
  ];

  const newOutputs = [
    ...selectedNode.value.outputs,
    { _id: outputId, label: `Value ${newId}`, dataType: 'any', color: '#FFFFFF' }
  ];

  const newValues = { 
    ...selectedNode.value.data?.values, 
    [inputId]: '' 
  };

  scriptStore.updateNodeInActive(selectedNode.value._id, {
    inputs: newInputs,
    outputs: newOutputs,
    data: { ...selectedNode.value.data, values: newValues }
  });
}

function removePath(id) {
  const inputId = `path_in_${id}`;
  const outputId = `result_${id}`;

  const newInputs = selectedNode.value.inputs.filter(p => p._id !== inputId);
  const newOutputs = selectedNode.value.outputs.filter(p => p._id !== outputId);
  
  const newValues = { ...selectedNode.value.data?.values };
  delete newValues[inputId]; 

  scriptStore.updateNodeInActive(selectedNode.value._id, {
    inputs: newInputs,
    outputs: newOutputs,
    data: { ...selectedNode.value.data, values: newValues }
  });
}
</script>

<style scoped>
.filter {
  transition: all 0.2s ease-in-out;
}
</style>