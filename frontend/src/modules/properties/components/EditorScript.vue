<template>
  <PropertySection 
    title="Script Controller" 
    :icon="FileCode2" 
    v-if="hasComponent"
  >

    <template #header-extra>
      <div 
        v-if="prefabId"
        class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border select-none shrink-0"
        :class="isOverridden 
          ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'"
      >
        {{ isOverridden ? 'Override' : 'Sync' }}
      </div>
    </template>

    <template #menu="{ close }">
      <div class="p-1 min-w-[160px] space-y-0.5">
        <template v-if="prefabId">
          <button 
            @click="syncComponent('ScriptController'); close()" 
            :disabled="!isOverridden"
            class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw class="w-3.5 h-3.5 mr-2 opacity-70" /> 
            Sync Component
          </button>
          <div class="h-px bg-border my-1"></div>
        </template>

        <button 
          @click="removeComponent('ScriptController'); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors"
        >
          <Trash2 class="w-3.5 h-3.5 mr-2" /> Remove Component
        </button>
      </div>
    </template>
  
    <div class="flex items-end gap-1.5 mb-3">
      <div class="flex-1 min-w-0">
        <div class="mb-1 text-[10px] font-bold text-muted-foreground uppercase flex justify-between items-center">
            <span>Attached Scripts</span>
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
             @click="toggleScriptActive"
             class="w-full h-7 text-xs gap-2 justify-start px-3 border border-border/50 bg-background/50 hover:bg-accent transition-all"
             ghost
           >
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
            <span>Open Visual Script</span>
          </BaseButton>
        </PropertyRow>

        <div class="h-px bg-border my-1"></div>

        <div class="space-y-1">
          <div v-if="currentVariables.length === 0" class="text-[10px] text-muted-foreground italic pl-2">
            No variables exposed in this script.
          </div>

          <PropertyRow 
            v-for="v in currentVariables" 
            :key="v.name" 
            :label="v.name"
          >
            <div class="flex items-center gap-1 w-full">
               <div class="flex-1 min-w-0">
                  <BaseNumber 
                    v-if="v.type === 'Number'" 
                    v-model="v.model.value" 
                    :scrubbable="true" 
                    class="w-full text-xs font-mono" 
                    :class="{ 'border-amber-500/50 text-amber-500 bg-amber-500/5': v.isOverridden }" 
                  />
                  <BaseCheckbox v-else-if="v.type === 'Boolean'" v-model="v.model.value" />
                  <BaseInput 
                    v-else 
                    v-model="v.model.value" 
                    class="w-full text-xs" 
                    :class="{ 'border-amber-500/50 text-amber-500 bg-amber-500/5': v.isOverridden }" 
                  />
               </div>
               
               <button 
                 v-if="v.isOverridden" 
                 @click="v.reset()" 
                 title="Reset to default value"
                 class="w-6 h-6 flex items-center justify-center hover:bg-amber-500/10 rounded text-amber-500 transition-colors"
               >
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
import { ref, computed, watch } from 'vue'
import { 
  FileCode2, MoreVertical, Plus, Trash2, 
  ChevronDown, Check, RotateCcw, RefreshCw 
} from 'lucide-vue-next'

import { useInspectorLogic } from "@/modules/properties/composables/useInspectorLogic.js"
import { useScriptStore } from '@/stores/useScriptStore.js'
import { useEditorStore } from '@/stores/useEditorStore.js'
import { useSceneStore } from '@/stores/scene/useSceneStore.js' // Tambahkan ini

import { useConfirm } from '@/composables/useConfirm.js'
import { usePopAlert } from '@/composables/usePopAlert.js'

import PropertySection from "@ui/display/PropertySection.vue"
import PropertyRow from "@ui/display/PropertyRow.vue"
import BaseDropdown from '@ui/overlay/BaseDropdown.vue'
import BaseCheckbox from '@/commons/components/inputs/BaseCheckbox.vue'
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue'
import BaseInput from '@/commons/components/inputs/BaseInput.vue'
import BaseButton from '@/commons/components/buttons/BaseButton.vue'

