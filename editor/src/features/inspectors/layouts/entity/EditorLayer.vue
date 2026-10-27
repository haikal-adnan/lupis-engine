<template>
  <PropertySection 
    title="Layer" 
    :icon="Layers" 
    v-if="layer"
    data-testid="editor-layer-section"
  >
    <template #header-extra>
      <div class="flex items-center gap-2 max-w-[180px]">
        <div 
          class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border select-none shrink-0"
          :class="isUISection 
            ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' 
            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'"
          data-testid="layer-type-badge"
        >
          {{ isUISection ? 'UI Layer' : 'World Layer' }}
        </div>
      </div>
    </template>

    <template #menu="{ close }">
      <div class="p-1 space-y-0.5 min-w-[160px]" data-testid="layer-menu-content">
        <button 
          @click="visible = !visible; close()" 
          class="menu-item" 
          data-testid="layer-menu-toggle-visibility-btn"
        >
          <component :is="visible ? EyeOff : Eye" class="w-3.5 h-3.5 mr-2 opacity-70" />
          {{ visible ? 'Hide Layer' : 'Show Layer' }}
        </button>
        <button 
          @click="active = !active; close()" 
          class="menu-item" 
          data-testid="layer-menu-toggle-active-btn"
        >
          <Power class="w-3.5 h-3.5 mr-2 opacity-70" />
          {{ active ? 'Deactivate Layer' : 'Activate Layer' }}
        </button>
        <div class="h-px bg-border my-1"></div>
        <button @click="onCopyId(); close()" class="menu-item" data-testid="layer-copy-id-btn">
          <Copy class="w-3.5 h-3.5 mr-2 opacity-70" /> Copy ID
        </button>
        <div class="h-px bg-border my-1"></div>
        <button 
          @click="onDelete(); close()" 
          class="menu-item text-destructive hover:bg-destructive hover:text-destructive-foreground font-medium"
          data-testid="layer-delete-btn"
        >
          <Trash2 class="w-3.5 h-3.5 mr-2" /> Delete Layer
        </button>
      </div>
    </template>

    <PropertyRow label="ID">
      <BaseInput 
        v-model="localScriptId" 
        placeholder="layer_unique_id" 
        :error="hasIdError"
        @blur="commitScriptId"
        data-testid="layer-script-id-input"
      />
    </PropertyRow>


    <PropertyRow label="Z-Index">
      <BaseNumber v-model="zIndex" :step="1" :precision="0" class="font-mono w-full" placeholder="0" data-testid="layer-z-index-input" />
    </PropertyRow>

    <PropertyRow label="Appearance">
      <div class="flex gap-1 items-center w-full">
        <BaseButton 
          :active="active" 
          @click="active = !active" 
          class="flex-1 h-7 text-xs gap-2 justify-center" 
          ghost
          data-testid="layer-active-toggle"
          :data-active="active"
        >
          <Power class="w-3.5 h-3.5" :class="active ? 'text-primary' : 'text-muted-foreground'" />
          <span>{{ active ? 'Active' : 'Inactive' }}</span>
        </BaseButton>
        <div class="w-px h-4 bg-border mx-1"></div>
        <IconButton 
          :active="visible" 
          @click="visible = !visible" 
          :tooltip="visible ? 'Hide Layer' : 'Show Layer'"
          data-testid="layer-visible-toggle"
          :data-visible="visible"
        >
          <Eye v-if="visible" class="w-4 h-4 text-primary" />
          <EyeOff v-else class="w-4 h-4 text-muted-foreground" />
        </IconButton>
        <IconButton 
          :active="locked" 
          @click="locked = !locked" 
          :tooltip="locked ? 'Unlock Layer' : 'Lock Layer'"
          data-testid="layer-lock-toggle"
          :data-locked="locked"
        >
          <Lock v-if="locked" class="w-3.5 h-3.5 text-primary" />
          <Unlock v-else class="w-3.5 h-3.5 text-muted-foreground" />
        </IconButton>
      </div>
    </PropertyRow>

    <PropertyRow label="Opacity">
      <BaseNumber 
        prefix="%"
        v-model="displayOpacity" 
        :min="0" :max="100" :step="1" 
        :scrubbable="true"
        class="font-mono w-full" 
        data-testid="layer-opacity-input"
      />
    </PropertyRow>
  </PropertySection>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Layers, Copy, Trash2, Eye, EyeOff, Lock, Unlock, Power } from 'lucide-vue-next'

