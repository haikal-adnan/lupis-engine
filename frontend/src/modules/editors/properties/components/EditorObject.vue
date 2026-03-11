<template>
  <PropertySection title="Object" :icon="Box" v-if="selectedEntity">
    <template #header-extra>
      <div class="flex items-center gap-2 max-w-[180px]">
        <div 
          v-if="prefabId"
          class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border select-none shrink-0"
          :class="hasAnyOverride 
            ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'"
        >
          {{ hasAnyOverride ? 'Override' : 'Sync' }}
        </div>

        <div class="px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground border border-border truncate flex-1 text-center">
          {{ name || 'Entity' }}
        </div>
      </div>
    </template>

    <template #menu="{ close }">
      <div class="p-1 space-y-0.5 min-w-[160px]">
        <template v-if="prefabId">
          <div class="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-tight">Prefab Actions</div>
          <button @click="onApplyToMaster(); close()" :disabled="!hasAnyOverride" class="menu-item text-emerald-500 font-medium">
            <Upload class="w-3.5 h-3.5 mr-2" /> Apply to Master
          </button>
          <button @click="syncObject(); close()" :disabled="!hasAnyOverride" class="menu-item">
            <RefreshCw class="w-3.5 h-3.5 mr-2 opacity-70" /> Revert to Sync
          </button>
          <button @click="syncAllComponents(); close()" class="menu-item">
            <Layers2 class="w-3.5 h-3.5 mr-2 opacity-70" /> Sync All Components
          </button>
          <button @click="unpackPrefab(); close()" class="menu-item text-amber-500">
            <PackageOpen class="w-3.5 h-3.5 mr-2" /> Unpack Prefab
          </button>
          <div class="h-px bg-border my-1"></div>
        </template>
        <button @click="onCopyId(); close()" class="menu-item">
          <Copy class="w-3.5 h-3.5 mr-2 opacity-70" /> Copy ID
        </button>
        <div class="h-px bg-border my-1"></div>
        <button @click="onDelete(); close()" class="menu-item text-destructive hover:bg-destructive hover:text-destructive-foreground font-medium">
          <Trash2 class="w-3.5 h-3.5 mr-2" /> Delete Entity
        </button>
      </div>
    </template>

    <PropertyRow label="ID">
      <BaseInput v-model="localScriptId" placeholder="unique_id_name" :error="hasIdError" @blur="commitScriptId" />
    </PropertyRow>

    <PropertyRow v-if="prefabId" label="Prefab">
      <div class="flex items-center gap-1 w-full">
        <div class="flex-1 flex items-center h-8 px-2 rounded-md border border-input bg-secondary/20 text-muted-foreground select-none overflow-hidden">
          <div class="h-full flex items-center pr-2 border-r border-transparent opacity-50">
            <Box class="w-3.5 h-3.5" />
          </div>
          
          <span class="text-[11px] font-medium italic truncate">
            {{ prefabName }}
          </span>
        </div>

        <IconButton 
          @click="openPrefabMaster" 
          tooltip="Open Prefab Master"
          variant="secondary"
          class="h-8 w-8 border border-input bg-background hover:bg-accent"
        >
          <ExternalLink class="w-3.5 h-3.5" />
        </IconButton>
      </div>
    </PropertyRow>

    <PropertyRow label="Name">
      <BaseInput v-model="name" placeholder="ObjectName" />
    </PropertyRow>

    <PropertyRow label="Tag">
      <BaseSelect v-model="safeTag" :options="tagOptions" :editable="true" action-label="Create New Tag..." placeholder="Select Tag" @action="handleAddTag" @delete="handleDeleteTag" />
    </PropertyRow>

    <PropertyRow label="Z-Index">
      <BaseNumber v-model="zIndex" :step="1" :precision="0" class="font-mono w-full" :disabled="locked" placeholder="0" />
    </PropertyRow>

    <PropertyRow label="Appearance">
      <div class="flex gap-1 items-center w-full">
        <BaseButton :active="active" @click="toggleActive" class="flex-1 h-7 text-xs gap-2 justify-center" ghost>
          <Power class="w-3.5 h-3.5" :class="active ? 'text-primary' : 'text-muted-foreground'" />
          <span>{{ active ? 'Active' : 'Inactive' }}</span>
        </BaseButton>
        <div class="w-px h-4 bg-border mx-1"></div>
        <IconButton :active="visible" @click="visible = !visible" :tooltip="visible ? 'Hide Object' : 'Show Object'">
          <Eye v-if="visible" class="w-4 h-4" />
          <EyeOff v-else class="w-4 h-4 text-muted-foreground" />
        </IconButton>
        <IconButton :active="locked" @click="locked = !locked" :tooltip="locked ? 'Unlock Object' : 'Lock Object'">
          <Lock v-if="locked" class="w-3.5 h-3.5 text-primary" />
          <Unlock v-else class="w-3.5 h-3.5" />
        </IconButton>
      </div>
    </PropertyRow>
  </PropertySection>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { 
  Eye, EyeOff, Lock, Unlock, Power, Box, Copy, Trash2, 
  RefreshCw, PackageOpen, Layers2, ExternalLink, Upload
} from 'lucide-vue-next'
import { EngineBridge } from '@/services/engine/EngineBridge.js'
import { useInspectorLogic } from "@editors/properties/composables/useInspectorLogic.js"
import { useEditorActions } from "@editors/properties/composables/useEditorActions.js"
import { usePrefabActions } from '@editors/prefab/composables/usePrefabActions.js'
import { useSceneStore } from '@/stores/scene/useSceneStore.js'
import { useProjectStore } from '@/stores/useProjectStore.js'
import { usePrefabStore } from '@/stores/usePrefabStore.js'
import { usePrompt } from '@/composables/usePrompt'
import { useConfirm } from '@/composables/useConfirm'
import { useAlert } from '@/composables/useAlert'
import { bus } from '@engines/Util/EventBus.js'
import PropertySection from "@ui/display/PropertySection.vue"
import PropertyRow from "@ui/display/PropertyRow.vue"
import BaseInput from '@/commons/components/inputs/BaseInput.vue'
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue'
import BaseButton from '@/commons/components/buttons/BaseButton.vue'
import IconButton from '@/commons/components/buttons/IconButton.vue'
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue'