const scriptStore = useScriptStore()
const editorStore = useEditorStore()
const sceneStore = useSceneStore() // Init Store
const { confirm } = useConfirm()
const { showPop } = usePopAlert()
const { 
  selectedEntity, 
  scriptsData,       
  removeScript, 
  updateScriptInstance,
  removeComponent,
  prefabId,                   
  syncComponent,              
  getComponentOverrideStatus, 
  // HAPUS atau JANGAN PAKAI markAsOverridden di sini untuk logic internal component
  // markAsOverridden            
} = useInspectorLogic()

// Helper Lokal untuk Override Komponen Spesifik
const markComponentAsOverridden = () => {
  if (selectedEntity.value && prefabId.value) {
     sceneStore.updateComponentProp(selectedEntity.value._id, 'ScriptController', 'isOverridden', true)
  }
}

const hasComponent = computed(() => !!selectedEntity.value?.components?.ScriptController)
const isOverridden = getComponentOverrideStatus('ScriptController')

const selectedIndex = ref(0)
watch(() => selectedEntity.value?._id, () => { selectedIndex.value = 0 })

const currentScript = computed(() => scriptsData.value[selectedIndex.value])

function getScriptName(assetId) {
   const def = scriptStore.getScriptById(assetId)
   return def ? def.name : 'Unknown Script'
}

const currentScriptName = computed(() => currentScript.value ? getScriptName(currentScript.value.assetId) : '')

const currentIsActive = computed(() => currentScript.value?.isActive ?? true)
const toggleScriptActive = () => {
  if (!currentScript.value) return
  updateScriptInstance(selectedIndex.value, 'isActive', !currentIsActive.value)
  markComponentAsOverridden() // [FIX] Hanya override komponen ini
}

const currentVariables = computed(() => {
   if (!currentScript.value) return []
   const def = scriptStore.getScriptById(currentScript.value.assetId)
   if (!def) return []
   const overrides = currentScript.value.variables || {}

   return (def.exposedVariables || []).map(d => {
      const variableId = d._id
      const isVariableOverridden = Object.prototype.hasOwnProperty.call(overrides, variableId)
      
      return {
         name: d.name, 
         type: d.type, 
         isOverridden: isVariableOverridden,
         model: computed({
            get: () => isVariableOverridden ? overrides[variableId] : d.defaultValue,
            set: (val) => {
                let finalVal = val
                if (d.type === 'Number') finalVal = Number(val) 
                else if (d.type === 'Boolean') finalVal = Boolean(val)

                const newVariables = { ...overrides }
                newVariables[variableId] = finalVal
                
                updateScriptInstance(selectedIndex.value, 'variables', newVariables)
                markComponentAsOverridden() // [FIX] Hanya override komponen ini
            }
         }),
         reset: () => {
            const n = { ...overrides } 
            delete n[variableId] 
            updateScriptInstance(selectedIndex.value, 'variables', n)
            
            // Meskipun reset variabel ke default, komponen tetap dianggap 'modify'
            // dari state awal prefab jika ada perubahan struktur array script.
            // Namun jika kembali ke default murni, bisa jadi tidak override.
            // Untuk amannya, setiap interaksi dianggap override manual sampai di-Sync.
            markComponentAsOverridden() 
         }
      }
   })
})

function selectIndex(idx, close) {
   selectedIndex.value = idx
   if(close) close()
}

function openScriptBottomBar() {
  editorStore.setActiveBottomTab('scripts')
}

async function handleRemoveCurrent() {
   if (!currentScript.value) return

   const scriptName = currentScriptName.value
   const isConfirmed = await confirm({
     title: 'Detach Script?',
     message: `Are you sure you want to remove "${scriptName}"?`,
     confirmText: 'Yes, Detach',
     type: 'danger'
   })

   if (isConfirmed) {
      removeScript(selectedIndex.value)
      selectedIndex.value = 0
      markComponentAsOverridden() // [FIX] Detach script = Component Override
      showPop({ title: 'Script Detached', type: 'info' })
   }
}

function openScriptEditor() {
   if (!currentScript.value) return
   const assetId = currentScript.value.assetId
   const scriptDef = scriptStore.getScriptById(assetId)

   if (scriptDef) {
      scriptStore.setActiveScript(scriptDef)
      editorStore.openTab({
          id: scriptDef._id,
          name: scriptDef.name,
          type: 'diagram',
          fixed: false
      })
   }
}
</script>