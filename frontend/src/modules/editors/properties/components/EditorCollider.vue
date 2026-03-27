<template>
  <PropertySection title="Collider" :icon="Cuboid" v-if="hasComponent">
    
    <template #header-extra>
      <div 
        v-if="prefabId"
        class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border select-none shrink-0"
        :class="overridden 
          ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'"
      >
        {{ overridden ? 'Override' : 'Sync' }}
      </div>
    </template>

    <template #menu="{ close }">
      <div class="p-1 space-y-0.5 min-w-[160px]">
        
        <template v-if="prefabId">
          <button 
            @click="syncComponent('Collider'); close()" 
            :disabled="!overridden"
            class="menu-item"
          >
            <RefreshCw class="w-3.5 h-3.5 mr-2 opacity-70" /> 
            Sync Component
          </button>
          <div class="h-px bg-border my-1"></div>
        </template>

        <button 
          @click="removeComponent('Collider'); close()" 
          class="menu-item text-destructive hover:bg-destructive hover:text-destructive-foreground font-medium"
        >
          <Trash2 class="w-3.5 h-3.5 mr-2" /> Remove All Colliders
        </button>
      </div>
    </template>

    <div class="flex items-end gap-1.5 mb-3">
      <div class="flex-1 min-w-0">
        <div class="mb-1 text-[10px] font-bold text-muted-foreground uppercase flex justify-between items-center">
            <span>Attached Colliders</span>
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
                !currentCollider ? 'text-muted-foreground' : 'text-foreground',
                currentCollider && !currentCollider.enabled ? 'opacity-50' : ''
              ]"
            >
              <span class="truncate font-medium">
                {{ collidersData.length > 0 ? `Collider ${selectedIndex + 1} (${currentCollider?.type})` : 'No Colliders Attached' }}
              </span>
              <ChevronDown class="w-3.5 h-3.5 opacity-50" />
            </button>
          </template>

          <template #default="{ close }">
            <div class="w-[220px] flex flex-col py-1">
              <div v-if="collidersData.length === 0" class="px-3 py-2 text-[10px] text-muted-foreground text-center italic">
                List is empty.
              </div>

              <button 
                v-for="(col, idx) in collidersData" 
                :key="idx"
                @click="selectIndex(idx, close)"
                class="relative flex items-center justify-between w-full px-2 py-1.5 text-xs text-left hover:bg-accent transition-colors group"
                :class="[ 
                  idx === selectedIndex ? 'text-foreground font-medium' : 'text-muted-foreground',
                  !col.enabled ? 'opacity-50' : ''
                ]"
              >
                <div class="flex items-center gap-2 truncate">
                   <div class="w-1 h-1 rounded-full" :class="idx === selectedIndex ? 'bg-primary' : 'bg-transparent'"></div>
                   <span class="truncate">Collider {{ idx + 1 }} ({{ col.type }})</span>
                </div>
                <Check v-if="col.enabled" class="w-3.5 h-3.5 text-blue-500 ml-2" />
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
            title="Collider Options"
          >
            <MoreVertical class="w-4 h-4" />
          </button>
        </template>

        <template #default="{ close }">
          <div class="flex flex-col text-xs min-w-[160px] py-1">
            <button 
              @click="addNewCollider(); close()"
              class="flex items-center px-2 py-1.5 mx-1 rounded-sm hover:bg-accent hover:text-accent-foreground text-left transition-colors"
            >
              <Plus class="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <span>Add Collider</span>
            </button>

            <button 
              v-if="currentCollider"
              @click="removeCurrentCollider(); close()"
              class="flex items-center px-2 py-1.5 mx-1 rounded-sm hover:bg-destructive/10 text-destructive hover:text-destructive text-left transition-colors"
            >
              <Trash2 class="w-3.5 h-3.5 mr-2" />
              <span>Remove Current</span>
            </button>
          </div>
        </template>
      </BaseDropdown>
    </div>

    <div v-if="currentCollider" class="space-y-2">
      <PropertyRow label="Status">
        <BaseButton 
          :active="enabled"
          @click="enabled = !enabled"
          class="w-full h-7 text-xs gap-2 justify-start px-3 border border-border/50 bg-background/50 hover:bg-accent transition-all"
          ghost
        >
          {{ enabled ? 'Enabled' : 'Disabled' }}
        </BaseButton>
      </PropertyRow>

      <PropertyRow label="Type">
        <BaseSelect 
          v-model="type" 
          :options="typeOptions" 
          placeholder="Select Type"
          class="w-full"
        />
      </PropertyRow>

      <PropertyRow label="Offset">
        <div class="grid grid-cols-2 gap-2 transition-all duration-300" :class="{ 'opacity-50 grayscale pointer-events-none': autoFit }">
          <BaseNumber v-model="offsetX" prefix="X" :step="1" :precision="2" class="font-mono" :disabled="autoFit" />
          <BaseNumber v-model="offsetY" prefix="Y" :step="1" :precision="2" class="font-mono" :disabled="autoFit" />
        </div>
      </PropertyRow>

      <PropertyRow label="Size (px)">
        <div class="grid grid-cols-2 gap-2 transition-all duration-300" :class="{ 'opacity-50 grayscale pointer-events-none': autoFit }">
          <BaseNumber v-model="width" prefix="W" :min="0" :step="1" :precision="2" class="font-mono" :disabled="autoFit" />
          <BaseNumber v-model="height" prefix="H" :min="0" :step="1" :precision="2" class="font-mono" :disabled="autoFit" />
        </div>
      </PropertyRow>

      <div class="flex gap-3 items-start">
        <div class="flex-grow pt-[1px]">
          <PropertyRow label="Rotation">
            <BaseNumber 
              v-model="rotation" 
              prefix="R" suffix="°" :step="1" :precision="2"
              class="font-mono flex-grow transition-all duration-300"
              :min="0" :max="359" :cyclic="true"
              :class="{ 'opacity-50 grayscale pointer-events-none': autoFit }"
              :disabled="autoFit" 
            />
          </PropertyRow>
        </div>
        
        <PivotControl 
          :x="pivotX" 
          :y="pivotY" 
          :disabled="autoFit"
          class="transition-all duration-300"
          :class="{ 'opacity-50 grayscale pointer-events-none': autoFit }"
          @update="updateColliderPivot" 
        />
      </div>

      <div class="px-1 mb-2 mt-1">
        <BaseCheckbox 
          v-model="autoFit" 
          label="Fit to Transform Size & Rotation" 
        />
      </div>

      <div v-if="autoFit" class="px-1 mb-3 -mt-1">
        <div class="text-[9px] text-amber-500/80 italic flex items-center gap-1">
          <Info class="w-3 h-3" /> Size & Rotation are controlled by Transform
        </div>
      </div>
    </div>
    
    <div v-else class="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded">
        Select "Add Collider" from menu to start.
    </div>

  </PropertySection>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Cuboid, Trash2, RefreshCw, Info, ChevronDown, Check, MoreVertical, Plus } from 'lucide-vue-next'
