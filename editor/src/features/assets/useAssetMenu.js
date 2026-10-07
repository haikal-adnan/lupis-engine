import { ref, computed } from 'vue'
import { 
  FolderPlus, Download, RefreshCw, Edit2, Trash2, 
  Stamp, Type, Copy, Scissors, ClipboardPaste,
  Volume2, Hash 
} from 'lucide-vue-next'
import { useAssetActions } from '@assets/assets.js'
import { useFolderStore, useFolderActions } from '@folders/folders.js';
import { useSceneStore } from '@scenes/scenes.js';

import { 
  usePopAlert,
  usePrompt,
  useConfirm
} from '@composables/composables.js';

import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useAnimatorLogic } from '@animators/animators.js'

export function useAssetMenu(selectedIdRef, triggerUploadCb, logicActions) {
  const { deleteAsset, renameAsset } = useAssetActions()
  const { createNewFolder, deleteFolder, renameFolder } = useFolderActions()
  const sceneStore = useSceneStore()
  const folderStore = useFolderStore()
  const workspaceStore = useWorkspaceStore()
  const { activeClipId } = useAnimatorLogic()

  const { showPop } = usePopAlert() 
  const { prompt } = usePrompt()
  const { confirm } = useConfirm() 
  
  const menu = ref({ visible: false, x: 0, y: 0, item: null })

  const handleContextMenu = (e, item) => {
    if (item) selectedIdRef.value = item.id
    menu.value = { visible: true, x: e.clientX, y: e.clientY, item: item }
  }

  const closeMenu = () => { menu.value.visible = false }

  const getSelectedEntity = () => {
    if (sceneStore.selectedEntityIds.length === 0) return null
    const scene = sceneStore.activeScene
    if (!scene) return null
    return scene.entities.find(e => e.id === sceneStore.selectedEntityIds[0])
  }

  const applyAsset = (asset, entityId, componentName) => {
    closeMenu()
    const scene = sceneStore.activeScene
    if (!scene) return

    const entity = scene.entities.find(e => e.id === entityId)
    if (!entity || !entity.components[componentName]) {
      showPop({ title: 'Error', message: 'Target component not found.', type: 'error' })
      return
    }

    try {
      if (componentName === 'Audio') {
        const audioComp = entity.components.Audio
        if (!audioComp.currentClip) {
          showPop({ title: 'Failed', message: 'No active clip selected in Audio Bank.', type: 'warning' })
          return
        }

        const clips = [...(audioComp.clips || [])]
        const clipIndex = clips.findIndex(c => c.id === audioComp.currentClip)

        if (clipIndex !== -1) {
          clips[clipIndex] = { ...clips[clipIndex], assetId: asset.id }
          sceneStore.updateComponentProp(entityId, 'Audio', 'clips', clips)
          showPop({ title: 'Success', message: `Applied "${asset.name}" to active audio clip.`, type: 'success' })
        } else {
          showPop({ title: 'Error', message: 'Active clip not found.', type: 'error' })
        }
      } else {
        sceneStore.updateComponentProp(entityId, componentName, 'assetId', asset.id)
        showPop({ title: 'Success', message: `Applied "${asset.name}" to ${componentName}.`, type: 'success' })
      }
    } catch (error) {
      showPop({ title: 'Failed', message: 'Failed to apply asset.', type: 'error' })
    }
  }

  const applyAssetToClip = (asset) => {
    closeMenu()
    const entityId = workspaceStore.activeTab?.id
    if (!entityId || !activeClipId.value) return

    const clips = [...sceneStore._getAnimatorClips(entityId)]
    const clipIndex = clips.findIndex(c => c.id === activeClipId.value)
    
    if (clipIndex !== -1) {
      try {
        clips[clipIndex].assetId = asset.id
        sceneStore._saveAnimatorClips(entityId, clips)
        showPop({ title: 'Success', message: `Applied texture to clip.`, type: 'success' })
      } catch (error) {
        showPop({ title: 'Error', message: 'Failed to update clip asset.', type: 'error' })
      }
    }
  }

  const handleRename = async (targetItem) => {
    closeMenu()
    const isFolder = targetItem.type === 'folder' || targetItem.isFolder
    const newName = await prompt({
      title: isFolder ? 'Rename Folder' : 'Rename Asset',
      message: 'Enter a new name:', 
      defaultValue: targetItem.name,
      confirmText: 'Rename'
    })
    
    if (newName && newName.trim() !== "" && newName !== targetItem.name) {
      if (isFolder) renameFolder(targetItem.id, newName)
      else renameAsset(targetItem.id, newName)
    }
  }

  const handleDelete = async (targetItem) => {
    closeMenu()
    const isFolder = targetItem.type === 'folder' || targetItem.isFolder
    const isConfirmed = await confirm({
      title: isFolder ? 'Delete Folder?' : 'Delete Asset?',
      message: `Are you sure? This action cannot be undone.`,
      type: 'danger'
    })
    if (isConfirmed) {
      const id = targetItem.id
      if (isFolder) deleteFolder(id)
      else deleteAsset(id)
    }
  }

  const handleCutCopy = (action, item) => {
    if (logicActions?.clipboard) {
      logicActions.clipboard.value = {
        action,
        item: { id: item.id, type: item.isFolder || item.type === 'folder' ? 'folder' : 'asset' }
      }
    }
    closeMenu()
  }

  const handleCopyId = async (targetItem) => {
    closeMenu()
    const id = targetItem.id
    if (!id) return
    
    try {
      await navigator.clipboard.writeText(id)
      showPop({ title: 'Success', message: 'Asset ID copied to clipboard.', type: 'success' })
    } catch (err) {
      showPop({ title: 'Error', message: 'Failed to copy Asset ID.', type: 'error' })
    }
  }

  const contextMenuItems = computed(() => {
    const targetItem = menu.value.item
    if (!targetItem) return defaultEmptyMenu()

    const isFolder = targetItem.type === 'folder' || targetItem.isFolder
    const items = [
      { label: targetItem.name, disabled: true, icon: null },
      { separator: true }
    ]

    const entity = getSelectedEntity()
    const currentTabType = workspaceStore.activeTab?.type
    let hasAddedAppliers = false

    if (!isFolder) {
      const isTexture = ['texture'].includes(targetItem.type)
      const isFont = targetItem.type === 'font'
      const isAudio = targetItem.type === 'audio'

      if (['scene', 'ui'].includes(currentTabType) && entity?.components) {
        if (isTexture) {
          if (entity.components.SpriteRenderer) {
            items.push({ label: 'Apply to SpriteRenderer', icon: Stamp, action: () => applyAsset(targetItem, entity.id, 'SpriteRenderer') })
            hasAddedAppliers = true
          }
          if (entity.components.Tilemap) {
            items.push({ label: 'Apply to Tilemap', icon: Stamp, action: () => applyAsset(targetItem, entity.id, 'Tilemap') })
            hasAddedAppliers = true
          }
        }
        if (isFont && entity.components.TextRenderer) {
          items.push({ label: 'Apply to TextRenderer', icon: Type, action: () => applyAsset(targetItem, entity.id, 'TextRenderer') })
          hasAddedAppliers = true
        }

        if (isAudio && entity.components.Audio) {
          const hasActiveClip = !!entity.components.Audio.currentClip
          items.push({ 
            label: hasActiveClip ? 'Apply to Active Audio Clip' : 'No Active Audio Clip', 
            icon: Volume2, 
            disabled: !hasActiveClip,
            action: () => { if (hasActiveClip) applyAsset(targetItem, entity.id, 'Audio') } 
          })
          hasAddedAppliers = true
        }
      }

      if (currentTabType === 'animator' && isTexture && activeClipId.value) {
        items.push({ 
          label: 'Apply to Selected Clip', 
          icon: Stamp, 
          action: () => applyAssetToClip(targetItem) 
        })
        hasAddedAppliers = true
      }
    }

    if (hasAddedAppliers) items.push({ separator: true })

    items.push(
      { label: 'Copy ID', icon: Hash, action: () => handleCopyId(targetItem) }, 
      { separator: true },
      { label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X', action: () => handleCutCopy('cut', targetItem) },
      { label: 'Copy', icon: Copy, shortcut: 'Ctrl+C', action: () => handleCutCopy('copy', targetItem) },
      { separator: true },
      { label: 'Rename', icon: Edit2, shortcut: 'F2', action: () => handleRename(targetItem) },
      { separator: true },
      { label: 'Delete', icon: Trash2, shortcut: 'Del', action: () => handleDelete(targetItem) }
    )

    return items
  })

  const defaultEmptyMenu = () => [
    { 
      label: 'New Folder', 
      icon: FolderPlus, 
      action: () => { 
        closeMenu(); 
        createNewFolder({ parentId: folderStore.activeFolderId }); 
      } 
    },
    { label: 'Import Assets...', icon: Download, action: () => { closeMenu(); triggerUploadCb() } },
    { separator: true },
    { 
      label: 'Paste', 
      icon: ClipboardPaste, 
      shortcut: 'Ctrl+V',
      disabled: !logicActions?.clipboard?.value,
      action: () => { closeMenu(); if (logicActions?.handlePaste) logicActions.handlePaste() } 
    },
    { separator: true },
    { label: 'Refresh', icon: RefreshCw, shortcut: 'F5', action: closeMenu }
  ]

  return { menu, handleContextMenu, closeMenu, contextMenuItems }
}