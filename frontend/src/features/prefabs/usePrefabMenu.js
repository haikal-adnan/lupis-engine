import { ref, computed } from 'vue'
import { 
  FolderPlus, RefreshCw, Edit2, Trash2, 
  Copy, Scissors, ClipboardPaste, PlusSquare, 
  Layers, Box, Hash 
} from 'lucide-vue-next'
import { usePrefabActions } from '@prefabs/prefabs.js';
import { useFolderStore, useFolderActions } from '@folders/folders.js';
import { useSceneStore } from '@scenes/scenes.js';

import { 
  usePopAlert,
  usePrompt,
  useConfirm
} from '@composables/composables.js';

export function usePrefabMenu(selectedIdRef, activeTabRef, logicActions) {
  const { deletePrefab, duplicatePrefab, renamePrefab, linkPrefabToEntities, instantiatePrefab } = usePrefabActions()
  const { createNewFolder, deleteFolder, renameFolder } = useFolderActions()
  const sceneStore = useSceneStore()
  const folderStore = useFolderStore()

  const { showPop } = usePopAlert()
  const { prompt } = usePrompt()
  const { confirm } = useConfirm()

  const menu = ref({ visible: false, x: 0, y: 0, item: null })

  const handleContextMenu = (e, item) => {
    if (item) selectedIdRef.value = item.id
    menu.value = { visible: true, x: e.clientX, y: e.clientY, item: item }
  }

  const closeMenu = () => {
    menu.value.visible = false
  }

  const contextLayers = computed(() => {
    return sceneStore.activeLayers.filter(layer => layer._section === activeTabRef.value)
  })

  const handleRename = async (targetItem) => {
    closeMenu()
    const isFolder = targetItem.type === 'folder' || targetItem.isFolder
    if (isFolder) {
      const newName = await prompt({
        title: 'Rename Folder',
        message: 'Enter a new name:',
        defaultValue: targetItem.name,
        confirmText: 'Rename'
      })
      if (newName && newName.trim() !== "" && newName !== targetItem.name) {
        renameFolder(targetItem.id, newName)
      }
    } else {
      renamePrefab(targetItem.id)
    }
  }

  const handleDelete = async (targetItem) => {
    closeMenu()
    const isFolder = targetItem.type === 'folder' || targetItem.isFolder
    const id = targetItem.id
    if (isFolder) {
      const isConfirmed = await confirm({
        title: 'Delete Folder?',
        message: `Are you sure? This action will remove the folder and all nested content.`,
        type: 'danger'
      })
      if (isConfirmed) deleteFolder(id)
    } else {
      deletePrefab(id)
    }
  }

  const handleCutCopy = (action, item) => {
    logicActions.clipboard.value = {
      action,
      item: { id: item.id, type: item.isFolder || item.type === 'folder' ? 'folder' : 'prefab' }
    }
    closeMenu()
  }

  const handleCopyId = async (targetItem) => {
    closeMenu()
    const id = targetItem.id
    
    try {
      await navigator.clipboard.writeText(id)
      showPop({ title: 'Success', message: 'Prefab ID copied to clipboard.', type: 'success' })
    } catch (err) {
      showPop({ title: 'Error', message: 'Failed to copy Prefab ID.', type: 'error' })
    }
  }

  const contextMenuItems = computed(() => {
    const targetItem = menu.value.item
    if (!targetItem) return defaultEmptyMenu()

    const isFolder = targetItem.type === 'folder' || targetItem.isFolder
    const id = targetItem.id

    if (isFolder) {
      return [
        { label: targetItem.name, disabled: true, icon: FolderPlus },
        { separator: true },
        { label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X', action: () => handleCutCopy('cut', targetItem) },
        { separator: true },
        { label: 'Rename', icon: Edit2, shortcut: 'F2', action: () => handleRename(targetItem) },
        { separator: true },
        { label: 'Delete', icon: Trash2, shortcut: 'Del', action: () => handleDelete(targetItem) }
      ]
    }

    const items = [
      { label: targetItem.name, disabled: true, icon: Box },
      { separator: true },
      { 
        label: 'Instantiate to...', 
        icon: PlusSquare,
        children: contextLayers.value.map(layer => ({
          label: layer.name,
          icon: Layers, 
          action: () => {
            closeMenu()
            instantiatePrefab(id, { parentId: layer.id, parentName: layer.name })
          }
        }))
      }
    ]

    if (sceneStore.selectedEntityIds.length > 0) {
      items.push({ 
        label: `Link to Selected (${sceneStore.selectedEntityIds.length})`, 
        icon: Layers, 
        action: () => {
          closeMenu()
          linkPrefabToEntities(id, sceneStore.selectedEntityIds)
        }
      })
    }

    items.push(
      { separator: true },
      { label: 'Copy ID', icon: Hash, action: () => handleCopyId(targetItem) },
      { separator: true },
      { label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X', action: () => handleCutCopy('cut', targetItem) },
      { label: 'Copy', icon: Copy, shortcut: 'Ctrl+C', action: () => handleCutCopy('copy', targetItem) },
      { separator: true },
      { label: 'Rename', icon: Edit2, shortcut: 'F2', action: () => handleRename(targetItem) },
      { label: 'Duplicate', icon: Copy, action: () => { closeMenu(); duplicatePrefab(id); } },
      { separator: true },
      { label: 'Delete', icon: Trash2, shortcut: 'Del', action: () => handleDelete(targetItem) }
    )

    return items
  })

  const defaultEmptyMenu = () => {
    const targetSection = `prefabs-${activeTabRef.value}`

    return [
      { 
        label: 'New Folder', 
        icon: FolderPlus, 
        action: () => { 
          closeMenu(); 
          createNewFolder({
            defaultName: 'New Folder',
            parentId: folderStore.activeFolderId,
            section: targetSection
          }) 
        } 
      },
      { 
        label: 'Create Empty Prefab', 
        icon: Box, 
        action: () => { 
          closeMenu(); 
          logicActions.createEmptyPrefab() 
        } 
      },
      { separator: true },
      { 
        label: 'Paste', 
        icon: ClipboardPaste, 
        shortcut: 'Ctrl+V',
        disabled: !logicActions.clipboard.value.action,
        action: () => { closeMenu(); logicActions.handlePaste() } 
      },
      { separator: true },
      { label: 'Refresh', icon: RefreshCw, shortcut: 'F5', action: closeMenu }
    ]
  }

  return { menu, handleContextMenu, closeMenu, contextMenuItems }
}