<template>
  <div class="w-full">
    <component 
      v-if="CustomComponent" 
      :is="CustomComponent" 
      :node="selectedNode"
    />

    <PropertySection 
      v-else-if="selectedNode && (hasData || hasValues)" 
      title="Parameters" 
      :icon="Sliders"
    >
      <div v-for="(value, key) in selectedNode.data" :key="'data-'+key">
        <PropertyRow 
          v-if="shouldShowField(key)" 
          :label="formatLabel(key)"
        >
          <BaseCheckbox 
            v-if="typeof value === 'boolean'"
            :model-value="value"
            @update:model-value="updateData(key, $event)"
          />

          <BaseNumber 
            v-else-if="typeof value === 'number'"
            :model-value="value"
            @update:model-value="updateData(key, $event)"
            class="font-mono"
          />

          <BaseInput 
            v-else-if="typeof value !== 'object'"
            :model-value="value"
            @update:model-value="updateData(key, $event)"
          />
        </PropertyRow>
      </div>

      <template v-if="selectedNode.data?.values">
        <div v-for="(val, key) in selectedNode.data.values" :key="'val-'+key">
          <PropertyRow :label="formatLabel(key)">
            
            <div 
              v-if="isInputConnected(key)" 
              class="flex items-center gap-2 w-full p-1.5 bg-secondary/30 rounded border border-dashed border-primary/40 text-xs text-muted-foreground"
            >
              <Zap class="w-3 h-3 text-primary" />
              <span class="italic">Value from connection</span>
            </div>

            <template v-else>
              <BaseCheckbox 
                v-if="typeof val === 'boolean'"
                :model-value="val"
                @update:model-value="updateNodeValue(key, $event)"
              />
              <BaseNumber 
                v-else-if="typeof val === 'number'"
                :model-value="val"
                @update:model-value="updateNodeValue(key, $event)"
                class="font-mono"
              />
              <BaseInput 
                v-else-if="typeof val !== 'object'"
                :model-value="val"
                @update:model-value="updateNodeValue(key, $event)"
              />
            </template>
            
          </PropertyRow>
        </div>
      </template>

      <div 
        v-if="!hasVisibleData && !hasValues" 
        class="px-2 py-4 text-center text-xs text-muted-foreground italic"
      >
        No editable parameters.
      </div>
    </PropertySection>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Sliders, Zap } from 'lucide-vue-next';
import { useNodeLogic } from '@editors/node/composables/useNodeLogic.js';
import { useNodeRegistry } from '@editors/node/composables/useNodeRegistry.js';

import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseInput from '@/commons/components/inputs/BaseInput.vue';
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseCheckbox from '@/commons/components/inputs/BaseCheckbox.vue';

const { selectedNode, scriptStore, isInputConnected } = useNodeLogic();
const { getInspector } = useNodeRegistry();

const CustomComponent = computed(() => {
  if (!selectedNode.value) return null;
  return getInspector(selectedNode.value.type);
});

// Tambahkan 'values' agar tidak di-render berulang kali sebagai object mentah
const IGNORED_KEYS = ['propertyOptions', 'allowDynamicInputs', 'allowDynamicOutputs', 'mappings', 'values'];

const hasData = computed(() => {
  const data = selectedNode.value?.data || {};
  const keys = Object.keys(data);
  const validKeys = keys.filter(k => !IGNORED_KEYS.includes(k));
  return validKeys.length > 0;
});

const hasValues = computed(() => {
  const values = selectedNode.value?.data?.values || {};
  return Object.keys(values).length > 0;
});

const hasVisibleData = computed(() => {
  if (!hasData.value) return false;
  const fields = selectedNode.value?.settings?.visibleDataFields;
  if (fields && fields.length > 0) return true;
  return true;
});

function shouldShowField(key) {
  if (IGNORED_KEYS.includes(key)) return false;

  const fields = selectedNode.value?.settings?.visibleDataFields;
  if (Array.isArray(fields) && fields.length > 0) {
    return fields.includes(key);
  }
  return true;
}

function formatLabel(key) {
  if (typeof key !== 'string') return String(key);
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

// Update parameter reguler
function updateData(key, value) {
  scriptStore.updateNodeInActive(selectedNode.value._id, {
    data: { [key]: value }
  });
}

// Update nilai statis input (tersimpan di dalam objek `values`)
function updateNodeValue(key, value) {
  const currentValues = selectedNode.value.data?.values || {};
  scriptStore.updateNodeInActive(selectedNode.value._id, {
    data: { 
      values: { ...currentValues, [key]: value } 
    }
  });
}
</script>