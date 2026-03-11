import { ref, computed } from 'vue'
import { 
  FolderPlus, Download, RefreshCw, Edit2, Trash2, 
  Stamp, Type, Copy, Scissors, ClipboardPaste,
  Volume2 // --- TAMBAHAN: Import icon untuk Audio ---
} from 'lucide-vue-next'
import { useAssetActions } from '@/stores/scene/useAssetActions'
import { useFolderActions } from '@/stores/scene/useFolderActions'
import { useSceneStore } from '@/stores/scene/useSceneStore'
import { usePopAlert } from '@/composables/usePopAlert'
import { usePrompt } from '@/composables/usePrompt'
import { useConfirm } from '@/composables/useConfirm' 
import { useFolderStore } from '@/stores/useFolderStore'

// --- Tambahan Store & Logic Baru ---
import { useEditorStore } from '@/stores/useEditorStore'
import { useAnimatorLogic } from "@editors/animator/composables/useAnimatorLogic.js"

export function useAssetMenu(selectedIdRef, triggerUploadCb, logicActions) {
  const { importAsset, deleteAsset, renameAsset } = useAssetActions()
  const { createNewFolder, deleteFolder, renameFolder } = useFolderActions()
  const sceneStore = useSceneStore()
  const folderStore = useFolderStore()
  
  // Instance untuk pengecekan tab dan clip
  const editorStore = useEditorStore()
  const { activeClipId, activeClipData } = useAnimatorLogic()

  const { showPop } = usePopAlert() 
  const { prompt } = usePrompt()
  const { confirm } = useConfirm() 
  
  const menu = ref({ visible: false, x: 0, y: 0, item: null })

  const handleContextMenu = (e, item) => {
    if (item) selectedIdRef.value = item.id || item._id
    menu.value = { visible: true, x: e.clientX, y: e.clientY, item: item }
  }

  const closeMenu = () => { menu.value.visible = false }

  const getSelectedEntity = () => {
    if (sceneStore.selectedEntityIds.length === 0) return null
    const scene = sceneStore.activeScene
    if (!scene) return null
    return scene.entities.find(e => e._id === sceneStore.selectedEntityIds[0])
  }

  // Handler untuk Component (Scene Mode)
  const applyAsset = (asset, entityId, componentName) => {
    closeMenu()
    const scene = sceneStore.activeScene
    if (!scene) return

    const entity = scene.entities.find(e => e._id === entityId)
    if (!entity || !entity.components[componentName]) {
      showPop({ title: 'Error', message: 'Target component not found.', type: 'error' })
      return
    }

    try {
      // --- LOGIKA KHUSUS UNTUK AUDIO BANK ---
      if (componentName === 'Audio') {
        const audioComp = entity.components.Audio;
        if (!audioComp.currentClip) {
          showPop({ title: 'Failed', message: 'No active clip selected in Audio Bank.', type: 'warning' })
          return
        }

        const clips = [...(audioComp.clips || [])]
        const clipIndex = clips.findIndex(c => c._id === audioComp.currentClip)

        if (clipIndex !== -1) {
          // Update assetId hanya pada clip yang sedang aktif
          clips[clipIndex] = { ...clips[clipIndex], assetId: asset._id }
          sceneStore.updateComponentProp(entityId, 'Audio', 'clips', clips)
          showPop({ title: 'Success', message: `Applied "${asset.name}" to active audio clip.`, type: 'success' })
        } else {
          showPop({ title: 'Error', message: 'Active clip not found.', type: 'error' })
        }
      } 
      // --- LOGIKA STANDAR (SpriteRenderer, TextRenderer, Tilemap) ---
      else {
        sceneStore.updateComponentProp(entityId, componentName, 'assetId', asset._id)
        showPop({ title: 'Success', message: `Applied "${asset.name}" to ${componentName}.`, type: 'success' })
      }
    } catch (error) {
      showPop({ title: 'Failed', message: 'Failed to apply asset.', type: 'error' })
    }
  }

  // Handler untuk Animator (Animator Mode)
  const applyAssetToClip = (asset) => {
    closeMenu()
    const entityId = editorStore.activeTab?.id // Tab ID di Animator biasanya adalah Entity ID
    if (!entityId || !activeClipId.value) return

    const clips = [...sceneStore._getAnimatorClips(entityId)]
    const clipIndex = clips.findIndex(c => c.id === activeClipId.value)
    
    if (clipIndex !== -1) {
      try {
        clips[clipIndex].assetId = asset._id
        sceneStore._saveAnimatorClips(entityId, clips)
        showPop({ title: 'Success', message: `Applied texture to clip.`, type: 'success' })
      } catch (error) {
        showPop({ title: 'Error', message: 'Failed to update clip asset.', type: 'error' })
      }
    }
  }

  const handleRename = async (targetItem) => {
    closeMenu()
    const isFolder = targetItem.type === 'folder'
    const newName = await prompt({
      title: isFolder ? 'Rename Folder' : 'Rename Asset',
      message: 'Enter a new name:', 
      defaultValue: targetItem.name,
      confirmText: 'Rename'
    })
    if (newName && newName.trim() !== "" && newName !== targetItem.name) {
      if (isFolder) renameFolder(targetItem.id || targetItem._id, newName)
      else renameAsset(targetItem.id || targetItem._id, newName)
    }
  }

  const handleDelete = async (targetItem) => {
    closeMenu()
    const isFolder = targetItem.type === 'folder'
    const isConfirmed = await confirm({
      title: isFolder ? 'Delete Folder?' : 'Delete Asset?',
      message: `Are you sure? This action cannot be undone.`,
      type: 'danger'
    })
    if (isConfirmed) {
      const id = targetItem.id || targetItem._id
      if (isFolder) deleteFolder(id)
      else deleteAsset(id)
    }
  }

  const handleCutCopy = (action, item) => {
    if (logicActions?.clipboard) {
      logicActions.clipboard.value = {
        action,
        item: { id: item.id || item._id, type: item.type === 'folder' ? 'folder' : 'asset' }
      }
    }
    closeMenu()
  }

  const contextMenuItems = computed(() => {
    const targetItem = menu.value.item
    if (!targetItem) return defaultEmptyMenu()

    const isFolder = targetItem.type === 'folder'
    const items = [
      { label: targetItem.name, disabled: true, icon: null },
      { separator: true }
    ]

    const entity = getSelectedEntity()
    const currentTabType = editorStore.activeTab?.type

    if (!isFolder) {
      const isTexture = ['texture'].includes(targetItem.type)
      const isFont = targetItem.type === 'font'
      const isAudio = targetItem.type === 'audio' // --- TAMBAHAN: Cek jika asset adalah audio ---
      let hasAddedAppliers = false

      // --- LOGIKA TAB SCENE ---
      if (currentTabType === 'scene' && entity?.components) {
        if (isTexture) {
          if (entity.components.SpriteRenderer) {
            items.push({ label: 'Apply to SpriteRenderer', icon: Stamp, action: () => applyAsset(targetItem, entity._id, 'SpriteRenderer') })
            hasAddedAppliers = true
          }
          if (entity.components.Tilemap) {
            items.push({ label: 'Apply to Tilemap', icon: Stamp, action: () => applyAsset(targetItem, entity._id, 'Tilemap') })
            hasAddedAppliers = true
          }
        }
        if (isFont && entity.components.TextRenderer) {
          items.push({ label: 'Apply to TextRenderer', icon: Type, action: () => applyAsset(targetItem, entity._id, 'TextRenderer') })
          hasAddedAppliers = true
        }

        // --- TAMBAHAN: Logika untuk apply Audio Component ---
        if (isAudio && entity.components.Audio) {
          const hasActiveClip = !!entity.components.Audio.currentClip;
          items.push({ 
            // Mengubah label dan mendisable tombol jika tidak ada clip yang aktif
            label: hasActiveClip ? 'Apply to Active Audio Clip' : 'No Active Audio Clip', 
            icon: Volume2, 
            disabled: !hasActiveClip,
            action: () => { if (hasActiveClip) applyAsset(targetItem, entity._id, 'Audio') } 
          })
          hasAddedAppliers = true
        }
      }

      // --- LOGIKA TAB ANIMATOR ---
      if (currentTabType === 'animator' && isTexture && activeClipId.value) {
        items.push({ 
          label: 'Apply to Selected Clip', 
          icon: Stamp, 
          action: () => applyAssetToClip(targetItem) 
        })
        hasAddedAppliers = true
      }

      if (hasAddedAppliers) items.push({ separator: true })
    }

    // Common Actions
    items.push(
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
    { label: 'New Folder', icon: FolderPlus, action: () => { closeMenu(); createNewFolder('New Folder', folderStore.activeFolderId); } },
    { label: 'Import Assets...', icon: Download, action: () => { closeMenu(); triggerUploadCb() } },
    { separator: true },
    { 
      label: 'Paste', 
      icon: ClipboardPaste, 
      shortcut: 'Ctrl+V',
      disabled: !logicActions?.clipboard?.value,
      action: () => { closeMenu(); if (logicActions?.handlePaste) logicActions.handlePaste(); } 
    },
    { separator: true },
    { label: 'Refresh', icon: RefreshCw, shortcut: 'F5', action: closeMenu }
  ]

  return { menu, handleContextMenu, closeMenu, contextMenuItems }
}