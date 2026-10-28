<template>
  <PropertySection title="Collider" :icon="Cuboid" v-if="hasComponent" data-testid="editor-collider-section">
    
    <template #header-extra>
      <div 
        v-if="prefabId"
        class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border select-none shrink-0"
        :class="overridden 
          ? 'text-amber-500 border-amber-500' 
          : 'text-emerald-500 border-emerald-500'"
        data-testid="collider-prefab-badge"
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
            data-testid="collider-sync-btn"
          >
            <RefreshCw class="w-3.5 h-3.5 mr-2 opacity-70" /> 
            Sync Component
          </button>
          <div class="h-px bg-border my-1"></div>
        </template>

        <button 
          @click="removeComponent('Collider'); close()" 
          class="menu-item text-destructive hover:bg-destructive hover:text-destructive-foreground font-medium"
          data-testid="collider-remove-all-btn"
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
        
        <BaseDropdown class="w-full" data-testid="collider-select-dropdown">
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
              data-testid="collider-dropdown-trigger"
            >
              <span class="truncate font-medium">
                {{ collidersData.length > 0 ? (currentCollider?.scriptId ? `${currentCollider.scriptId} (${currentCollider?.type})` : `Collider ${selectedIndex + 1} (${currentCollider?.type})`) : 'No Colliders Attached' }}
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
                :data-testid="`collider-option-${idx}`"
              >
                <div class="flex items-center gap-2 truncate">
                   <div class="w-1 h-1 rounded-full" :class="idx === selectedIndex ? 'bg-primary' : 'bg-transparent'"></div>
                   <span class="truncate">{{ col.scriptId ? `${col.scriptId} (${col.type})` : `Collider ${idx + 1} (${col.type})` }}</span>
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
            data-testid="collider-options-menu-trigger"
          >
            <MoreVertical class="w-4 h-4" />
          </button>
        </template>

        <template #default="{ close }">
          <div class="flex flex-col text-xs min-w-[160px] py-1">
            <button 
              @click="addNewCollider(); close()"
              class="flex items-center px-2 py-1.5 mx-1 rounded-sm hover:bg-accent hover:text-accent-foreground text-left transition-colors"
              data-testid="collider-add-btn"
            >
              <Plus class="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <span>Add Collider</span>
            </button>

            <button 
              v-if="currentCollider"
              @click="removeCurrentCollider(); close()"
              class="flex items-center px-2 py-1.5 mx-1 rounded-sm hover:bg-destructive/10 text-destructive hover:text-destructive text-left transition-colors"
              data-testid="collider-remove-current-btn"
            >
              <Trash2 class="w-3.5 h-3.5 mr-2" />
              <span>Remove Current</span>
            </button>
          </div>
        </template>
      </BaseDropdown>
    </div>

    <div v-if="currentCollider" class="space-y-2">
      <PropertyRow label="Script ID">
        <BaseInput 
          v-model="localScriptId" 
          placeholder="col_hitbox_1" 
          :error="hasIdError"
          @blur="commitScriptId"
          class="font-mono text-xs w-full" 
          data-testid="collider-script-id" 
        />
      </PropertyRow>

      <PropertyRow label="Status">
        <BaseButton 
          :active="enabled"
          @click="enabled = !enabled"
          class="w-full h-7 text-xs gap-2 justify-start px-3 border border-border/50 bg-background/50 hover:bg-accent transition-all"
          ghost
          data-testid="collider-enabled-toggle"
          :data-active="enabled"
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
          data-testid="collider-type-select"
        />
      </PropertyRow>

      <PropertyRow label="Offset">
        <div class="grid grid-cols-2 gap-2 transition-all duration-300" :class="{ 'opacity-50 grayscale pointer-events-none': autoFit }">
          <BaseNumber v-model="offsetX" prefix="X" :step="1" :precision="2" class="font-mono" :disabled="autoFit" data-testid="collider-offset-x" />
          <BaseNumber v-model="offsetY" prefix="Y" :step="1" :precision="2" class="font-mono" :disabled="autoFit" data-testid="collider-offset-y" />
        </div>
      </PropertyRow>

      <PropertyRow label="Size (px)">
        <div class="grid grid-cols-2 gap-2 transition-all duration-300" :class="{ 'opacity-50 grayscale pointer-events-none': autoFit }">
          <BaseNumber v-model="width" prefix="W" :min="0" :step="1" :precision="2" class="font-mono" :disabled="autoFit" data-testid="collider-size-w" />
          <BaseNumber v-model="height" prefix="H" :min="0" :step="1" :precision="2" class="font-mono" :disabled="autoFit" data-testid="collider-size-h" />
        </div>
      </PropertyRow>

      <PropertyRow label="Corner Radius (Capsule)">
        <BaseNumber 
          v-model="cornerRadius" 
          prefix="R" 
          :min="0" 
          :max="maxRadius" 
          :step="1" 
          :precision="1" 
          class="font-mono w-full transition-all duration-300" 
          :class="{ 'opacity-50 grayscale pointer-events-none': autoFit }"
          :disabled="autoFit" 
          data-testid="collider-corner-radius" 
        />
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
              data-testid="collider-rotation"
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
          data-testid="collider-pivot-control"
        />
      </div>

      <div class="px-1 mb-2 mt-1 space-y-1.5">
        <BaseCheckbox 
          v-model="autoFit" 
          label="Fit to Transform Size & Rotation" 
          data-testid="collider-autofit-toggle"
        />
        <BaseCheckbox 
          v-model="lockWorldRotation" 
          label="Lock World Rotation (Stay Upright)" 
          data-testid="collider-lock-rotation-toggle"
        />
        <BaseCheckbox 
          v-model="autoFlipX" 
          label="Auto Flip with Facing / flipX" 
          data-testid="collider-autoflip-toggle"
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

