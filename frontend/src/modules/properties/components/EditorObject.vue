<template>
  <PropertySection title="Object" :icon="Box" v-if="selectedEntity">
    <template #header-extra>
      <div class="px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground border border-border truncate max-w-[120px]">
        {{ name || 'Entity' }}
      </div>
    </template>

    <template #menu="{ close }">
      <div class="p-1 space-y-0.5 min-w-[140px]">
        <button @click="onCopyId(); close()" class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors">
          <Copy class="w-3.5 h-3.5 mr-2 opacity-70" /> Copy ID
        </button>
        <div class="h-px bg-border my-1"></div>
        <button @click="onDelete(); close()" class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors">
          <Trash2 class="w-3.5 h-3.5 mr-2" /> Delete Entity
        </button>
      </div>
    </template>

    <PropertyRow label="ID">
      <BaseInput v-model="localScriptId" placeholder="unique_id_name" :error="hasIdError" @blur="commitScriptId" />
    </PropertyRow>

    <PropertyRow label="Name">
      <BaseInput v-model="name" placeholder="ObjectName" />
    </PropertyRow>

    <PropertyRow label="Tag">
      <BaseSelect v-model="safeTag" :options="tagOptions" :editable="true" action-label="Create New Tag..." placeholder="Select Tag" @action="handleAddTag" @delete="handleDeleteTag" />
    </PropertyRow>

    <PropertyRow label="Appearance">
      <div class="flex gap-1 items-center w-full">
        <BaseButton 
          :active="active"
          @click="active = !active"
          class="flex-1 h-7 text-xs gap-2 justify-center"
          ghost
        >
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
import { Eye, EyeOff, Lock, Unlock, Power, Box, Copy, Trash2 } from 'lucide-vue-next'

import { EngineBridge } from '@/services/engine/EngineBridge.js'
import { useInspectorLogic } from "@/modules/properties/composables/useInspectorLogic.js"
import { useEditorActions } from "@/modules/properties/composables/useEditorActions.js"
import { useSceneStore } from '@/stores/scene/useSceneStore.js'
import { useProjectStore } from '@/stores/useProjectStore.js'
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

const { bindEntityProp, selectedEntity } = useInspectorLogic()
const { handleDeleteEntity, handleCopyId } = useEditorActions()
const sceneStore = useSceneStore()
const projectStore = useProjectStore()

const { prompt } = usePrompt()
const { confirm } = useConfirm()
const { alert } = useAlert()

const hasIdError = ref(false)
const localScriptId = ref('')
const isProcessing = ref(false)

const name = bindEntityProp('name')

const active = computed({
  get: () => selectedEntity.value?.active ?? true, 
  set: (val) => {
    if (!selectedEntity.value) return
    const id = selectedEntity.value._id
    sceneStore.updateEntityProp(id, 'active', val)
    setTimeout(() => {
      const bridge = EngineBridge.engineInstance ? EngineBridge.engineInstance.bus : bus
      bridge.emit('ui:select-by-id', [id])
    }, 10)
  }
})

const visible = computed({
  get: () => selectedEntity.value?.visible ?? true,
  set: (val) => {
    if (selectedEntity.value) {
      sceneStore.updateEntityProp(selectedEntity.value._id, 'visible', val)
    }
  }
})

const locked = computed({
  get: () => selectedEntity.value?._editor?.locked || false,
  set: (val) => {
    if (!selectedEntity.value) return
    const currentEditor = selectedEntity.value._editor || {}
    sceneStore.updateEntityProp(selectedEntity.value._id, '_editor', { ...currentEditor, locked: val })
    setTimeout(() => {
      const bridge = EngineBridge.engineInstance ? EngineBridge.engineInstance.bus : bus
      bridge.emit('ui:select-by-id', [selectedEntity.value._id])
    }, 10)
  }
})

const tag = bindEntityProp('tag')
const safeTag = computed({
  get: () => tag.value || 'Untagged',
  set: (val) => tag.value = val
})

const tagOptions = computed(() => {
  const project = projectStore.project
  if (!project || !project.tags) {
    return [{ label: 'Untagged', value: 'Untagged' }]
  }
  return project.tags.map(t => ({
    label: t,
    value: t
  }))
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
    isProcessing.value = false
  }
}
</script>
