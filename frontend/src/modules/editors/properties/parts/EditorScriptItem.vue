<template>
  <div class="border border-border rounded-md bg-background/50 mb-2 overflow-hidden">
    
    <div class="flex items-center gap-2 p-2 bg-muted/20 border-b border-border/50 h-8">
      
      <button 
        @click="active = !active"
        class="text-muted-foreground hover:text-primary transition-colors focus:outline-none"
        :class="{ 'text-primary': active }"
        title="Toggle Script"
      >
        <Power class="w-3.5 h-3.5" />
      </button>

      <div class="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
        <FileCode2 class="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span class="text-xs font-medium truncate" :title="scriptName">{{ scriptName }}</span>
      </div>

      <BaseDropdown align="right">
        <template #trigger>
          <button class="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
            <MoreHorizontal class="w-3.5 h-3.5" />
          </button>
        </template>
        <template #default="{ close }">
          <div class="flex flex-col min-w-[120px]">
             <button @click="openGraph" class="flex items-center px-2 py-1.5 hover:bg-accent text-xs text-left transition-colors">
                <Workflow class="w-3.5 h-3.5 mr-2" /> Open Graph
             </button>
             <div class="h-px bg-border my-1"></div>
             <button @click="$emit('remove')" class="flex items-center px-2 py-1.5 hover:bg-destructive/10 text-destructive text-xs text-left transition-colors">
                <Trash2 class="w-3.5 h-3.5 mr-2" /> Remove
             </button>
          </div>
        </template>
      </BaseDropdown>
    </div>

    <div class="p-2 space-y-1">
      
      <div v-if="variables.length === 0" class="text-[10px] text-muted-foreground italic pl-6 py-1">
        No exposed variables.
      </div>

      <div v-else v-for="v in variables" :key="v.name" class="flex items-center gap-2">
        <label class="w-[80px] text-[10px] text-muted-foreground truncate cursor-help" :title="v.name">
          {{ v.name }}
        </label>
        
        <div class="flex-1 min-w-0 flex items-center gap-1">
           
           <BaseNumber 
             v-if="v.type === 'Number'" 
             :model-value="v.value" 
             @update:model-value="val => updateVar(v.name, val)"
             class="h-6 text-[10px] w-full"
             :class="{ 'border-primary/50 text-primary': v.overridden }"
           />
           
           <BaseCheckbox 
             v-else-if="v.type === 'Boolean'"
             :model-value="v.value"
             @update:model-value="val => updateVar(v.name, val)"
           />
           
           <BaseInput 
             v-else
             :model-value="v.value"
             @update:model-value="val => updateVar(v.name, val)"
             class="h-6 text-[10px] w-full"
             :class="{ 'border-primary/50 text-primary': v.overridden }"
           />

           <button 
             v-if="v.overridden"
             @click="resetVar(v.name)"
             class="h-6 w-6 flex items-center justify-center hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
             title="Reset to Default"
           >
             <RotateCcw class="w-3 h-3" />
           </button>
           <div v-else class="w-6"></div> </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { FileCode2, Power, MoreHorizontal, Trash2, Workflow, RotateCcw } from 'lucide-vue-next';
import { useScriptStore } from '@/stores/useScriptStore.js';
import { useInspectorLogic } from '@editors/properties/composables/useInspectorLogic.js';

import BaseDropdown from '@ui/overlay/BaseDropdown.vue';
import BaseInput from '@/commons/components/inputs/BaseInput.vue';
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseCheckbox from '@/commons/components/inputs/BaseCheckbox.vue';

const props = defineProps({
  data: { type: Object, required: true },
  index: { type: Number, required: true }
});

const emit = defineEmits(['remove']);

const scriptStore = useScriptStore();
const { updateScriptInstance } = useInspectorLogic();

const def = computed(() => scriptStore.getScriptById(props.data.assetId));
const scriptName = computed(() => def.value?.name || 'Unknown Script');

const active = computed({
  get: () => props.data.active,
  set: (val) => updateScriptInstance(props.index, 'active', val)
});

const variables = computed(() => {
  if (!def.value) return [];
  const overrides = props.data.variables || {};

  return (def.value.exposedVariables || []).map(vDef => {
    const overridden = Object.prototype.hasOwnProperty.call(overrides, vDef.name);
    return {
      name: vDef.name,
      type: vDef.type,
      value: overridden ? overrides[vDef.name] : vDef.defaultValue,
      overridden
    };
  });
});

function updateVar(name, value) {
  updateScriptInstance(props.index, `variables.${name}`, value);
}

function resetVar(name) {
  const currentVars = { ...props.data.variables };
  delete currentVars[name];
  updateScriptInstance(props.index, 'variables', currentVars);
}

function openGraph() {
  console.log('Open Graph Editor:', props.data.assetId);
}
</script>