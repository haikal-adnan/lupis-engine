<template>
  <PropertySection 
    title="Script Controller" 
    :icon="FileCode2" 
    v-if="hasComponent"
  >
    <div class="flex items-end gap-1.5 mb-3">
      
      <div class="flex-1 min-w-0">
        <div class="mb-1 text-[10px] font-bold text-muted-foreground uppercase flex justify-between items-center">
            <span>Script</span>
        </div>
        
        <BaseDropdown class="w-full">
          <template #trigger="{ isOpen }">
            <button 
              type="button"
              class="
                flex items-center justify-between w-full h-7 px-2 
                bg-background border rounded-md text-xs transition-colors
                focus:outline-none focus:ring-1 focus:ring-primary
              "
              :class="[
                isOpen ? 'border-primary ring-1 ring-primary' : 'border-input hover:bg-accent hover:text-accent-foreground',
                !currentScript ? 'text-muted-foreground' : 'text-foreground'
              ]"
            >
              <span class="truncate font-medium">
                {{ scriptsData.length > 0 ? currentScriptName : 'No Scripts Attached' }}
              </span>
              <ChevronDown class="w-3.5 h-3.5 opacity-50" />
            </button>
          </template>

          <template #default="{ close }">
            <div class="w-[220px] flex flex-col py-1">
              <div v-if="scriptsData.length === 0" class="px-3 py-2 text-[10px] text-muted-foreground text-center italic">
                List is empty.
              </div>

              <button 
                v-for="(script, idx) in scriptsData" 
                :key="script._id"
                @click="selectIndex(idx, close)"
                class="relative flex items-center justify-between w-full px-2 py-1.5 text-xs text-left hover:bg-accent transition-colors group"
                :class="[
                  script.isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                ]"
              >
                <div class="flex items-center gap-2 truncate">
                   <div class="w-1 h-1 rounded-full" :class="idx === selectedIndex ? 'bg-primary' : 'bg-transparent'"></div>
                   <span class="truncate">{{ getScriptName(script.assetId) }}</span>
                </div>
                <Check v-if="script.isActive" class="w-3.5 h-3.5 text-blue-500 ml-2" />
              </button>
            </div>
          </template>
        </BaseDropdown>
      </div>

      <BaseDropdown align="right">
        <template #trigger="{ isOpen }">
          <button 
            class="h-7 w-7 flex items-center justify-center rounded-md border border-transparent hover:bg-muted text-muted-foreground transition-colors"
            :class="{ 'bg-muted text-foreground': isOpen }"
            title="Script Options"
          >
            <MoreVertical class="w-4 h-4" />
          </button>
        </template>

        <template #default="{ close }">
          <div class="flex flex-col text-xs min-w-[160px] py-1">
            
            <button 
              @click="openScriptBottomBar(); close()"
              class="flex items-center px-2 py-1.5 mx-1 rounded-sm hover:bg-accent hover:text-accent-foreground text-left transition-colors"
            >
              <Plus class="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <span>Add Script...</span>
            </button>

            <button 
              v-if="currentScript"
              @click="handleRemoveCurrent(); close()"
              class="flex items-center px-2 py-1.5 mx-1 rounded-sm hover:bg-destructive/10 text-destructive hover:text-destructive text-left transition-colors"
            >
              <Trash2 class="w-3.5 h-3.5 mr-2" />
              <span>Remove Current</span>
            </button>

          </div>
        </template>
      </BaseDropdown>
    </div>

    <div v-if="currentScript" class="flex flex-col gap-2">
       <PropertyRow label="Active Status">
          <BaseButton 
             :active="currentIsActive"
             @click="currentIsActive = !currentIsActive"
             class="w-full h-7 text-xs gap-2 justify-start px-3 border border-border/50 bg-background/50 hover:bg-accent transition-all"
             ghost
           >
             <Power 
               class="w-3.5 h-3.5 transition-colors duration-300" 
               :class="currentIsActive ? 'text-primary drop-shadow-[0_0_3px_rgba(var(--primary),0.5)]' : 'text-muted-foreground'" 
             />
             <span :class="currentIsActive ? 'text-foreground' : 'text-muted-foreground'">
               {{ currentIsActive ? 'Active' : 'Inactive' }}
             </span>
           </BaseButton>
       </PropertyRow>

       <PropertyRow label="Source">
          <BaseButton 
            @click="openScriptEditor"
            class="w-full h-7 text-xs gap-2 justify-center"
            variant="outline" 
          >
            <span>Open Script</span>
          </BaseButton>
       </PropertyRow>

       <div class="h-px bg-border my-1"></div>

       <div class="space-y-1">
          <div v-if="currentVariables.length === 0" class="text-[10px] text-muted-foreground italic pl-2">
            No variables exposed.
          </div>

          <PropertyRow 
            v-for="v in currentVariables" 
            :key="v.name" 
            :label="v.name"
          >
            <div class="flex items-center gap-1 w-full">
               <div class="flex-1 min-w-0">
                  <BaseNumber v-if="v.type === 'Number'" v-model="v.model.value" :scrubbable="true" class="w-full text-xs font-mono" :class="{ 'border-primary/50 text-primary': v.isOverridden }" />
                  <BaseCheckbox v-else-if="v.type === 'Boolean'" v-model="v.model.value" />
                  <BaseInput v-else v-model="v.model.value" class="w-full text-xs" :class="{ 'border-primary/50 text-primary': v.isOverridden }" />
               </div>
               <button v-if="v.isOverridden" @click="v.reset()" class="w-6 h-6 flex items-center justify-center hover:bg-muted rounded text-muted-foreground hover:text-foreground">
                  <RotateCcw class="w-3 h-3" />
               </button>
               <div v-else class="w-6"></div>
            </div>
          </PropertyRow>
       </div>
    </div>

    <div v-else class="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded">
        Select "Add Script" from menu to start.
    </div>

  </PropertySection>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { 
  FileCode2, MoreVertical, Plus, Trash2, 
  ChevronDown, Check, Power, RotateCcw 
} from 'lucide-vue-next';
import { useInspectorLogic } from "@/modules/properties/composables/useInspectorLogic.js";
import { useScriptStore } from '@/stores/useScriptStore.js';
import { useEditorStore } from '@/stores/useEditorStore.js';

