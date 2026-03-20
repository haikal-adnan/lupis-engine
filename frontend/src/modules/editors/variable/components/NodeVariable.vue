<template>
  <PropertySection 
    :title="title" 
    :showMenu="false" 
    :defaultOpen="defaultOpen"
  >
    <template #header-extra>
      <IconButton 
        @click.stop="addVariable"
        tooltip="Add Variable"
        class="ml-auto"
      >
        <Plus class="w-3.5 h-3.5" />
      </IconButton>
    </template>

    <div class="space-y-2">
      <div 
        v-for="(v, idx) in variables" 
        :key="idx"
        draggable="true"
        @dragstart="onDragStart($event, v)"
        class="
            group relative flex flex-col gap-1.5 p-2 rounded border outline-none
            transition-all duration-200 select-none cursor-grab active:cursor-grabbing
            bg-card border-border text-muted-foreground 
            hover:bg-blue-500/5 hover:border-blue-500/30 hover:text-foreground
            dark:hover:bg-blue-500/10 dark:hover:border-blue-500/40
        "
      >
        <div class="flex items-center gap-2 h-6">
          <div class="flex items-center justify-center shrink-0 pl-1">
            <div 
              class="w-2.5 h-2.5 rounded-full shadow-sm border border-black/10"
              :style="{ backgroundColor: getVarColor(v.type) }"
            ></div>
          </div>

          <input 
            :value="v.name"
            @change="e => updateVariable(idx, 'name', e.target.value)"
            @mousedown.stop
            class="flex-1 bg-transparent border-none outline-none p-0 text-xs font-bold truncate 
                   text-foreground/80 group-hover:text-blue-600 dark:group-hover:text-blue-400
                   hover:underline decoration-dashed underline-offset-4 cursor-text"
            placeholder="Var Name"
          />

          <div class="shrink-0 flex items-center">
            <BaseDropdown align="right">
              <template #trigger>
                <IconButton ghost class="group-hover:text-blue-500">
                  <MoreVertical class="w-3.5 h-3.5" />
                </IconButton>
              </template>

              <template #default="{ close }">
                <div class="w-auto whitespace-nowrap flex flex-col py-1 text-xs min-w-[140px]">
                  <div class="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </div>
                  <button @click="handleAddNodeToCanvas(v, 'Get'); close()" class="flex items-center px-2 py-1.5 hover:bg-accent hover:text-accent-foreground text-left transition-colors">
                    <ArrowRightFromLine class="w-3.5 h-3.5 mr-2 text-primary" /> Add "Get" Node
                  </button>
                  <button @click="handleAddNodeToCanvas(v, 'Set'); close()" class="flex items-center px-2 py-1.5 hover:bg-accent hover:text-accent-foreground text-left transition-colors">
                    <ArrowLeftToLine class="w-3.5 h-3.5 mr-2 text-orange-500" /> Add "Set" Node
                  </button>

                  <div class="h-px bg-border my-1"></div>

                  <div class="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Change Type
                  </div>
                  <button 
                    v-for="t in ['String', 'Number', 'Boolean', 'List', 'Map']" 
                    :key="t"
                    @click="updateVariable(idx, 'type', t); close()"
                    class="flex items-center px-2 py-1.5 hover:bg-accent hover:text-accent-foreground text-left transition-colors"
                    :class="v.type === t ? 'text-primary font-medium bg-primary/5' : ''"
                  >
                    <div class="w-2.5 h-2.5 rounded-full mr-3 shadow-sm" :style="{ backgroundColor: getVarColor(t) }"></div>
                    {{ t }}
                  </button>
                  
                  <div class="h-px bg-border my-1"></div>
                  
                  <button @click="duplicateVariable(idx); close()" class="flex items-center px-2 py-1.5 hover:bg-accent hover:text-accent-foreground text-left transition-colors">
                    <Copy class="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Duplicate
                  </button>
                  <button @click="deleteVariable(idx); close()" class="flex items-center px-2 py-1.5 hover:bg-destructive/10 text-destructive text-left transition-colors">
                    <Trash2 class="w-3.5 h-3.5 mr-2" /> Delete
                  </button>
                </div>
              </template>
            </BaseDropdown>
          </div>
        </div>

        <div class="w-full mt-0.5" @mousedown.stop>
            <BaseSelect 
              v-if="v.type === 'Boolean'" 
              :model-value="v.defaultValue" 
              @update:model-value="val => updateVariable(idx, 'defaultValue', val)" 
              :options="boolOptions" 
              class="w-full" 
            />

            <BaseNumber 
              v-else-if="v.type === 'Number'" 
              :model-value="v.defaultValue" 
              @update:model-value="val => updateVariable(idx, 'defaultValue', val)" 
              class="w-full font-mono" 
            />
            
            <BaseButton 
              v-else-if="v.type === 'List' || v.type === 'Map'"
              @click="openCustomEditor(v.type, idx)"
              variant="outline"
              class="w-full h-7 text-[10px] gap-2 justify-center border-dashed"
            >
              <Settings2 class="w-3 h-3 opacity-70" />
              <span>Edit {{ v.type }} Default</span>
            </BaseButton>

            <BaseInput 
              v-else 
              :model-value="v.defaultValue" 
              @update:model-value="val => updateVariable(idx, 'defaultValue', val)" 
              placeholder="Empty string..." 
              class="w-full" 
            />
        </div>
      </div>

      <div v-if="variables.length === 0" class="text-[10px] text-muted-foreground text-center py-4 italic border border-dashed border-border/30 rounded select-none">
        No variables defined.
      </div>
    </div>
  </PropertySection>

  <StructuredDataEditor 
    :is-open="isEditorOpen"
    :variable="activeVariableData"
    @close="isEditorOpen = false"
    @save="saveComplexValue"
  />