import { useInspectorLogic } from "@editors/properties/composables/useInspectorLogic.js"

import { useSceneStore } from '@/stores/scene/useSceneStore.js'
import { useEditorStore } from '@/stores/useEditorStore.js'
import { usePrefabStore } from '@/stores/usePrefabStore.js'

import { useConfirm } from '@/composables/useConfirm.js'
import { usePopAlert } from '@/composables/usePopAlert.js'

import PropertySection from "@ui/display/PropertySection.vue"
import PropertyRow from "@ui/display/PropertyRow.vue"
import BaseDropdown from '@ui/overlay/BaseDropdown.vue'
import PivotControl from '@ui/inputs/PivotControl.vue'
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue'
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue'
import BaseButton from '@/commons/components/buttons/BaseButton.vue'
import BaseCheckbox from '@/commons/components/inputs/BaseCheckbox.vue'

const { 
  selectedEntity,
  prefabId,
  syncComponent,
  getComponentOverrideStatus,
  removeComponent,
  isEditingMasterPrefab
} = useInspectorLogic()

const sceneStore = useSceneStore()
const editorStore = useEditorStore()
const prefabStore = usePrefabStore()
const { confirm } = useConfirm()
const { showPop } = usePopAlert()

const hasComponent = computed(() => !!selectedEntity.value?.components?.Collider)
const overridden = getComponentOverrideStatus('Collider')