import { 
  useInspectorSelection, 
  useInspectorPrefab 
} from "@inspectors/inspectors.js";

import { useEntityActions } from '@scenes/scenes.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { usePrefabStore } from '@prefabs/prefabs.js';

import { 
  usePopAlert,
  useConfirm
} from '@composables/composables.js';

import {
  PropertySection,
  PropertyRow,
  BaseDropdown,
  PivotControl,
  BaseNumber,
  BaseSelect,
  BaseButton,
  BaseCheckbox,
  BaseInput
} from '@components/components.js';
import { GenerateUUID, sanitizeScriptId } from '@utils/utils.js';

const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()

const { 
  prefabId, 
  getComponentOverrideStatus, 
  syncComponent, 
  removeComponent 
} = useInspectorPrefab(selectedEntity, isEditingMasterPrefab)

const { updateComponentProp } = useEntityActions()
const workspaceStore = useWorkspaceStore()
const prefabStore = usePrefabStore()
const { confirm } = useConfirm()
const { showPop } = usePopAlert()

const hasComponent = computed(() => !!selectedEntity.value?.components?.Collider)
const overridden = getComponentOverrideStatus('Collider')

const collidersData = computed(() => selectedEntity.value?.components?.Collider?.data || [])
const selectedIndex = ref(0)

watch(() => selectedEntity.value?.id, () => { selectedIndex.value = 0 })

const currentCollider = computed(() => collidersData.value[selectedIndex.value])

const typeOptions = [
  { label: 'Solid (Physics)', value: 'solid' },
  { label: 'Trigger (Zone)', value: 'trigger' },
  { label: 'Hitbox (Attack)', value: 'hitbox' },
  { label: 'Hurtbox (Damage Zone)', value: 'hurtbox' }
]

function selectIndex(idx, close) {
   selectedIndex.value = idx
   if (close) close()
}

const markComponentAsOverridden = () => {
  if (selectedEntity.value && prefabId.value && !isEditingMasterPrefab.value) {
     updateComponentProp(selectedEntity.value.id, 'Collider', 'overridden', true)
  }
}

const bindCurrentColliderProp = (propName) => computed({
  get: () => currentCollider.value ? currentCollider.value[propName] : undefined,
  set: (val) => {
    if (!currentCollider.value || !selectedEntity.value) return
    const path = `data.${selectedIndex.value}.${propName}`
    
    let finalVal = val;
    if (propName === 'enabled' || propName === 'autoFit' || propName === 'lockWorldRotation' || propName === 'autoFlipX') finalVal = Boolean(val);
    if (typeof finalVal === 'number') finalVal = Math.round(finalVal * 100) / 100;

    if (isEditingMasterPrefab.value) {
      prefabStore.updateComponentProp(workspaceStore.activeTab.id, 'Collider', path, finalVal)
    } else {
      updateComponentProp(selectedEntity.value.id, 'Collider', path, finalVal)
      markComponentAsOverridden()
    }
  }
})

const type = bindCurrentColliderProp('type')
const enabled = bindCurrentColliderProp('enabled')
const autoFit = bindCurrentColliderProp('autoFit')
const lockWorldRotation = bindCurrentColliderProp('lockWorldRotation')
const autoFlipX = bindCurrentColliderProp('autoFlipX')

const localScriptId = ref('')
const hasIdError = ref(false)

watch(() => currentCollider.value?.scriptId, (val) => {
  localScriptId.value = val || ''
  hasIdError.value = false
}, { immediate: true })