</template>

<script setup>
import { 
  Plus, Trash2, MoreVertical, Copy, Settings2,
  ArrowRightFromLine, ArrowLeftToLine 
} from 'lucide-vue-next'; 
import { useVariableLogic } from '@editors/variable/composables/useVariableLogic.js';
import PropertySection from "@ui/display/PropertySection.vue";
import BaseDropdown from '@/commons/components/overlay/BaseDropdown.vue';
import BaseInput from '@/commons/components/inputs/BaseInput.vue';
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue';
import BaseButton from "@/commons/components/buttons/BaseButton.vue"; 
import IconButton from "@/commons/components/buttons/IconButton.vue";
import { useGraphEditor } from '@editors/graph/composables/useGraphEditor.js';
import StructuredDataEditor from '@editors/variable/views/StructuredDataEditor.vue';
import { ref } from 'vue'

const { getCenterPos } = useGraphEditor();

const props = defineProps({
  scope: { type: String, required: true },
  title: { type: String, default: 'Variables' },
  defaultOpen: { type: Boolean, default: true }
});

const { 
  variables, addVariable, updateVariable, duplicateVariable, deleteVariable, 
  onDragStart, getVarColor, addNodeToCanvas 
} = useVariableLogic(props.scope);

const handleAddNodeToCanvas = (variable, mode) => {
  const centerPos = getCenterPos();
  const NODE_WIDTH = 200; 
  const NODE_HEIGHT = 100; 
  const finalCenter = {
    x: centerPos.x - (NODE_WIDTH / 2),
    y: centerPos.y - (NODE_HEIGHT / 2)
  };
  addNodeToCanvas(variable, mode, finalCenter);
};

const isEditorOpen = ref(false);
const activeEditIndex = ref(null);
const activeVariableData = ref(null);

const openCustomEditor = (type, index) => {
  if (type === 'List' || type === 'Map') {
    activeEditIndex.value = index;
    activeVariableData.value = variables.value[index];
    isEditorOpen.value = true;
  }
};

const saveComplexValue = (newDataPayload) => {
  updateVariable(activeEditIndex.value, 'defaultValue', newDataPayload);
};

const boolOptions = [
  { label: 'False', value: false },
  { label: 'True', value: true }
];
</script>