// UI Components
import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseDropdown from '@ui/overlay/BaseDropdown.vue';
import BaseCheckbox from '@/commons/components/inputs/BaseCheckbox.vue';
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseInput from '@/commons/components/inputs/BaseInput.vue';
import BaseButton from '@/commons/components/buttons/BaseButton.vue';

const scriptStore = useScriptStore();
const editorStore = useEditorStore();

const { 
  selectedEntity, scriptsData,       
  removeScript, updateScriptInstance
} = useInspectorLogic();

const hasComponent = computed(() => !!selectedEntity.value?.components?.ScriptController);

// --- SELECTION STATE ---
const selectedIndex = ref(0);
watch(() => selectedEntity.value?._id, () => { selectedIndex.value = 0; });

// --- HELPERS ---
const currentScript = computed(() => scriptsData.value[selectedIndex.value]);
function getScriptName(assetId) {
   const def = scriptStore.getScriptById(assetId);
   return def ? def.name : 'Unknown Script';
}
const currentScriptName = computed(() => currentScript.value ? getScriptName(currentScript.value.assetId) : '');

// --- BINDINGS ---
const currentIsActive = computed({
  get: () => currentScript.value?.isActive ?? true,
  set: (val) => { if (currentScript.value) updateScriptInstance(selectedIndex.value, 'isActive', val); }
});

const currentVariables = computed(() => {
   if (!currentScript.value) return [];
   const def = scriptStore.getScriptById(currentScript.value.assetId);
   if (!def) return [];
   const overrides = currentScript.value.variables || {};

   return (def.exposedVariables || []).map(d => {
      const variableId = d._id; 
      const isOverridden = Object.prototype.hasOwnProperty.call(overrides, variableId);
      
      return {
         name: d.name, 
         type: d.type, 
         isOverridden,
         model: computed({
            get: () => isOverridden ? overrides[variableId] : d.defaultValue,
            set: (val) => {
                let finalVal = val;
                if (d.type === 'Number') finalVal = Number(val); 
                else if (d.type === 'Boolean') finalVal = Boolean(val);

                const newVariables = { ...overrides };
                if (finalVal === d.defaultValue) {
                    delete newVariables[variableId];
                } else {
                    newVariables[variableId] = finalVal;
                }
                updateScriptInstance(selectedIndex.value, 'variables', newVariables);
            }
         }),
         reset: () => {
            const n = { ...overrides }; 
            delete n[variableId];
            updateScriptInstance(selectedIndex.value, 'variables', n);
         }
      };
   });
});

// --- ACTIONS ---
function selectIndex(idx, close) {
   selectedIndex.value = idx;
   if(close) close();
}

// Membuka tab scripts di bagian bawah (Bottom Bar)
function openScriptBottomBar() {
  editorStore.setActiveBottomTab('scripts');
}

function handleRemoveCurrent() {
   if(confirm(`Remove ${currentScriptName.value}?`)) {
     removeScript(selectedIndex.value);
     selectedIndex.value = 0;
   }
}

function openScriptEditor() {
   if (!currentScript.value) return;
   const assetId = currentScript.value.assetId;
   const scriptDef = scriptStore.getScriptById(assetId);

   if (scriptDef) {
      scriptStore.setActiveScript(scriptDef);
      editorStore.openTab({
          id: scriptDef._id,
          name: scriptDef.name,
          type: 'diagram',
          fixed: false
      });
   }
}
</script>