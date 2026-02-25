import { ref, computed } from 'vue'
import { FolderPlus, Download, RefreshCw, Edit2, Trash2, Stamp, Type } from 'lucide-vue-next'
import { useAssetActions } from '@/stores/scene/useAssetActions'
import { useFolderActions } from '@/stores/scene/useFolderActions'
import { useSceneStore } from '@/stores/scene/useSceneStore'
import { usePopAlert } from '@/composables/usePopAlert'
import { usePrompt } from '@/composables/usePrompt'
import { useConfirm } from '@/composables/useConfirm' 
import { useFolderStore } from '@/stores/useFolderStore'

export function useAssetMenu(selectedIdRef, triggerUploadCb) {
  const { importAsset, deleteAsset, renameAsset } = useAssetActions()
  const { createNewFolder, deleteFolder, renameFolder } = useFolderActions()
  const sceneStore = useSceneStore()
  const folderStore = useFolderStore()

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

  const applyAsset = (asset, entityId, componentName) => {
    closeMenu()

    const scene = sceneStore.activeScene
    if (!scene) return

    const entity = scene.entities.find(e => e._id === entityId)
    if (!entity || !entity.components[componentName]) {
        showPop({
            title: 'Error',
            message: 'Target component not found.',
            type: 'error'
        })
        return
    }

    const currentAssetId = entity.components[componentName].assetId
    if (currentAssetId === asset._id) {
        showPop({
            title: 'Info',
            message: `Asset "${asset.name}" is already applied.`,
            type: 'info'
        })
        return
    }

    try {
        sceneStore.updateComponentProp(entityId, componentName, 'assetId', asset._id)
        
        showPop({
            title: 'Success',
            message: `Applied "${asset.name}" to ${componentName}.`,
            type: 'success'
        })
    } catch (error) {
        console.error(error)
        showPop({
            title: 'Failed',
            message: `Failed to apply asset "${asset.name}".`,
            type: 'error'
        })
    }
  }

  const handleRename = async (targetItem) => {
    closeMenu()
    const isFolder = targetItem.type === 'folder'
    
    const newName = await prompt({
      title: isFolder ? 'Rename Folder' : 'Rename Asset',
      message: 'Enter a new name:', 
      defaultValue: targetItem.name,
      placeholder: isFolder ? 'Folder Name...' : 'Asset Name...',
      confirmText: 'Rename'
    })

    if (newName && newName.trim() !== "" && newName !== targetItem.name) {
      if (isFolder) {
        renameFolder(targetItem.id || targetItem._id, newName)
      } else {
        renameAsset(targetItem.id || targetItem._id, newName)
      }
    }
  }

  const handleDelete = async (targetItem) => {
    closeMenu()
    const isFolder = targetItem.type === 'folder'
    const targetName = targetItem.name
    
    const isConfirmed = await confirm({
      title: isFolder ? 'Delete Folder?' : 'Delete Asset?',
      message: `Are you sure you want to delete "${targetName}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete'
    })

    if (isConfirmed) {
      const id = targetItem.id || targetItem._id
      if (isFolder) {
        deleteFolder(id)
      } else {
        deleteAsset(id)
      }
    }
  }

  const contextMenuItems = computed(() => {
    const targetItem = menu.value.item
    
    if (targetItem) {
      const isFolder = targetItem.type === 'folder'
      const items = [
        { label: targetItem.name, disabled: true, icon: null },
        { separator: true }
      ]
      const entity = getSelectedEntity()

      if (!isFolder && entity && entity.components) {
        const isTexture = ['texture'].includes(targetItem.type)
        const isFont = targetItem.type === 'font'
        if (isTexture) {
          if (entity.components.SpriteRenderer) {
            items.push({ 
              label: 'Apply to SpriteRenderer', 
              icon: Stamp, 
              action: () => applyAsset(targetItem, entity._id, 'SpriteRenderer') 
            })
          }
          if (entity.components.Tilemap) {
            items.push({ 
              label: 'Apply to Tilemap', 
              icon: Stamp, 
              action: () => applyAsset(targetItem, entity._id, 'Tilemap') 
            })
          }
        }

        if (isFont) {
          if (entity.components.TextRenderer) {
            items.push({ 
              label: 'Apply to TextRenderer', 
              icon: Type, 
              action: () => applyAsset(targetItem, entity._id, 'TextRenderer') 
            })
          }
        }

        if (items.length > 2) { 
          items.push({ separator: true })
        }
      }

      items.push(
        { 
          label: 'Rename', 
          icon: Edit2, 
          shortcut: 'F2', 
          action: () => handleRename(targetItem) 
        },
        { separator: true },
        { 
          label: 'Delete', 
          icon: Trash2, 
          shortcut: 'Del',
          action: () => handleDelete(targetItem) 
        }
      )

      return items
    }

    return [
      { label: 'New Folder', icon: FolderPlus, action: () => { 
          closeMenu(); 
          createNewFolder('New Folder', folderStore.activeFolderId);
        } 
      },
      { label: 'Import Assets...', icon: Download, action: () => { closeMenu(); triggerUploadCb() } },
      { separator: true },
      { label: 'Refresh', icon: RefreshCw, shortcut: 'F5', action: closeMenu }
    ]
  })

  return { menu, handleContextMenu, closeMenu, contextMenuItems }
}