const prefabStore = usePrefabStore()
const { 
  bindEntityProp, selectedEntity, prefabId,
  syncObject, syncAllComponents, unpackPrefab, markAsOverridden
} = useInspectorLogic()
const { handleDeleteEntity, handleCopyId } = useEditorActions()
const { applyToMasterPrefab } = usePrefabActions()
const sceneStore = useSceneStore()
const projectStore = useProjectStore()
const { prompt } = usePrompt()
const { confirm } = useConfirm()
const { alert } = useAlert()

const hasIdError = ref(false)
const localScriptId = ref('')
const isProcessing = ref(false)

const name = bindEntityProp('name')
const zIndex = bindEntityProp('zIndex')

const hasAnyOverride = computed(() => {
  if (!selectedEntity.value || !selectedEntity.value.components) return false
  return Object.values(selectedEntity.value.components).some(comp => comp.isOverridden === true)
})

const onApplyToMaster = async () => {
  if (selectedEntity.value && prefabId.value) {
    await applyToMasterPrefab(selectedEntity.value._id)
  }
}

const prefabName = computed(() => {
  if (!prefabId.value) return ''
  const master = prefabStore.getPrefabById(prefabId.value)
  return master ? master.name : 'Unknown Prefab'
})

const openPrefabMaster = () => {
  console.log("Opening Prefab Editor for:", prefabId.value)
}

