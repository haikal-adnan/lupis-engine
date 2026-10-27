<template>
  <PropertySection 
    title="Object" 
    :icon="Box" 
    v-if="selectedEntity" 
    data-testid="editor-object-section"
  >
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
          {{ localScriptId || 'Entity' }}
        </div>
      </div>
    </template>

    <template #menu="{ close }">
      <div class="p-1 space-y-0.5 min-w-[160px]" role="menu" data-testid="object-section-menu">
        <template v-if="prefabId">
          <div class="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-tight">Prefab Actions</div>
          <button 
            type="button"
            role="menuitem"
            data-menu-item="Apply to Master"
            data-testid="menu-item-apply-to-master"
            :disabled="!hasAnyOverride"
            @click="onApplyToMaster(); close()" 
            class="menu-item text-emerald-500 font-medium"
          >
            <Upload class="w-3.5 h-3.5 mr-2" /> Apply to Master
          </button>
          <button 
            type="button"
            role="menuitem"
            data-menu-item="Revert to Sync"
            data-testid="menu-item-revert-to-sync"
            :disabled="!hasAnyOverride"
            @click="syncObject(); close()" 
            class="menu-item"
          >
            <RefreshCw class="w-3.5 h-3.5 mr-2 opacity-70" /> Revert to Sync
          </button>
          <button 
            type="button"
            role="menuitem"
            data-menu-item="Unpack Prefab"
            data-testid="menu-item-unpack-prefab"
            @click="unpackPrefab(); close()" 
            class="menu-item text-amber-500"
          >
            <PackageOpen class="w-3.5 h-3.5 mr-2" /> Unpack Prefab
          </button>
          <div class="h-px bg-border my-1" role="separator"></div>
        </template>
        <button 
          type="button"
          role="menuitem"
          data-menu-item="Copy ID"
          data-testid="menu-item-copy-id"
          @click="onCopyId(); close()" 
          class="menu-item"
        >
          <Copy class="w-3.5 h-3.5 mr-2 opacity-70" /> Copy ID
        </button>
        <div class="h-px bg-border my-1" role="separator"></div>
        <button 
          type="button"
          role="menuitem"
          data-menu-item="Delete Entity"
          data-testid="menu-item-delete-entity"
          @click="onDelete(); close()" 
          class="menu-item text-destructive hover:bg-destructive hover:text-destructive-foreground font-medium"
        >
          <Trash2 class="w-3.5 h-3.5 mr-2" /> Delete Entity
        </button>
      </div>
    </template>

    <PropertyRow label="ID">
      <BaseInput 
        v-model="localScriptId" 
        placeholder="unique_id_name" 
        :error="hasIdError" 
        @blur="commitScriptId" 
        data-testid="object-script-id-input"
      />
    </PropertyRow>

    <PropertyRow v-if="prefabId" label="Prefab">
      <div class="flex items-center gap-1 w-full">
        <div class="flex-1 flex items-center h-8 px-2 rounded-md border border-input bg-secondary/20 text-muted-foreground select-none overflow-hidden">
          <div class="h-full flex items-center pr-2 border-r border-transparent opacity-50">
            <Box class="w-3.5 h-3.5" />
          </div>
          
          <span class="text-[11px] font-medium italic truncate">
            {{ prefabScriptId }}
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



    <PropertyRow label="Tag">
      <!-- Assigned Tags (Displayed below title tag, above dropdown) -->
      <div v-if="currentEntityTags.length > 0" class="flex flex-col gap-1 w-full mb-1.5" data-testid="assigned-tags-list">
        <div 
          v-for="assignedTag in currentEntityTags" 
          :key="assignedTag"
          class="group flex items-center justify-between h-7 px-2.5 rounded-md border border-input bg-secondary/30 hover:bg-secondary/50 text-foreground transition-all duration-150 select-none"
          :data-testid="`entity-tag-item-${assignedTag}`"
        >
          <span class="text-xs font-mono font-medium truncate">
            {{ assignedTag }}
          </span>

          <button
            type="button"
            @click.stop="handleRemoveTagFromEntity(assignedTag)"
            :title="`Remove tag ${assignedTag}`"
            class="opacity-0 group-hover:opacity-100 flex items-center justify-center h-5 w-5 rounded hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-all duration-150 ml-auto shrink-0"
            :data-testid="`remove-entity-tag-${assignedTag}`"
          >
            <Trash2 class="w-3 h-3" />
          </button>
        </div>
      </div>

      <!-- Dropdown for Creating, Selecting, Renaming, and Deleting Tags -->
      <BaseSelect 
        v-model="selectDropdownValue" 
        :options="tagOptions" 
        :editable="true" 
        action-label="Create New Tag..." 
        placeholder="Select tag..." 
        @action="handleCreateNewTag" 
        @select="handleSelectTagFromDropdown"
        @rename="handleRenameTagInProject"
        @delete="handleDeleteTagFromProject" 
        data-testid="object-tag-select"
      />
    </PropertyRow>

    <PropertyRow label="Z-Index">
      <BaseNumber 
        v-model="zIndex" 
        :step="1" 
        :precision="0" 
        class="font-mono w-full" 
        :disabled="locked" 
        placeholder="0" 
        data-testid="object-zindex-input"
      />
    </PropertyRow>

    <PropertyRow label="Appearance">
      <div class="flex gap-1 items-center w-full">
        <BaseButton 
          :active="active" 
          @click="toggleActive" 
          class="flex-1 h-7 text-xs gap-2 justify-center" 
          ghost
          data-testid="object-active-toggle"
          :data-active="active"
        >
          <span>{{ active ? 'Active' : 'Inactive' }}</span>
        </BaseButton>
        <div class="w-px h-4 bg-border mx-1"></div>
        <IconButton 
          :active="visible" 
          @click="visible = !visible" 
          :tooltip="visible ? 'Hide Object' : 'Show Object'"
          data-testid="object-visible-toggle"
          :data-visible="visible"
        >
          <Eye v-if="visible" class="w-4 h-4" />
          <EyeOff v-else class="w-4 h-4 text-muted-foreground" />
        </IconButton>
        <IconButton 
          :active="locked" 
          @click="locked = !locked" 
          :tooltip="locked ? 'Unlock Object' : 'Lock Object'"
          data-testid="object-lock-toggle"
          :data-locked="locked"
        >
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