const collidersData = computed(() => selectedEntity.value?.components?.Collider?.data || [])
const selectedIndex = ref(0)

watch(() => selectedEntity.value?._id, () => { selectedIndex.value = 0 })

const currentCollider = computed(() => collidersData.value[selectedIndex.value])

const typeOptions = [
  { label: 'Solid (Physics)', value: 'solid' },
  { label: 'Trigger (Zone)', value: 'trigger' }
]

function selectIndex(idx, close) {
   selectedIndex.value = idx
   if (close) close()
}

const markComponentAsOverridden = () => {
  if (selectedEntity.value && prefabId.value && !isEditingMasterPrefab.value) {
     sceneStore.updateComponentProp(selectedEntity.value._id, 'Collider', 'overridden', true)
  }
}

const bindCurrentColliderProp = (propName) => computed({
  get: () => currentCollider.value ? currentCollider.value[propName] : undefined,
  set: (val) => {
    if (!currentCollider.value || !selectedEntity.value) return
    const path = `data.${selectedIndex.value}.${propName}`
    
    let finalVal = val;
    if (propName === 'enabled' || propName === 'autoFit') finalVal = Boolean(val);
    if (typeof finalVal === 'number') finalVal = Math.round(finalVal * 100) / 100;

    if (isEditingMasterPrefab.value) {
      prefabStore.updateComponentProp(editorStore.activeTab.id, 'Collider', path, finalVal)
    } else {
      sceneStore.updateComponentProp(selectedEntity.value._id, 'Collider', path, finalVal)
      markComponentAsOverridden()
    }
  }
})

const type = bindCurrentColliderProp('type')
const enabled = bindCurrentColliderProp('enabled')
const autoFit = bindCurrentColliderProp('autoFit')
const offsetX = bindCurrentColliderProp('offsetX')
const offsetY = bindCurrentColliderProp('offsetY')
const width = bindCurrentColliderProp('width')
const height = bindCurrentColliderProp('height')
const rotation = bindCurrentColliderProp('rotation')
const pivotX = bindCurrentColliderProp('pivotX')
const pivotY = bindCurrentColliderProp('pivotY')

function addNewCollider() {
  const newCol = { 
    type: 'solid', 
    enabled: true, 
    autoFit: false, 
    offsetX: 0, 
    offsetY: 0, 
    width: 32, 
    height: 32 
  }
  
  const currentList = [...collidersData.value, newCol]

  if (isEditingMasterPrefab.value) {
    prefabStore.updateComponentProp(editorStore.activeTab.id, 'Collider', 'data', currentList)
  } else {
    sceneStore.updateComponentProp(selectedEntity.value._id, 'Collider', 'data', currentList)
    markComponentAsOverridden()
  }
  selectedIndex.value = currentList.length - 1
}

