<template>
  <div v-if="selectedEdge" class="w-full space-y-3">
    <!-- Section Header Edge -->
    <PropertySection title="Edge Modifier" :icon="GitCommit">
      <!-- Info Port Koneksi -->
      <div class="px-2 py-1.5 bg-secondary/20 border border-border rounded text-[10px] space-y-1 font-mono">
        <div class="flex items-center justify-between text-muted-foreground">
          <span>From: <strong class="text-foreground">{{ sourceNodeTitle }}</strong> ({{ selectedEdge.sourceHandle }})</span>
        </div>
        <div class="flex items-center justify-between text-muted-foreground">
          <span>To: <strong class="text-foreground">{{ targetNodeTitle }}</strong> ({{ selectedEdge.targetHandle }})</span>
        </div>
      </div>

      <!-- Callout / Panduan untuk Tipe Data List & Map -->
      <div 
        v-if="['list', 'map'].includes(edgeDataType)" 
        class="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] text-amber-500 leading-tight space-y-1"
      >
        <p class="font-medium">Opsi Operasi Ditutup</p>
        <p class="text-[10px] opacity-90">
          Manipulasi data <strong>{{ edgeDataType.toUpperCase() }}</strong> dilakukan via node library khusus (misal: <em>List Get Item</em>, <em>Map Get Value</em>) agar eksekusi data lebih terstruktur.
        </p>
      </div>

      <!-- Tipe Operasi / Modifier (Hanya Muncul untuk Tipe Data Non-Koleksi) -->
      <PropertyRow v-else label="Operation">
        <BaseSelect
          :model-value="selectedEdge.modifier?.type || 'none'"
          :options="availableModifierOptions"
          @update:model-value="updateModifierType"
        />
      </PropertyRow>

      <!-- Input Value untuk Operasi Number / String -->
      <PropertyRow v-if="needsValueInput" :label="valueInputLabel">
        <BaseNumber
          v-if="edgeDataType === 'number'"
          :model-value="selectedEdge.modifier?.value ?? 0"
          @update:model-value="updateModifierValue"
          class="font-mono w-full"
        />
        <BaseInput
          v-else
          :model-value="selectedEdge.modifier?.value ?? ''"
          @update:model-value="updateModifierValue"
          placeholder="Enter value..."
          class="w-full"
        />
      </PropertyRow>

      <!-- Quick Action: Remove Edge -->
      <div class="pt-2 border-t border-border flex justify-between items-center text-[10px]">
        <span class="text-muted-foreground font-mono truncate max-w-[120px]">ID: {{ selectedEdge.id }}</span>
        <IconButton
          @click="deleteSelectedEdge"
          tooltip="Remove Connection"
          variant="ghost"
          size="xs"
          class="text-destructive hover:bg-destructive/10"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </IconButton>
      </div>
    </PropertySection>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { GitCommit, Trash2 } from 'lucide-vue-next';
import { useScriptStore } from '@scripts/scripts.js';
import { 
  PropertySection, 
  PropertyRow, 
  BaseSelect, 
  BaseNumber, 
  BaseInput, 
  IconButton 
} from '@components/components.js';

const scriptStore = useScriptStore();

const selectedEdge = computed(() => {
  if (!scriptStore.activeScript || !scriptStore.selectedEdgeId) return null;
  return scriptStore.activeScript.edges.find(e => e.id === scriptStore.selectedEdgeId);
});

const sourceNode = computed(() => {
  if (!selectedEdge.value || !scriptStore.activeScript) return null;
  return scriptStore.activeScript.nodes.find(n => n.id === selectedEdge.value.source);
});

const targetNode = computed(() => {
  if (!selectedEdge.value || !scriptStore.activeScript) return null;
  return scriptStore.activeScript.nodes.find(n => n.id === selectedEdge.value.target);
});

const sourceNodeTitle = computed(() => sourceNode.value?.settings?.headerTitle || sourceNode.value?.type || 'Node');
const targetNodeTitle = computed(() => targetNode.value?.settings?.headerTitle || targetNode.value?.type || 'Node');

const edgeDataType = computed(() => {
  if (!sourceNode.value || !selectedEdge.value) return 'any';
  const port = sourceNode.value.outputs?.find(p => p.id === selectedEdge.value.sourceHandle);
  return (port?.dataType || 'any').toLowerCase();
});

const availableModifierOptions = computed(() => {
  const type = edgeDataType.value;

  if (type === 'number') {
    return [
      { label: 'None (Pass Through)', value: 'none' },
      { label: 'Add (+)', value: 'add' },
      { label: 'Subtract (-)', value: 'subtract' },
      { label: 'Multiply (x)', value: 'multiply' },
      { label: 'Divide (÷)', value: 'divide' },
      { label: 'Invert (-X)', value: 'invert' },
      { label: 'Absolute (|X|)', value: 'abs' }
    ];
  } else if (type === 'string') {
    return [
      { label: 'None (Pass Through)', value: 'none' },
      { label: 'Append (Suffix)', value: 'append' },
      { label: 'Prepend (Prefix)', value: 'prepend' },
      { label: 'Uppercase', value: 'uppercase' },
      { label: 'Lowercase', value: 'lowercase' },
      { label: 'Trim', value: 'trim' }
    ];
  } else if (type === 'boolean') {
    return [
      { label: 'None (Pass Through)', value: 'none' },
      { label: 'Invert (NOT !)', value: 'not' }
    ];
  }

  return [{ label: 'None (Pass Through)', value: 'none' }];
});

const needsValueInput = computed(() => {
  const modType = selectedEdge.value?.modifier?.type;
  return ['add', 'subtract', 'multiply', 'divide', 'append', 'prepend'].includes(modType);
});

const valueInputLabel = computed(() => {
  return 'Operand Value';
});

function updateModifierType(type) {
  if (!selectedEdge.value) return;
  scriptStore.updateEdgeModifier(selectedEdge.value.id, {
    type,
    value: selectedEdge.value.modifier?.value ?? (edgeDataType.value === 'number' ? 0 : '')
  });
}

function updateModifierValue(val) {
  if (!selectedEdge.value) return;
  scriptStore.updateEdgeModifier(selectedEdge.value.id, {
    type: selectedEdge.value.modifier?.type || 'none',
    value: val
  });
}

function deleteSelectedEdge() {
  if (selectedEdge.value) {
    scriptStore.removeEdgeFromActive(selectedEdge.value.id);
    scriptStore.selectedEdgeId = null;
  }
}
</script>