import { 
  useInspectorSelection, 
  useInspectorPrefab, 
  useInspectorBinding 
} from "@inspectors/inspectors.js";

import { useWorkspaceActions, useWorkspaceStore } from "@workspaces/workspaces.js"
import { usePrefabActions } from '@prefabs/prefabs.js';
import { useSceneStore, useEntityActions } from '@scenes/scenes.js';
import { useProjectStore } from '@projects/projects.js'
import { usePrefabStore } from '@prefabs/prefabs.js';
import { engineBridge } from "@engines/engines.js";
import { 
  usePrompt,
  useConfirm,
  useAlert
} from '@composables/composables.js'

import {
  PropertySection,
  PropertyRow,
  BaseNumber,
  BaseButton,
  BaseInput,
  IconButton,
  BaseSelect
} from '@components/components.js';

// 1. Selection State
const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
const workspaceStore = useWorkspaceStore()

// 2. Prefab & Component Operations
const { 
  prefabId, 
  syncObject, 
  unpackPrefab, 
  markAsOverridden 
} = useInspectorPrefab()

// 3. Property Bindings
const { bindEntityProp } = useInspectorBinding()

// Stores & Composables
const prefabStore = usePrefabStore()
const { handleDeleteEntity, handleCopyId } = useWorkspaceActions()
const { applyToMasterPrefab } = usePrefabActions()
const sceneStore = useSceneStore()
const { updateEntityProp, updateEntityScriptId } = useEntityActions()
const projectStore = useProjectStore()
const { prompt } = usePrompt()
const { confirm } = useConfirm()
const { alert } = useAlert()

const hasIdError = ref(false)
const localScriptId = ref('')
const isProcessing = ref(false)

const zIndex = bindEntityProp('zIndex')

// Komputasi deep-checking override flag di level entitas maupun komponen
const hasAnyOverride = computed(() => {
  const entity = selectedEntity.value
  if (!entity) return false

  if (entity.overridden) return true

  if (entity.components) {
    return Object.values(entity.components).some(comp => comp && comp.overridden === true)
  }

  return false
})

const onApplyToMaster = async () => {
  if (selectedEntity.value && prefabId.value) {
    await applyToMasterPrefab(selectedEntity.value.id)
  }
}

const prefabScriptId = computed(() => {
  if (!prefabId.value) return ''
  const master = prefabStore.getPrefabById(prefabId.value)
  return master ? master.scriptId : 'Unknown Prefab'
})

const openPrefabMaster = () => {
  console.log("Opening Prefab Editor for:", prefabId.value)
}

const active = computed(() => selectedEntity.value?.active ?? true)
const toggleActive = () => {
  if (!selectedEntity.value) return
  const newVal = !active.value
  const id = selectedEntity.value.id
  updateEntityProp(id, 'active', newVal) 
  markAsOverridden()
}

