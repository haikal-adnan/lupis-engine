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
          <BaseSelect 
            v-if="typeof value === 'boolean'"
            :model-value="value"
            :options="booleanOptions"
            @update:model-value="updateData(key, $event)"
          />

          <BaseNumber 
            v-else-if="typeof value === 'number'"
            :model-value="value"
            @update:model-value="updateData(key, $event)"
            class="font-mono"
          />

          <BaseInput 
            v-else-if="isPrimitive(value)"
            :model-value="value"
            @update:model-value="updateData(key, $event)"
          />
        </PropertyRow>
      </div>

      <template v-if="selectedNode.data?.values">
        <div v-for="(val, key) in selectedNode.data.values" :key="'val-'+key">
          <PropertyRow :label="formatLabel(key)">
            
            <div class="relative w-full">
              <div class="absolute -top-3 right-0 text-[9px] font-mono z-10 px-1 rounded bg-background/80 flex gap-1">
                <span v-if="isInputConnected(key)" class="text-green-400 animate-pulse font-bold">
                  LINKED
                </span>
                <span v-else-if="isErrorNotSet(key, val)" class="text-red-500 font-bold uppercase tracking-tighter">
                  NOT SET
                </span>
              </div>

              <div :class="{ 
                'opacity-40 pointer-events-none filter grayscale': isInputConnected(key),
                'border-red-500/20': !isInputConnected(key) && isErrorNotSet(key, val) 
              }">
                
                <BaseSelect 
                  v-if="hasOptions(key)"
                  :model-value="val"
                  :options="getOptions(key)"
                  placeholder="Choose option..."
                  @update:model-value="updateNodeValue(key, $event)"
                />

                <BaseSelect 
                  v-else-if="getInputDataType(key, val) === 'boolean'"
                  :model-value="val"
                  :options="booleanOptions"
                  placeholder="Choose..."
                  @update:model-value="updateNodeValue(key, $event)"
                />

                <BaseNumber 
                  v-else-if="getInputDataType(key, val) === 'number'"
                  :model-value="val"
                  @update:model-value="updateNodeValue(key, $event)"
                  class="font-mono w-full"
                  :placeholder="getPlaceholder(key, val, 'Number')"
                />

                <BaseInput 
                  v-else
                  :model-value="val"
                  @update:model-value="updateNodeValue(key, $event)"
                  class="w-full"
                  :placeholder="getPlaceholder(key, val, 'String')"
                />
              </div>
            </div>
            
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
import { Sliders } from 'lucide-vue-next';
import { useNodeLogic } from '@editors/node/composables/useNodeLogic.js';
import { useNodeRegistry } from '@editors/node/composables/useNodeRegistry.js';

import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseInput from '@/commons/components/inputs/BaseInput.vue';
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue';

const { selectedNode, scriptStore, isInputConnected } = useNodeLogic();
const { getInspector } = useNodeRegistry();

const booleanOptions = [
  { label: 'True', value: true },
  { label: 'False', value: false }
];

const CustomComponent = computed(() => {
  if (!selectedNode.value) return null;
  return getInspector(selectedNode.value.type);
});

const IGNORED_KEYS = ['propertyOptions', 'allowDynamicInputs', 'allowDynamicOutputs', 'mappings', 'values', 'options'];

/**
 * Helper: Cek apakah nilai kosong/null
 */
function isNotSet(value) {
  return value === undefined || value === null || value === '';
}

function isErrorNotSet(key, value) {
  if (String(key).startsWith('target_in')) return false; 
  return isNotSet(value);
}

function getPlaceholder(key, value, type) {
  if (String(key).startsWith('target_in') && isNotSet(value)) {
    return 'self';
  }
  if (isNotSet(value)) {
    return `Empty ${type}...`;
  }
  return '';
}

function hasOptions(key) {
  return !!selectedNode.value?.data?.options?.[key];
}

function getOptions(key) {
  return selectedNode.value?.data?.options?.[key] || [];
}

function isPrimitive(val) {
  return val !== null && typeof val !== 'object';
}

function getInputDataType(key, val) {
  if (val !== null && val !== undefined && val !== '') {
    return typeof val;
  }

  const node = selectedNode.value;
  if (node && node.inputs) {
    const port = node.inputs.find(p => p._id === String(key));
    if (port && port.dataType) {
      const type = port.dataType.toLowerCase();
      if (['number', 'float', 'int'].includes(type)) return 'number';
      if (['boolean', 'bool'].includes(type)) return 'boolean';
      if (['string', 'text'].includes(type)) return 'string';
    }
  }

  const lowerKey = String(key).toLowerCase();
  const boolKeys = ['active', 'visible', 'enabled', 'loop', 'istrigger', 'solid', 'collision'];
  const numKeys = ['width', 'height', 'size', 'x', 'y', 'z', 'opacity', 'speed', 'mass', 'scale', 'radius', 'margin', 'fontsize'];
  
  if (boolKeys.some(k => lowerKey.includes(k))) return 'boolean';
  if (numKeys.some(k => lowerKey.includes(k))) return 'number';
  
  return 'string';
}

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

function updateData(key, value) {
  scriptStore.updateNodeInActive(selectedNode.value._id, {
    data: { [key]: value }
  });
}

function updateNodeValue(key, value) {
  const currentValues = selectedNode.value.data?.values || {};
  scriptStore.updateNodeInActive(selectedNode.value._id, {
    data: { 
      values: { ...currentValues, [key]: value } 
    }
  });
}
</script>

<style scoped>
.filter {
  transition: all 0.2s ease-in-out;
}
</style>