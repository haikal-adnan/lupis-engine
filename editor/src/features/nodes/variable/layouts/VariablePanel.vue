<template>
  <div class="h-full flex flex-col bg-background relative w-full overflow-hidden" data-testid="variable-panel">
    <ScrollArea class="flex-1 h-full">
      <div class="p-2 flex flex-col gap-3 pb-24">
        <PropertySection 
          :title="title" 
          :showMenu="false" 
          :defaultOpen="defaultOpen"
        >
          <template #header-extra>
            <IconButton 
              @click.stop="openManager(activeScope)"
              tooltip="Manage Variables"
              data-testid="variable-panel-manage-btn"
              class="ml-auto"
            >
              <SlidersHorizontal class="w-3.5 h-3.5" />
            </IconButton>
          </template>

          <div class="space-y-3">
            <!-- Filter Scope -->
            <div class="flex items-center gap-1.5">
              <div class="flex items-center bg-muted/50 p-0.5 rounded-md border border-border flex-1">
                <button 
                  @click="activeScope = 'All'" data-testid="variable-panel-scope-all-btn"
                  class="flex-1 py-1 text-[10px] font-medium rounded transition-all text-center"
                  :class="activeScope === 'All' ? 'bg-background text-foreground font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'"
                >
                  All
                </button>
                <button 
                  @click="activeScope = 'Global'" data-testid="variable-panel-scope-global-btn"
                  class="flex-1 py-1 text-[10px] font-medium rounded transition-all flex items-center justify-center gap-1"
                  :class="activeScope === 'Global' ? 'bg-background text-primary font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'"
                >
                  <Globe class="w-3 h-3 text-sky-500" />
                  <span>Global</span>
                </button>
                <button 
                  @click="activeScope = 'Local'" data-testid="variable-panel-scope-local-btn"
                  class="flex-1 py-1 text-[10px] font-medium rounded transition-all flex items-center justify-center gap-1"
                  :class="activeScope === 'Local' ? 'bg-background text-primary font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'"
                >
                  <FileCode class="w-3 h-3 text-amber-500" />
                  <span>Local</span>
                </button>
              </div>
            </div>

            <!-- Helper Badge -->
            <div class="px-2 py-1 text-[9px] text-muted-foreground bg-muted/30 rounded border border-border flex items-center justify-between font-mono">
              <span><kbd class="px-1 bg-muted rounded text-[8px]">Ctrl</kbd> + Drag : Get</span>
              <span><kbd class="px-1 bg-muted rounded text-[8px]">Alt</kbd> + Drag : Set</span>
            </div>

            <!-- Variable List -->
            <div v-if="exposedVariables.length > 0" class="flex flex-col gap-2 pt-1">
              <div 
                v-for="item in exposedVariables" 
                :key="item.id"
                data-testid="variable-panel-item-row"
                :data-variable-name="item.name"
                :data-scope="item.scope"
                draggable="true"
                @dragstart="handleDragStart($event, item)"
                class="flex flex-col gap-1.5 p-2 rounded-lg border bg-card/60 shadow-sm transition-all cursor-grab active:cursor-grabbing select-none hover:border-primary/50"
                :class="item.scope === 'Global' ? 'border-sky-500/30' : 'border-amber-500/30'"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5 truncate">
                    <div 
                      class="w-2 h-2 rounded-full shrink-0"
                      :style="{ backgroundColor: getVarColor(item.type) }"
                    ></div>
                    <span class="font-bold text-xs truncate text-foreground/90">{{ item.name }}</span>
                  </div>
                  
                  <span 
                    class="text-[9px] font-semibold px-1.5 py-0.2 rounded flex items-center gap-1 border"
                    :class="item.scope === 'Global' 
                      ? 'bg-sky-500/10 text-sky-500 border-sky-500/20' 
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'"
                  >
                    <Globe v-if="item.scope === 'Global'" class="w-2.5 h-2.5" />
                    <FileCode v-else class="w-2.5 h-2.5" />
                    {{ item.scope }}
                  </span>
                </div>

                <div class="mt-0.5" @mousedown.stop>
                  <BaseSelect 
                    v-if="item.type?.toLowerCase() === 'boolean'" 
                    data-testid="variable-panel-value-bool-select"
                    :model-value="item.defaultValue"
                    @update:model-value="val => handleValueUpdate(item, val)"
                    :options="[
                      { label: 'False', value: false },
                      { label: 'True', value: true }
                    ]"
                    class="text-xs h-7"
                  />
                  <BaseNumber 
                    v-else-if="item.type?.toLowerCase() === 'number'" 
                    data-testid="variable-panel-value-number-input"
                    :model-value="item.defaultValue"
                    @update:model-value="val => handleValueUpdate(item, val)"
                    class="font-mono text-xs h-7" 
                  />
                  <BaseInput 
                    v-else-if="item.type?.toLowerCase() === 'string'"
                    data-testid="variable-panel-value-string-input"
                    :model-value="item.defaultValue"
                    @update:model-value="val => handleValueUpdate(item, val)"
                    placeholder="Value..." 
                    class="text-xs h-7" 
                  />
                  <div v-else class="text-[10px] text-muted-foreground italic px-1 py-0.5">
                    Configure List/Map structure in Modal
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-[10px] text-muted-foreground text-center py-4 italic border border-dashed border-border/40 rounded select-none">
              No exposed {{ activeScope === 'All' ? '' : activeScope.toLowerCase() }} variables for quick edit.
            </div>
          </div>
        </PropertySection>

        <!-- Hide NodeLibrary if active tab is of type 'code_editor' -->
        <NodeLibrary v-if="isGraphEditor" />
      </div>
    </ScrollArea>

    <VariableManagerModal
      :is-open="isManagerOpen"
      :initial-scope="modalScope"
      @close="isManagerOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { SlidersHorizontal, Globe, FileCode } from 'lucide-vue-next';