const visible = computed({
  get: () => selectedEntity.value?.visible ?? true,
  set: (val) => {
    if (selectedEntity.value) updateEntityProp(selectedEntity.value.id, 'visible', val)
  }
})

const locked = computed({
  get: () => selectedEntity.value?.locked || false, 
  set: (val) => {
    if (!selectedEntity.value) return
    updateEntityProp(selectedEntity.value.id, 'locked', val) 
  }
})

const selectDropdownValue = ref('')

const sanitizeTagName = (val) => {
  if (!val) return ''
  return String(val).trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
}

const currentEntityTags = computed(() => {
  const ent = selectedEntity.value
  if (!ent) return []
  if (Array.isArray(ent.tags)) {
    return ent.tags
  }
  if (ent.tag && String(ent.tag).toLowerCase() !== 'untagged') {
    return [ent.tag]
  }
  return []
})

const tagOptions = computed(() => {
  const project = projectStore.project
  const rawList = project?.tags || ['Untagged', 'Player', 'Enemy']
  const entityTagsLower = new Set(currentEntityTags.value.map(t => t.toLowerCase()))

  return rawList
    .filter(t => String(t).toLowerCase() !== 'untagged')
    .map(t => ({
      label: t,
      value: t,
      disabled: entityTagsLower.has(String(t).toLowerCase())
    }))
})

const applyTagsToEntity = (newTags) => {
  if (!selectedEntity.value) return
  const id = selectedEntity.value.id

  const cleanTags = []
  const seen = new Set()
  for (const t of newTags) {
    const clean = sanitizeTagName(t)
    if (clean && !seen.has(clean.toLowerCase())) {
      seen.add(clean.toLowerCase())
      cleanTags.push(clean)
    }
  }

  const primaryTag = cleanTags[0] || 'untagged'

  if (isEditingMasterPrefab && isEditingMasterPrefab.value) {
    prefabStore.updatePrefab(workspaceStore.activeTab.id, {
      tags: cleanTags,
      tag: primaryTag
    })
    engineBridge.updatePrefabMasterProp?.({
      prefabId: workspaceStore.activeTab.id,
      prop: 'tags',
      value: cleanTags
    })
    engineBridge.updatePrefabMasterProp?.({
      prefabId: workspaceStore.activeTab.id,
      prop: 'tag',
      value: primaryTag
    })
  } else {
    updateEntityProp(id, 'tags', cleanTags)
    updateEntityProp(id, 'tag', primaryTag)
  }

  markAsOverridden()
}

const handleSelectTagFromDropdown = (chosenTag) => {
  if (!chosenTag) return
  const clean = sanitizeTagName(chosenTag)
  if (!clean || clean.toLowerCase() === 'untagged') {
    selectDropdownValue.value = ''
    return
  }

  const current = [...currentEntityTags.value]
  if (current.some(t => t.toLowerCase() === clean.toLowerCase())) {
    selectDropdownValue.value = ''
    return
  }

  current.push(clean)
  applyTagsToEntity(current)
  selectDropdownValue.value = ''
}

const handleRemoveTagFromEntity = (tagToRemove) => {
  const targetLower = String(tagToRemove).trim().toLowerCase()
  const nextTags = currentEntityTags.value.filter(t => String(t).trim().toLowerCase() !== targetLower)
  applyTagsToEntity(nextTags)
}

const handleCreateNewTag = async () => {
  const rawInput = await prompt({
    title: 'Create New Tag',
    message: 'Enter tag name (a-z, A-Z, 0-9, _):',
    placeholder: 'e.g. Water_Obstacle',
    confirmText: 'Create'
  })
  if (!rawInput) return

  const cleanTag = sanitizeTagName(rawInput)
  if (!cleanTag) {
    await alert({
      title: 'Invalid Tag',
      message: 'Tag name can only contain letters, numbers, and underscores (a-zA-Z0-9_).',
      type: 'warning'
    })
    return
  }

  const currentTags = projectStore.project?.tags || []
  if (currentTags.some(t => t.toLowerCase() === cleanTag.toLowerCase())) {
    await alert({
      title: 'Tag Exists',
      message: `Tag "${cleanTag}" already exists.`,
      type: 'warning'
    })
    return
  }

  projectStore.addTag(cleanTag)

  const current = [...currentEntityTags.value]
  if (!current.some(t => t.toLowerCase() === cleanTag.toLowerCase())) {
    current.push(cleanTag)
    applyTagsToEntity(current)
  }
  selectDropdownValue.value = ''
}