const commitScriptId = () => {
  if (!currentCollider.value || !selectedEntity.value) return
  const originalId = currentCollider.value.scriptId || ''
  const fallback = `col_${currentCollider.value.type || 'solid'}_${selectedIndex.value + 1}`
  const sanitized = sanitizeScriptId(localScriptId.value.trim(), originalId || fallback)
  localScriptId.value = sanitized

  if (!sanitized || sanitized === originalId) {
    localScriptId.value = originalId
    return
  }

  const isDuplicate = collidersData.value.some((c, idx) => idx !== selectedIndex.value && c.scriptId === sanitized)
  if (isDuplicate) {
    hasIdError.value = true
    showPop({
      title: 'Duplicate Collider ID',
      message: `ID "${sanitized}" is already used by another collider on this entity.`,
      type: 'warning'
    })
    localScriptId.value = originalId
    setTimeout(() => { hasIdError.value = false }, 1000)
    return
  }

  const path = `data.${selectedIndex.value}.scriptId`
  if (isEditingMasterPrefab.value) {
    prefabStore.updateComponentProp(workspaceStore.activeTab.id, 'Collider', path, sanitized)
  } else {
    updateComponentProp(selectedEntity.value.id, 'Collider', path, sanitized)
    markComponentAsOverridden()
  }
}
const offsetX = bindCurrentColliderProp('offsetX')
const offsetY = bindCurrentColliderProp('offsetY')
const width = bindCurrentColliderProp('width')
const height = bindCurrentColliderProp('height')
const cornerRadius = bindCurrentColliderProp('cornerRadius')
const rotation = bindCurrentColliderProp('rotation')
const pivotX = bindCurrentColliderProp('pivotX')
const pivotY = bindCurrentColliderProp('pivotY')

const maxRadius = computed(() => {
  const w = Number(width.value) || 0;
  const h = Number(height.value) || 0;
  return Math.max(0, Math.floor(Math.min(w, h) / 2));
});

function addNewCollider() {
  const nextIdx = collidersData.value.length + 1
  const newCol = { 
    id: GenerateUUID(),
    scriptId: `col_solid_${nextIdx}`,
    type: 'solid', 
    enabled: true, 
    autoFit: false, 
    lockWorldRotation: false,
    autoFlipX: true,
    offsetX: 0, 
    offsetY: 0, 
    width: 32, 
    height: 32,
    cornerRadius: 0,
    rotation: 0,
    pivotX: 0,
    pivotY: 0
  }
  
  const currentList = [...collidersData.value, newCol]

  if (isEditingMasterPrefab.value) {
    prefabStore.updateComponentProp(workspaceStore.activeTab.id, 'Collider', 'data', currentList)
  } else {
    updateComponentProp(selectedEntity.value.id, 'Collider', 'data', currentList)
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
        prefabStore.updateComponentProp(workspaceStore.activeTab.id, 'Collider', 'data', currentList)
      } else {
        updateComponentProp(selectedEntity.value.id, 'Collider', 'data', currentList)
        markComponentAsOverridden()
      }
      
      selectedIndex.value = Math.max(0, selectedIndex.value - 1)
      showPop({ title: 'Collider Removed', type: 'info' })
   }
}

const activeTransform = computed(() => {
  if (!selectedEntity.value?.components) return null
  return selectedEntity.value.components.UITransform || selectedEntity.value.components.Transform
})

const transformWidth = computed(() => activeTransform.value?.width)
const transformHeight = computed(() => activeTransform.value?.height)

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
    prefabStore.updateComponentProp(workspaceStore.activeTab.id, 'Collider', `data.${selectedIndex.value}.pivotX`, newPx);
    prefabStore.updateComponentProp(workspaceStore.activeTab.id, 'Collider', `data.${selectedIndex.value}.pivotY`, newPy);
    prefabStore.updateComponentProp(workspaceStore.activeTab.id, 'Collider', `data.${selectedIndex.value}.offsetX`, newOx);
    prefabStore.updateComponentProp(workspaceStore.activeTab.id, 'Collider', `data.${selectedIndex.value}.offsetY`, newOy);
  } else {
    updateComponentProp(selectedEntity.value.id, 'Collider', `data.${selectedIndex.value}.pivotX`, newPx);
    updateComponentProp(selectedEntity.value.id, 'Collider', `data.${selectedIndex.value}.pivotY`, newPy);
    updateComponentProp(selectedEntity.value.id, 'Collider', `data.${selectedIndex.value}.offsetX`, newOx);
    updateComponentProp(selectedEntity.value.id, 'Collider', `data.${selectedIndex.value}.offsetY`, newOy);
    markComponentAsOverridden();
  }
}

const syncSizeToTransform = () => {
  if (!selectedEntity.value || !currentCollider.value) return
  const transform = activeTransform.value
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