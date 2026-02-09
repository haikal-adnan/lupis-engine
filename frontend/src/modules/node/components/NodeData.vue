<template>
  <div class="w-full">
    
    <component 
      v-if="CustomComponent" 
      :is="CustomComponent" 
      :node="selectedNode"
    />

    <PropertySection 
      v-else-if="selectedNode && hasData" 
      title="Parameters" 
      :icon="Sliders"
    >
      
      <div v-for="(value, key) in selectedNode.data" :key="key">
        
        <PropertyRow 
          v-if="shouldShowField(key)" 
          :label="formatLabel(key)"
        >
          <div 
            v-if="isInputConnected(key)" 
            class="flex items-center gap-2 w-full p-1.5 bg-secondary/30 rounded border border-dashed border-primary/40 text-xs text-muted-foreground"
          >
            <Zap class="w-3 h-3 text-primary" />
            <span class="italic">Value from connection</span>
          </div>

          <template v-else>
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
          </template>

        </PropertyRow>
      </div>

      <div v-if="!hasVisibleData" class="px-2 py-4 text-center text-xs text-muted-foreground italic">
        No editable parameters.
      </div>

    </PropertySection>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Sliders, Zap } from 'lucide-vue-next';
import { useNodeLogic } from '@/modules/node/composables/useNodeLogic.js';
import { useNodeRegistry } from '@/modules/node/composables/useNodeRegistry.js'; // ✅ Import Registry Baru

// Atomic Components
import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseInput from '@/commons/components/inputs/BaseInput.vue';
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseCheckbox from '@/commons/components/inputs/BaseCheckbox.vue';

const { selectedNode, scriptStore, isInputConnected } = useNodeLogic();
const { getInspector } = useNodeRegistry(); // ✅ Gunakan composable registry

// --- LOGIC DISPATCHER ---
// Cek apakah ada Custom Component untuk tipe node ini
const CustomComponent = computed(() => {
  if (!selectedNode.value) return null;
  console.log(selectedNode.value.type)
  return getInspector(selectedNode.value.type);
});

// --- LOGIC GENERIC INSPECTOR ---

// Daftar key internal yang TIDAK BOLEH dirender di Parameters
const IGNORED_KEYS = ['propertyOptions', 'allowDynamicInputs', 'allowDynamicOutputs', 'mappings']; 

// 1. Cek apakah ada data valid (selain key internal)
const hasData = computed(() => {
    const data = selectedNode.value?.data || {};
    const keys = Object.keys(data);
    // Filter key yang bukan internal
    const validKeys = keys.filter(k => !IGNORED_KEYS.includes(k));
    return validKeys.length > 0;
});

// 2. Cek apakah data valid tersebut visible (berdasarkan settings)
const hasVisibleData = computed(() => {
    if (!hasData.value) return false;
    
    const fields = selectedNode.value?.settings?.visibleDataFields;
    // Jika ada whitelist fields, pastikan ada isinya
    if (fields && fields.length > 0) return true;
    
    // Jika tidak ada whitelist, defaultnya tampil semua (selama hasData true)
    return true;
});

function shouldShowField(key) {
    // A. Filter Mutlak: Jangan tampilkan key internal
    if (IGNORED_KEYS.includes(key)) return false;

    // B. Filter Whitelist (jika diatur di node settings)
    const fields = selectedNode.value?.settings?.visibleDataFields;
    if (Array.isArray(fields) && fields.length > 0) {
        return fields.includes(key);
    }
    
    return true; 
}

function formatLabel(key) {
    // Safety check agar tidak crash jika key aneh
    if (typeof key !== 'string') return String(key);
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

function updateData(key, value) {
    scriptStore.updateNodeInActive(selectedNode.value._id, {
        data: { [key]: value }
    });
}
</script>