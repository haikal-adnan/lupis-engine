<template>
  <div class="relative w-full" ref="containerRef" data-testid="node-inspector-variable-select">
    <!-- Trigger Button -->
    <button
      type="button"
      @click="toggleDropdown"
      :disabled="disabled"
      class="w-full flex items-center justify-between px-2.5 py-1.5 text-xs bg-background border border-border rounded-md hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      :class="{ 'border-primary': isOpen }"
      data-testid="node-inspector-variable-select-trigger"
    >
      <div class="flex items-center gap-1.5 truncate min-w-0">
        <template v-if="selectedVariable">
          <!-- Badge Scope -->
          <span
            class="text-[9px] px-1 py-0.2 rounded font-semibold uppercase tracking-wider shrink-0"
            :class="selectedVariable.scope === 'Global' 
              ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' 
              : 'bg-purple-500/10 text-purple-500 border border-purple-500/20'"
            data-testid="node-inspector-variable-select-scope-badge"
          >
            {{ selectedVariable.scope }}
          </span>
          <div
            class="w-2 h-2 rounded-full shrink-0"
            :style="{ backgroundColor: getVarColor(selectedVariable.type) }"
          ></div>
          <span class="font-medium truncate text-foreground" data-testid="node-inspector-variable-select-selected-name">{{ selectedVariable.name }}</span>
        </template>
        <span v-else class="text-muted-foreground italic" data-testid="node-inspector-variable-select-placeholder">
          {{ filterByType && dataType ? `Choose (${dataType})...` : 'Choose Variable...' }}
        </span>
      </div>
      <ChevronDown class="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-1" />
    </button>

    <!-- Dropdown Panel -->
    <div
      v-if="isOpen"
      class="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden flex flex-col max-h-56"
      data-testid="node-inspector-variable-select-dropdown"
    >
      <!-- Search Input -->
      <div class="p-1.5 border-b border-border bg-muted/30">
        <div class="relative flex items-center">
          <Search class="w-3 h-3 absolute left-2 text-muted-foreground" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search variable..."
            class="w-full bg-background text-xs pl-6 pr-2 py-1 rounded border border-border focus:outline-none focus:border-primary text-foreground"
            @click.stop
            data-testid="node-inspector-variable-select-search-input"
          />
        </div>
      </div>

      <!-- Variable List Option -->
      <div class="overflow-y-auto flex-1 p-1 custom-scroll">
        <template v-if="filteredVariables.length > 0">
          <button
            v-for="v in filteredVariables"
            :key="v.id"
            type="button"
            @click="selectVariable(v)"
            class="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs hover:bg-muted/80 transition-colors text-left group"
            :class="{ 'bg-primary/10 text-primary font-semibold': modelValue === v.id }"
            data-testid="node-inspector-variable-select-option"
            :data-variable-id="v.id"
            :data-variable-name="v.name"
          >
            <div class="flex items-center gap-2 truncate">
              <div
                class="w-2 h-2 rounded-full shrink-0"
                :style="{ backgroundColor: getVarColor(v.type) }"
              ></div>
              <span class="truncate">{{ v.name }}</span>
            </div>
            
            <span
              class="text-[9px] px-1 py-0.2 rounded font-mono uppercase tracking-tighter ml-2 shrink-0 opacity-80"
              :class="v.scope === 'Global' 
                ? 'bg-blue-500/10 text-blue-400' 
                : 'bg-purple-500/10 text-purple-400'"
            >
              {{ v.scope }}
            </span>
          </button>
        </template>
        
        <div v-else class="px-2 py-3 text-center text-xs text-muted-foreground italic" data-testid="node-inspector-variable-select-no-results">
          No variables found{{ filterByType && dataType ? ` for type ${dataType}` : '' }}.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ChevronDown, Search } from 'lucide-vue-next';
import { useScriptStore } from '@scripts/scripts.js';
import { useProjectStore } from '@projects/projects.js';
import { useVariableConfig } from '@nodes/nodes.js';

const props = defineProps({
  modelValue: { type: String, default: null },
  dataType: { type: String, default: 'string' },
  filterByType: { type: Boolean, default: true }, 
  disabled: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

const scriptStore = useScriptStore();
const projectStore = useProjectStore();
const { getVarColor } = useVariableConfig();

const isOpen = ref(false);
const searchQuery = ref('');
const containerRef = ref(null);

const allVariables = computed(() => {
  const globals = (projectStore.activeProject?.globalVariables || []).map(v => ({ ...v, scope: 'Global' }));
  const locals = (scriptStore.activeScript?.localVariables || []).map(v => ({ ...v, scope: 'Local' }));
  return [...globals, ...locals];
});

const filteredVariables = computed(() => {
  return allVariables.value.filter(v => {
    if (props.filterByType && props.dataType) {
      const targetType = props.dataType.toLowerCase();
      const varType = (v.type || '').toLowerCase();
      
      let matchesType = false;
      if (['number', 'float', 'int'].includes(targetType) && ['number', 'float', 'int'].includes(varType)) matchesType = true;
      else if (['boolean', 'bool'].includes(targetType) && ['boolean', 'bool'].includes(varType)) matchesType = true;
      else if (['string', 'text'].includes(targetType) && ['string', 'text'].includes(varType)) matchesType = true;
      else if (targetType === 'any' || varType === 'any') matchesType = true;
      else matchesType = targetType === varType;

      if (!matchesType) return false;
    }

    if (!searchQuery.value.trim()) return true;
    return v.name.toLowerCase().includes(searchQuery.value.trim().toLowerCase());
  });
});

const selectedVariable = computed(() => {
  return allVariables.value.find(v => v.id === props.modelValue);
});

function toggleDropdown() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) searchQuery.value = '';
}

function selectVariable(variable) {
  emit('update:modelValue', variable.id);
  isOpen.value = false;
}

function handleClickOutside(event) {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    isOpen.value = false;
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));
</script>