import { 
  PropertySection, 
  IconButton, 
  BaseInput, 
  BaseNumber, 
  BaseSelect,
  ScrollArea
} from '@components/components.js';
import { useVariableLogic, VariableManagerModal, NodeLibrary, useVariableConfig } from '@nodes/nodes.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';

const props = defineProps({
  scope: { type: String, default: 'Local' },
  title: { type: String, default: 'Variables' },
  defaultOpen: { type: Boolean, default: true }
});

const workspaceStore = useWorkspaceStore();
const { getVarColor } = useVariableConfig();

const isGraphEditor = computed(() => workspaceStore.activeTab?.type !== 'code_editor');

const isManagerOpen = ref(false);
const activeScope = ref('All'); 
const modalScope = ref('Local');

const globalLogic = useVariableLogic('Global');
const localLogic = useVariableLogic('Local');

const displayVariables = computed(() => {
  const globalVars = globalLogic.variables.value.map((v, idx) => ({ 
    ...v, 
    scope: 'Global', 
    originalIdx: idx 
  }));
  
  const localVars = localLogic.variables.value.map((v, idx) => ({ 
    ...v, 
    scope: 'Local', 
    originalIdx: idx 
  }));

  if (activeScope.value === 'Global') return globalVars;
  if (activeScope.value === 'Local') return localVars;
  return [...globalVars, ...localVars];
});

const exposedVariables = computed(() => displayVariables.value.filter(v => v.isExposed));

const handleValueUpdate = (item, newValue) => {
  if (item.scope === 'Global') {
    globalLogic.updateVariable(item.originalIdx, 'defaultValue', newValue);
  } else {
    localLogic.updateVariable(item.originalIdx, 'defaultValue', newValue);
  }
};

const openManager = (targetScope) => {
  modalScope.value = targetScope === 'All' ? 'Local' : targetScope;
  isManagerOpen.value = true;
};

const handleDragStart = (event, item) => {
  const targetLogic = item.scope === 'Global' ? globalLogic : localLogic;

  let actionType = 'variableGet';
  if (event.altKey) {
    actionType = 'variableSet';
  } else if (event.ctrlKey) {
    actionType = 'variableGet';
  }

  targetLogic.onDragStart(event, item, actionType);
};
</script>