import { useInspectorSelection } from "@inspectors/inspectors.js";

import { useSceneStore, useLayerActions } from '@scenes/scenes.js';

import { 
  useClipboard,
  useConfirm,
  usePopAlert
} from '@composables/composables.js';

import { useWorkspaceActions } from "@workspaces/workspaces.js"

import {
  PropertySection,
  PropertyRow,
  BaseNumber,
  BaseButton,
  BaseInput,
  IconButton
} from '@components/components.js';

const { selectedLayerId } = useInspectorSelection()

const { handleCopyId } = useWorkspaceActions()
const sceneStore = useSceneStore()
const { updateLayerProp, deleteLayer } = useLayerActions()
const { copy } = useClipboard()
const { confirm } = useConfirm()
const { showPop } = usePopAlert()

const layer = computed(() => sceneStore.activeLayers.find(l => l.id === selectedLayerId.value))

const isUISection = computed(() => layer.value?.section === 'ui' || layer.value?._section === 'ui')

const localScriptId = ref('')
const hasIdError = ref(false)

watch(() => layer.value, (newLayer) => {
  if (newLayer) {
    localScriptId.value = newLayer.scriptId || ''
    hasIdError.value = false
  }
}, { immediate: true })

const commitScriptId = () => {
  if (!layer.value) return
  
  const originalId = layer.value.scriptId
  const newId = localScriptId.value.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
  
  localScriptId.value = newId

  if (!newId || newId === originalId) {
    localScriptId.value = originalId
    return
  }

  const allLayers = [...(sceneStore.activeScene?.layersWorld || []), ...(sceneStore.activeScene?.layersUI || [])]
  const isDuplicate = allLayers.some(l => l.scriptId === newId && l.id !== layer.value.id)

  if (isDuplicate) {
    hasIdError.value = true
    showPop({ 
      title: 'Duplicate ID', 
      message: `ID "${newId}" is already in use by another layer.`, 
      type: 'warning' 
    })
    localScriptId.value = originalId
    setTimeout(() => { hasIdError.value = false }, 1000)
  } else {
    updateLayerProp(layer.value.id, 'scriptId', newId)
  }
}


const zIndex = computed({
  get: () => layer.value?.zIndex ?? 0,
  set: (val) => { if (layer.value) updateLayerProp(layer.value.id, 'zIndex', val) }
})

const active = computed({
  get: () => layer.value?.active ?? true,
  set: (val) => { if (layer.value) updateLayerProp(layer.value.id, 'active', val) }
})

const visible = computed({
  get: () => layer.value?.visible ?? true,
  set: (val) => { if (layer.value) updateLayerProp(layer.value.id, 'visible', val) }
})

const locked = computed({
  get: () => layer.value?.locked ?? false,
  set: (val) => { if (layer.value) updateLayerProp(layer.value.id, 'locked', val) }
})

const displayOpacity = computed({
  get: () => {
    return Math.round((layer.value?.opacity ?? 1) * 100);
  },
  set: (val) => {
    if (layer.value) {
      const rawVal = parseFloat((val / 100).toFixed(2));
      updateLayerProp(layer.value.id, 'opacity', rawVal);
    }
  }
});

const onCopyId = () => {
  if (layer.value) handleCopyId(layer.value.scriptId)
}

const onDelete = async () => {
  if (!layer.value) return
  if (await confirm({ 
    title: 'Delete Layer?', 
    message: `Deleting layer "${layer.value.scriptId}" will delete all entities inside it. Continue?`, 
    type: 'danger', 
    confirmText: 'Delete' 
  })) {
    deleteLayer(layer.value.id)
    sceneStore.clearSelection()
  }
}
</script>

<style scoped>
.menu-item {
  @apply relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>