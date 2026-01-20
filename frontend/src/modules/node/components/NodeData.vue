<template>
  <PropertySection title="Parameters" :icon="Sliders" v-if="selectedNode && hasData">
    
    <div v-for="(value, key) in selectedNode.data" :key="key">
      
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
          v-else
          :model-value="value"
          @update:model-value="updateData(key, $event)"
        />

      </PropertyRow>
    </div>

    <div v-if="!hasVisibleData" class="px-2 py-4 text-center text-xs text-muted-foreground italic">
      No editable parameters.
    </div>

  </PropertySection>
</template>

<script setup>
import { computed } from 'vue';
import { Sliders } from 'lucide-vue-next';
import { useNodeLogic } from '@/modules/node/composables/useNodeLogic.js';

// Atomic Components
import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseInput from '@/commons/components/inputs/BaseInput.vue';
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseCheckbox from '@/commons/components/inputs/BaseCheckbox.vue';

const { selectedNode, scriptStore } = useNodeLogic();

const hasData = computed(() => Object.keys(selectedNode.value?.data || {}).length > 0);

// Helper untuk mengecek visibleDataFields (jika ada di settings)
// Jika array kosong/undefined, tampilkan semua data.
const hasVisibleData = computed(() => {
    const fields = selectedNode.value?.settings?.visibleDataFields;
    if (fields && fields.length > 0) return true;
    return hasData.value;
});

function shouldShowField(key) {
    const fields = selectedNode.value?.settings?.visibleDataFields;
    // Jika visibleDataFields didefinisikan, hanya tampilkan yg ada di list
    if (Array.isArray(fields) && fields.length > 0) {
        return fields.includes(key);
    }
    return true; // Default tampilkan semua
}

function formatLabel(key) {
    // camelCase to Normal Case
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

function updateData(key, value) {
    scriptStore.updateNodeInActive(selectedNode.value._id, {
        [`data.${key}`]: value
    });
}
</script>