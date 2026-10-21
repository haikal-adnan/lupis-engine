<template>
  <div class="w-full space-y-1.5" data-testid="node-inspector-variable-input-group">
    <!-- Main Control Row -->
    <div class="flex items-center gap-1.5 w-full">
      <div class="flex-1 min-w-0">
        <VariableSelect
          :model-value="bindingValue"
          :data-type="dataType"
          :disabled="disabled"
          @update:model-value="$emit('update:bindingValue', $event)"
          data-testid="node-inspector-var-group-select"
        />
      </div>

      <BaseDropdown v-if="!isStringType && modifierOptions.length > 0" align="right">
        <template #trigger="{ isOpen }">
          <button 
            type="button"
            :disabled="disabled"
            class="h-[30px] w-7 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent text-muted-foreground transition-colors shrink-0 disabled:opacity-50 outline-none"
            :class="{ 'bg-accent text-foreground border-primary': isOpen || hasActiveModifier }"
            title="Variable Modifier Options"
            data-testid="node-inspector-var-group-modifier-trigger"
          >
            <MoreVertical class="w-3.5 h-3.5" />
          </button>
        </template>

        <template #default="{ close }">
          <div class="flex flex-col text-xs min-w-[160px] p-1 space-y-0.5" data-testid="node-inspector-var-group-modifier-menu">
            <div class="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Apply Modifier ({{ dataType }})
            </div>

            <button 
              v-for="opt in modifierOptions" 
              :key="opt.value"
              @click="handleApplyModifier(opt.value, close)"
              class="dropdown-item"
              :class="{ 'font-bold text-primary': modifier.type === opt.value }"
              data-testid="node-inspector-var-group-modifier-option"
              :data-modifier-value="opt.value"
            >
              <span>{{ opt.label }}</span>
            </button>

            <div v-if="hasActiveModifier" class="h-px bg-border my-1"></div>

            <button 
              v-if="hasActiveModifier"
              @click="handleClearModifier(close)" 
              class="dropdown-item text-destructive hover:text-destructive hover:bg-destructive/10"
              data-testid="node-inspector-var-group-clear-modifier-btn"
            >
              <Trash2 class="w-3.5 h-3.5 mr-2" /> <span>Remove Modifier</span>
            </button>
          </div>
        </template>
      </BaseDropdown>
    </div>

    <!-- Additional Input Row -->
    <div v-if="isStringType" class="w-full">
      <BaseInput
        :model-value="customText"
        :disabled="disabled"
        placeholder="{value} {value.upper} {value.lower}"
        @update:model-value="handleUpdateCustomText"
        data-testid="node-inspector-var-group-custom-text-input"
      />
    </div>

    <div v-else-if="hasActiveModifier && showsNumberInput" class="w-full">
      <BaseNumber
        :model-value="modifier.value ?? 0"
        :prefix="modifierPrefix"
        :disabled="disabled || isValueInputDisabled"
        @update:model-value="handleUpdateModifierValue"
        class="font-mono text-xs w-full"
        data-testid="node-inspector-var-group-modifier-number-input"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { MoreVertical, Trash2 } from 'lucide-vue-next';
import { VariableSelect } from '@nodes/nodes.js';
import { BaseDropdown, BaseNumber, BaseInput } from '@components/components.js';

const props = defineProps({
  bindingValue: [String, Number],
  customText: { type: String, default: '' },
  dataType: { type: String, default: 'string' },
  modifier: { 
    type: Object, 
    default: () => ({ type: 'none', value: 0 }) 
  },
  disabled: Boolean
});

const emit = defineEmits([
  'update:bindingValue', 
  'update:customText', 
  'update:modifier', 
  'clear:modifier'
]);

const isStringType = computed(() => {
  const type = (props.dataType || 'string').toLowerCase();
  return type === 'string' || type === 'text';
});

const hasActiveModifier = computed(() => {
  return props.modifier && props.modifier.type && props.modifier.type !== 'none';
});

const modifierOptions = computed(() => {
  const type = (props.dataType || 'string').toLowerCase();

  if (type === 'number') {
    return [
      { label: 'Add (+)', value: 'add' },
      { label: 'Subtract (-)', value: 'subtract' },
      { label: 'Multiply (×)', value: 'multiply' },
      { label: 'Divide (÷)', value: 'divide' },
      { label: 'Invert (-X)', value: 'invert' },
      { label: 'Absolute (|X|)', value: 'abs' }
    ];
  } else if (type === 'boolean') {
    return [{ label: 'Invert (NOT !)', value: 'not' }];
  } else if (type === 'list') {
    return [
      { label: 'At Index', value: 'at_index' },
      { label: 'First Item', value: 'first' },
      { label: 'Last Item', value: 'last' },
      { label: 'Random Item', value: 'random' },
      { label: 'Count Length', value: 'count' }
    ];
  }

  return [];
});

const showsNumberInput = computed(() => {
  return ['add', 'subtract', 'multiply', 'divide', 'at_index', 'invert', 'abs'].includes(props.modifier?.type);
});

const isValueInputDisabled = computed(() => {
  return ['invert', 'abs', 'not'].includes(props.modifier?.type);
});

const modifierPrefix = computed(() => {
  switch (props.modifier?.type) {
    case 'add': return '+';
    case 'subtract': return '-';
    case 'multiply': return '×';
    case 'divide': return '÷';
    case 'at_index': return '#';
    case 'invert': return '-X';
    case 'abs': return '|X|';
    default: return '';
  }
});

function handleUpdateCustomText(val) {
  emit('update:customText', val);
}

function handleApplyModifier(type, close) {
  let defaultVal = 0;
  if (props.dataType === 'boolean') {
    defaultVal = false;
  } else if (props.dataType === 'string') {
    defaultVal = '';
  }

  const val = props.modifier?.value ?? defaultVal;
  emit('update:modifier', { type, value: val });
  if (typeof close === 'function') close();
}

function handleClearModifier(close) {
  emit('clear:modifier');
  if (typeof close === 'function') close();
}

function handleUpdateModifierValue(val) {
  emit('update:modifier', { ...props.modifier, value: Number(val) || 0 });
}
</script>

<style scoped>
.dropdown-item {
  @apply flex items-center px-2 py-1.5 mx-1 rounded-sm hover:bg-accent hover:text-accent-foreground text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer;
}
</style>