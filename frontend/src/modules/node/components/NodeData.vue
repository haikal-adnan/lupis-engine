<template>
  <PropertySection title="Parameters" :icon="Sliders" v-if="selectedNode && hasData">
    
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
            v-else
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
</template>

<script setup>
import { computed } from 'vue';
import { Sliders, Zap } from 'lucide-vue-next'; // Tambah icon Zap
import { useNodeLogic } from '@/modules/node/composables/useNodeLogic.js';

// Atomic Components
import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseInput from '@/commons/components/inputs/BaseInput.vue';
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseCheckbox from '@/commons/components/inputs/BaseCheckbox.vue';

// Ambil isInputConnected dari composable
const { selectedNode, scriptStore, isInputConnected } = useNodeLogic();

const hasData = computed(() => Object.keys(selectedNode.value?.data || {}).length > 0);
const hasVisibleData = computed(() => {
    const fields = selectedNode.value?.settings?.visibleDataFields;
    if (fields && fields.length > 0) return true;
    return hasData.value;
});

function shouldShowField(key) {
    const fields = selectedNode.value?.settings?.visibleDataFields;
    if (Array.isArray(fields) && fields.length > 0) {
        return fields.includes(key);
    }
    return true; 
}

function formatLabel(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

function updateData(key, value) {
    // Kita kirim object partial saja, Store yang akan handle merging
    scriptStore.updateNodeInActive(selectedNode.value._id, {
        data: { [key]: value }
    });
}
</script>