async function removeCurrentCollider() {
   if (!currentCollider.value) return

   const isConfirmed = await confirm({
     title: 'Remove Collider?',
     message: `Are you sure you want to remove Collider ${selectedIndex.value + 1}?`,
     confirmText: 'Yes, Remove',
     type: 'danger'
   })

   if (isConfirmed) {
      const currentList = [...collidersData.value]
      currentList.splice(selectedIndex.value, 1)

      if (isEditingMasterPrefab.value) {
        prefabStore.updateComponentProp(editorStore.activeTab.id, 'Collider', 'data', currentList)
      } else {
        sceneStore.updateComponentProp(selectedEntity.value._id, 'Collider', 'data', currentList)
        markComponentAsOverridden()
      }
      
      selectedIndex.value = Math.max(0, selectedIndex.value - 1)
      showPop({ title: 'Collider Removed', type: 'info' })
   }
}

const transformWidth = computed(() => selectedEntity.value?.components?.Transform?.width)
const transformHeight = computed(() => selectedEntity.value?.components?.Transform?.height)

function updateColliderPivot({ x: newPx, y: newPy }) {
  if (!currentCollider.value || !selectedEntity.value) return
  
  const c = currentCollider.value;
  const oldPx = c.pivotX ?? 0.5;
  const oldPy = c.pivotY ?? 0.5;
  
  const deltaPx = newPx - oldPx;
  const deltaPy = newPy - oldPy;

  const rotRad = (c.rotation || 0) * (Math.PI / 180);
  const cosR = Math.cos(rotRad);
  const sinR = Math.sin(rotRad);

  const w = c.width || 32;
  const h = c.height || 32;

  const deltaOx = -(deltaPx * w) * (1 - cosR) - (deltaPy * h) * sinR;
  const deltaOy = -(deltaPy * h) * (1 - cosR) + (deltaPx * w) * sinR;

  const newOx = Number(((c.offsetX || 0) + deltaOx).toFixed(2));
  const newOy = Number(((c.offsetY || 0) + deltaOy).toFixed(2));

  if (isEditingMasterPrefab.value) {
    prefabStore.updateComponentProp(editorStore.activeTab.id, 'Collider', `data.${selectedIndex.value}.pivotX`, newPx);
    prefabStore.updateComponentProp(editorStore.activeTab.id, 'Collider', `data.${selectedIndex.value}.pivotY`, newPy);
    prefabStore.updateComponentProp(editorStore.activeTab.id, 'Collider', `data.${selectedIndex.value}.offsetX`, newOx);
    prefabStore.updateComponentProp(editorStore.activeTab.id, 'Collider', `data.${selectedIndex.value}.offsetY`, newOy);
  } else {
    sceneStore.updateComponentProp(selectedEntity.value._id, 'Collider', `data.${selectedIndex.value}.pivotX`, newPx);
    sceneStore.updateComponentProp(selectedEntity.value._id, 'Collider', `data.${selectedIndex.value}.pivotY`, newPy);
    sceneStore.updateComponentProp(selectedEntity.value._id, 'Collider', `data.${selectedIndex.value}.offsetX`, newOx);
    sceneStore.updateComponentProp(selectedEntity.value._id, 'Collider', `data.${selectedIndex.value}.offsetY`, newOy);
    markComponentAsOverridden();
  }
}

const syncSizeToTransform = () => {
  if (!selectedEntity.value || !currentCollider.value) return
  const transform = selectedEntity.value.components.Transform
  if (!transform) return

  width.value = transform.width
  height.value = transform.height
  offsetX.value = 0
  offsetY.value = 0
  rotation.value = 0
  
  updateColliderPivot({ x: transform.pivotX ?? 0.5, y: transform.pivotY ?? 0.5 })
  markComponentAsOverridden()
}

watch(autoFit, (isAutoFit) => {
  if (isAutoFit) {
    syncSizeToTransform()
  }
})

watch([transformWidth, transformHeight], ([newWidth, newHeight]) => {
  if (autoFit.value && currentCollider.value) {
    if (newWidth !== undefined && width.value !== newWidth) {
      width.value = newWidth
    }
    if (newHeight !== undefined && height.value !== newHeight) {
      height.value = newHeight
    }
  }
})

</script>

<style scoped>
.menu-item {
  @apply relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>