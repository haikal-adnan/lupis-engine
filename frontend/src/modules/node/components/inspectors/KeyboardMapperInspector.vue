<template>
  <PropertySection title="Key Mapping Config" :icon="Keyboard" v-if="node">
    
    <div class="space-y-3 px-1">
      
      <div v-for="(map, index) in mappings" :key="index" class="bg-secondary/20 p-2 rounded border border-border relative group">
        
        <button 
          @click="removeMapping(index)"
          class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-muted-foreground hover:text-red-400 transition-all z-10"
          title="Remove Mapping"
        >
          <Trash2 class="w-3 h-3" />
        </button>

        <div class="grid grid-cols-2 gap-2 mb-2">
           <div>
             <label class="text-[9px] text-muted-foreground uppercase font-bold block mb-1">Key</label>
             <BaseInput 
               :model-value="map.key" 
               @update:model-value="(v) => updateMapping(index, 'key', v.toUpperCase())"
               placeholder="W"
               class="h-7 text-xs font-mono text-center uppercase w-full"
             />
           </div>

           <div>
             <label class="text-[9px] text-muted-foreground uppercase font-bold block mb-1">Trigger</label>
             <BaseSelect 
               :model-value="map.trigger"
               @update:model-value="(v) => updateMapping(index, 'trigger', v)"
               :options="[
                 { label: 'On Press', value: 'press' },
                 { label: 'On Hold', value: 'hold' },
                 { label: 'On Release', value: 'release' }
               ]"
               height="1.75rem"
               align="right" 
               class="w-full"
             />
           </div>
        </div>

        <div v-if="map.trigger === 'hold'" class="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 animate-in fade-in slide-in-from-top-1">
           <span class="text-[9px] text-muted-foreground whitespace-nowrap">Hold (ms):</span>
           <BaseNumber 
             :model-value="map.threshold" 
             @update:model-value="(v) => updateMapping(index, 'threshold', v)"
             class="h-6 text-xs w-16 text-center font-mono" 
           />
           <div class="flex-1 flex justify-end items-center gap-1">
              <span class="text-[9px] text-muted-foreground">Repeat:</span>
              <BaseCheckbox 
                :model-value="map.repeat"
                @update:model-value="(v) => updateMapping(index, 'repeat', v)"
              />
           </div>
        </div>

      </div>

      <button 
        @click="addMapping"
        class="w-full py-2 border border-dashed border-border rounded text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 flex items-center justify-center gap-2 transition-colors group"
      >
        <Plus class="w-3 h-3 group-hover:scale-110 transition-transform" />
        Add Key Map
      </button>

    </div>
  </PropertySection>
</template>

<script setup>
import { computed } from 'vue';
import { Keyboard, Trash2, Plus } from 'lucide-vue-next';
import { useScriptStore } from '@/stores/useScriptStore.js';
import { GenerateUUID } from '@/commons/utils/generateUUID.js';

// Atomic Components
import PropertySection from "@ui/display/PropertySection.vue";
import BaseInput from '@/commons/components/inputs/BaseInput.vue';
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue';
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseCheckbox from '@/commons/components/inputs/BaseCheckbox.vue';

const props = defineProps({ node: Object });
const store = useScriptStore();

const mappings = computed(() => props.node.data?.mappings || []);

const syncPorts = (newMappings) => {
  const newOutputs = newMappings.map(m => ({
     _id: `out_${m._id}`, 
     label: `${m.key || '?'} (${m.trigger})`,
     dataType: 'execution',
     color: m.trigger === 'hold' ? '#FFEB3B' : '#4CAF50'
  }));

  store.updateNodeInActive(props.node._id, {
    data: { mappings: newMappings }, 
    outputs: newOutputs              
  });
};

const addMapping = () => {
  const newMap = {
    _id: GenerateUUID(),
    key: '',
    trigger: 'press',
    threshold: 0,
    repeat: false
  };
  syncPorts([...mappings.value, newMap]);
};

const removeMapping = (index) => {
  const newList = [...mappings.value];
  newList.splice(index, 1);
  syncPorts(newList);
};

const updateMapping = (index, field, value) => {
  const newList = JSON.parse(JSON.stringify(mappings.value)); 
  newList[index][field] = value;
  syncPorts(newList);
};
</script>