const active = computed(() => selectedEntity.value?.active ?? true)
const toggleActive = () => {
  if (!selectedEntity.value) return
  const newVal = !active.value
  const id = selectedEntity.value._id
  sceneStore.updateEntityProp(id, 'isActive', newVal) // Ubah 'active' menjadi 'isActive'
  markAsOverridden()
}

const visible = computed({
  get: () => selectedEntity.value?.isVisible ?? true,
  set: (val) => {
    if (selectedEntity.value) sceneStore.updateEntityProp(selectedEntity.value._id, 'visible', val)
  }
})

const locked = computed({
  get: () => selectedEntity.value?.isLocked || false, 
  set: (val) => {
    if (!selectedEntity.value) return
    sceneStore.updateEntityProp(selectedEntity.value._id, 'isLocked', val) // Hapus update _editor, ubah langsung ke isLocked
  }
})

const tag = bindEntityProp('tag')
const safeTag = computed({
  get: () => tag.value || 'Untagged',
  set: (val) => {
    tag.value = val
    markAsOverridden()
  }
})

const tagOptions = computed(() => {
  const project = projectStore.project
  if (!project || !project.tags) return [{ label: 'Untagged', value: 'Untagged' }]
  return project.tags.map(t => ({ label: t, value: t }))
})

const handleAddTag = async () => {
  const newTag = await prompt({ title: 'Create New Tag', message: 'Enter name:', placeholder: 'e.g. Water', confirmText: 'Create' })
  if (!newTag) return
  const cleanTag = newTag.trim()
  if (!cleanTag) return
  const currentTags = projectStore.project?.tags || []
  if (currentTags.some(t => t.toLowerCase() === cleanTag.toLowerCase())) {
    await alert({ title: 'Tag Exists', message: `Tag "${cleanTag}" already in use.`, type: 'warning' })
    return
  }
  projectStore.addTag(cleanTag)
  safeTag.value = cleanTag
}

const handleDeleteTag = async (tagToDelete) => {
  if (tagToDelete === 'Untagged') return
  if (await confirm({ title: 'Delete Tag?', message: `Delete "${tagToDelete}"?`, type: 'danger', confirmText: 'Delete' })) {
    if (safeTag.value === tagToDelete) safeTag.value = 'Untagged'
    projectStore.removeTag(tagToDelete)
  }
}

const onCopyId = () => { if (selectedEntity.value?.scriptId) handleCopyId(selectedEntity.value.scriptId) }
const onDelete = () => { if (selectedEntity.value) handleDeleteEntity(selectedEntity.value) }

watch(() => selectedEntity.value, (newEntity) => {
  if (newEntity) {
    localScriptId.value = newEntity.scriptId || ''
    hasIdError.value = false
    isProcessing.value = false
  }
}, { immediate: true, deep: true })

const commitScriptId = async () => {
  if (!selectedEntity.value || isProcessing.value) return
  isProcessing.value = true
  const originalId = selectedEntity.value.scriptId
  const newId = localScriptId.value.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
  localScriptId.value = newId
  if (!newId || newId === originalId) {
    localScriptId.value = originalId
    hasIdError.value = false
    isProcessing.value = false
    return
  }
  const isDuplicate = sceneStore.activeScene?.entities.some(e => e.scriptId === newId && e._id !== selectedEntity.value._id)
  if (isDuplicate) {
    hasIdError.value = true
    localScriptId.value = originalId
    setTimeout(async () => {
      await alert({ title: 'Duplicate ID', message: `ID "${newId}" exists.`, type: 'warning' })
      hasIdError.value = false
      isProcessing.value = false
    }, 100)
  } else {
    hasIdError.value = false
    if (sceneStore.updateEntityScriptId) sceneStore.updateEntityScriptId(selectedEntity.value._id, newId)
    else sceneStore.updateEntityProp(selectedEntity.value._id, 'scriptId', newId)
    markAsOverridden()
    isProcessing.value = false
  }
}
</script>

<style scoped>
.menu-item {
  @apply relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>