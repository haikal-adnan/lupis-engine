<template>
  <PropertySection 
    :title="title" 
    :showMenu="false" 
    :defaultOpen="defaultOpen"
  >
    <template #header-extra>
      <button 
        @click.stop="addVariable"
        class="ml-auto p-0.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
        title="Add Variable"
      >
        <Plus class="w-3.5 h-3.5" />
      </button>
    </template>

    <div class="space-y-2">
      <div 
        v-for="(v, idx) in variables" 
        :key="idx"
        
        draggable="true"
        @dragstart="onDragStart($event, v)"
        
        class="
            group flex flex-col gap-1.5 p-2 rounded border border-border bg-muted/20 
            hover:bg-accent hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing
        "
      >
        
        <div class="flex items-center gap-2 h-6">
          
          <div 
            class="h-full aspect-square flex items-center justify-center rounded shadow-sm shrink-0"
            :style="{ backgroundColor: getVarColor(v.type) }"
          >
            <Type v-if="v.type === 'String'" class="w-3.5 h-3.5 text-white" />
            <Hash v-else-if="v.type === 'Number'" class="w-3.5 h-3.5 text-white" />
            <ToggleLeft v-else-if="v.type === 'Boolean'" class="w-3.5 h-3.5 text-white" />
          </div>

          <input 
            :value="v.name"
            @change="e => updateVariable(idx, 'name', e.target.value)"
            @mousedown.stop
            class="flex-1 bg-transparent border-none outline-none p-0 text-xs font-bold text-foreground truncate hover:underline decoration-dashed underline-offset-4 decoration-muted-foreground/30 focus:underline h-full cursor-text"
            placeholder="Var Name"
          />

          <div class="shrink-0 flex items-center">
            <BaseDropdown align="right">
              <template #trigger>
                <button class="w-6 h-6 flex items-center justify-center rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors">
                  <MoreVertical class="w-3.5 h-3.5" />
                </button>
              </template>

              <template #default="{ close }">
                <div class="w-auto whitespace-nowrap flex flex-col py-1 text-xs min-w-[140px]">
                  
                  <div class="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </div>
                  <button @click="addNodeToCanvas(v, 'Get'); close()" class="flex items-center px-2 py-1.5 hover:bg-accent hover:text-accent-foreground text-left">
                     <ArrowRightFromLine class="w-3.5 h-3.5 mr-2 text-primary" /> Add "Get" Node
                  </button>
                  <button @click="addNodeToCanvas(v, 'Set'); close()" class="flex items-center px-2 py-1.5 hover:bg-accent hover:text-accent-foreground text-left">
                     <ArrowLeftToLine class="w-3.5 h-3.5 mr-2 text-orange-500" /> Add "Set" Node
                  </button>

                  <div class="h-px bg-border my-1"></div>

                  <div class="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Change Type
                  </div>
                  <button 
                    v-for="t in ['String', 'Number', 'Boolean']" 
                    :key="t"
                    @click="updateVariable(idx, 'type', t); close()"
                    class="flex items-center px-2 py-1.5 hover:bg-accent hover:text-accent-foreground text-left"
                    :class="v.type === t ? 'text-primary font-medium' : ''"
                  >
                    <div class="w-2 h-2 rounded-full mr-2" :style="{ backgroundColor: getVarColor(t) }"></div>
                    {{ t }}
                  </button>
                  
                  <div class="h-px bg-border my-1"></div>
                  
                  <button @click="duplicateVariable(idx); close()" class="flex items-center px-2 py-1.5 hover:bg-accent hover:text-accent-foreground text-left">
                    <Copy class="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Duplicate
                  </button>
                  <button @click="deleteVariable(idx); close()" class="flex items-center px-2 py-1.5 hover:bg-destructive/10 text-destructive hover:text-destructive text-left">
                    <Trash2 class="w-3.5 h-3.5 mr-2" /> Delete
                  </button>
                </div>
              </template>
            </BaseDropdown>
          </div>
        </div>

        <div class="w-full" @mousedown.stop>
            
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

            <BaseInput 
              v-else
              :model-value="v.defaultValue"
              @update:model-value="val => updateVariable(idx, 'defaultValue', val)"
              placeholder="Empty string..."
              class="w-full"
            />

        </div>

      </div>

      <div v-if="variables.length === 0" class="text-[10px] text-muted-foreground text-center py-4 italic border border-dashed border-border/50 rounded">
        List empty.
      </div>
    </div>
  </PropertySection>
</template>

<script setup>
import { 
  Plus, Trash2, MoreVertical, Copy, Type, Hash, ToggleLeft, 
  ArrowRightFromLine, ArrowLeftToLine 
} from 'lucide-vue-next'; 
import { useVariableLogic } from '@editors/variable/composables/useVariableLogic.js';
import PropertySection from "@ui/display/PropertySection.vue";
import BaseDropdown from '@/commons/components/overlay/BaseDropdown.vue';
import BaseInput from '@/commons/components/inputs/BaseInput.vue';
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue';

const props = defineProps({
  scope: { type: String, required: true },
  title: { type: String, default: 'Variables' },
  defaultOpen: { type: Boolean, default: true }
});

const { 
  variables, addVariable, updateVariable, duplicateVariable, deleteVariable, 
  onDragStart, getVarColor, addNodeToCanvas 
} = useVariableLogic(props.scope);

const boolOptions = [
  { label: 'False', value: false },
  { label: 'True', value: true }
];
</script>