const renameTagAcrossAllScenes = (oldTag, newTag) => {
  const oldLower = String(oldTag).trim().toLowerCase()
  const scenes = sceneStore.scenes || []

  for (const scene of scenes) {
    if (!Array.isArray(scene.entities)) continue
    for (const ent of scene.entities) {
      let changed = false
      if (Array.isArray(ent.tags)) {
        const nextTags = []
        const seen = new Set()
        for (const t of ent.tags) {
          const mapped = String(t).trim().toLowerCase() === oldLower ? newTag : t
          const mappedLower = mapped.toLowerCase()
          if (!seen.has(mappedLower)) {
            seen.add(mappedLower)
            nextTags.push(mapped)
          }
        }
        if (JSON.stringify(nextTags) !== JSON.stringify(ent.tags)) {
          ent.tags = nextTags
          ent.tag = nextTags[0] || 'untagged'
          changed = true
        }
      } else if (ent.tag && String(ent.tag).trim().toLowerCase() === oldLower) {
        ent.tag = newTag
        ent.tags = [newTag]
        changed = true
      }

      if (changed && engineBridge?.updateEntityProp) {
        engineBridge.updateEntityProp({ id: ent.id, prop: 'tags', value: ent.tags })
        engineBridge.updateEntityProp({ id: ent.id, prop: 'tag', value: ent.tag })
      }
    }
  }
}

const handleRenameTagInProject = async (tagToRename) => {
  if (String(tagToRename).toLowerCase() === 'untagged') return

  const rawInput = await prompt({
    title: 'Rename Tag',
    message: `Enter new name for "${tagToRename}" (a-z, A-Z, 0-9, _):`,
    placeholder: tagToRename,
    confirmText: 'Rename'
  })
  if (!rawInput) return

  const newCleanTag = sanitizeTagName(rawInput)
  if (!newCleanTag) {
    await alert({
      title: 'Invalid Tag',
      message: 'Tag name can only contain letters, numbers, and underscores (a-zA-Z0-9_).',
      type: 'warning'
    })
    return
  }

  if (newCleanTag.toLowerCase() === tagToRename.toLowerCase() && newCleanTag === tagToRename) {
    return
  }

  const currentTags = projectStore.project?.tags || []
  const duplicate = currentTags.some(t => t.toLowerCase() === newCleanTag.toLowerCase() && t.toLowerCase() !== tagToRename.toLowerCase())
  if (duplicate) {
    await alert({
      title: 'Tag Exists',
      message: `Tag "${newCleanTag}" already exists.`,
      type: 'warning'
    })
    return
  }

  projectStore.renameTag(tagToRename, newCleanTag)
  renameTagAcrossAllScenes(tagToRename, newCleanTag)
  selectDropdownValue.value = ''
}

const removeTagAcrossAllScenes = (tagToRemove) => {
  const targetLower = String(tagToRemove).trim().toLowerCase()
  const scenes = sceneStore.scenes || []

  for (const scene of scenes) {
    if (!Array.isArray(scene.entities)) continue
    for (const ent of scene.entities) {
      let changed = false
      if (Array.isArray(ent.tags)) {
        const nextTags = ent.tags.filter(t => String(t).trim().toLowerCase() !== targetLower)
        if (nextTags.length !== ent.tags.length) {
          ent.tags = nextTags
          ent.tag = nextTags[0] || 'untagged'
          changed = true
        }
      } else if (ent.tag && String(ent.tag).trim().toLowerCase() === targetLower) {
        ent.tag = 'untagged'
        ent.tags = []
        changed = true
      }

      if (changed && engineBridge?.updateEntityProp) {
        engineBridge.updateEntityProp({ id: ent.id, prop: 'tags', value: ent.tags })
        engineBridge.updateEntityProp({ id: ent.id, prop: 'tag', value: ent.tag })
      }
    }
  }
}

const handleDeleteTagFromProject = async (tagToDelete) => {
  if (String(tagToDelete).toLowerCase() === 'untagged') return

  if (await confirm({
    title: 'Delete Tag?',
    message: `Delete tag "${tagToDelete}" from project? It will be removed from all entities.`,
    type: 'danger',
    confirmText: 'Delete'
  })) {
    projectStore.removeTag(tagToDelete)
    removeTagAcrossAllScenes(tagToDelete)
    selectDropdownValue.value = ''
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
  const isDuplicate = sceneStore.activeScene?.entities.some(e => e.scriptId === newId && e.id !== selectedEntity.value.id)
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
    updateEntityScriptId(selectedEntity.value.id, newId)
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