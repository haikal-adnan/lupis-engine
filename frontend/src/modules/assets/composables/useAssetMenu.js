import { ref, computed } from 'vue'
import { FolderPlus, Download, RefreshCw, Edit2, Trash2, Stamp } from 'lucide-vue-next'
import { useAssetActions } from '@/stores/scene/assetActions'
import { useSceneStore } from '@/stores/scene/useSceneStore'
import { usePopAlert } from '@/composables/usePopAlert' // <--- Import ini

export function useAssetMenu(selectedIdRef, triggerUploadCb) {
  const { createNewFolder, deleteAsset, deleteFolder } = useAssetActions()
  const sceneStore = useSceneStore()
  const { showPop } = usePopAlert() // <--- Inisialisasi pop alert
  
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

  // --- LOGIKA BARU APPLY TEXTURE ---
  const applyTexture = (asset, entityId, componentName) => {
    closeMenu() // Tutup menu dulu agar responsif

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

    // 1. Cek Info: Apakah asset yang mau di-apply SAMA dengan yang sudah ada?
    const currentAssetId = entity.components[componentName].assetId
    if (currentAssetId === asset._id) {
        showPop({
            title: 'Info',
            message: `Texture "${asset.name}" is already applied.`,
            type: 'info'
        })
        return
    }

    // 2. Coba Update (Sukses / Gagal)
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
            message: `Failed to apply texture "${asset.name}".`,
            type: 'error'
        })
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
        // Cek tipe file gambar (sesuaikan dengan tipe data aset kamu)
        const isTexture = ['asset', 'texture', 'sprite', 'image', 'png', 'jpg'].includes(targetItem.type)
        
        if (isTexture) {
          if (entity.components.SpriteRenderer) {
            items.push({ 
              label: 'Apply to SpriteRenderer', 
              icon: Stamp, 
              // Panggil applyTexture yang baru
              action: () => applyTexture(targetItem, entity._id, 'SpriteRenderer') 
            })
          }
          
          if (entity.components.Tilemap) {
            items.push({ 
              label: 'Apply to Tilemap', 
              icon: Stamp, 
              // Panggil applyTexture yang baru
              action: () => applyTexture(targetItem, entity._id, 'Tilemap') 
            })
          }

          if (items.length > 2) { 
            items.push({ separator: true })
          }
        }
      }

      items.push(
        { label: 'Rename', icon: Edit2, shortcut: 'F2', action: () => {} },
        { separator: true },
        { 
          label: 'Delete', 
          icon: Trash2, 
          shortcut: 'Del',
          action: () => isFolder ? deleteFolder(targetItem.id || targetItem._id) : deleteAsset(targetItem.id || targetItem._id)
        }
      )

      return items
    }

    return [
      { label: 'New Folder', icon: FolderPlus, action: () => createNewFolder('New Folder') },
      { label: 'Import Assets...', icon: Download, action: triggerUploadCb },
      { separator: true },
      { label: 'Refresh', icon: RefreshCw, shortcut: 'F5', action: () => {} }
    ]
  })

  return { menu, handleContextMenu, closeMenu, contextMenuItems }
}