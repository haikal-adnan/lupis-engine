import { ref, computed } from 'vue'
import { 
  FolderPlus, Download, RefreshCw, Edit2, Trash2, 
  Stamp // Icon Stamp untuk Apply Texture
} from 'lucide-vue-next'
import { useAssetActions } from '@/stores/scene/assetActions'
import { useSceneStore } from '@/stores/scene/useSceneStore'

export function useAssetMenu(selectedIdRef, triggerUploadCb) {
  const { createNewFolder, deleteAsset, deleteFolder } = useAssetActions()
  const sceneStore = useSceneStore()
  
  const menu = ref({ visible: false, x: 0, y: 0, item: null })

  const handleContextMenu = (e, item) => {
    if (item) selectedIdRef.value = item.id || item._id
    menu.value = { visible: true, x: e.clientX, y: e.clientY, item: item }
  }

  const closeMenu = () => { menu.value.visible = false }

  // --- Helper: Get Selected Entity ---
  const getSelectedEntity = () => {
    if (sceneStore.selectedEntityIds.length === 0) return null
    const scene = sceneStore.activeScene
    if (!scene) return null
    return scene.entities.find(e => e._id === sceneStore.selectedEntityIds[0])
  }

  // --- Action Handlers ---
  const applyTexture = (asset, entityId, componentName) => {
    sceneStore.updateComponentProp(entityId, componentName, 'assetId', asset._id)
    closeMenu()
  }

  // --- Menu Computed ---
  const contextMenuItems = computed(() => {
    const targetItem = menu.value.item
    
    // 1. Context Menu untuk Item (Asset/Folder)
    if (targetItem) {
      const isFolder = targetItem.type === 'folder'
      const items = [
        { label: targetItem.name, disabled: true, icon: null },
        { separator: true }
      ]

      // --- LOGIC APPLY TEXTURE ONLY ---
      const entity = getSelectedEntity()

      // Hanya jalan jika bukan folder, ada entity terpilih, dan entity punya komponen
      if (!isFolder && entity && entity.components) {
        
        // Cek apakah item yang diklik adalah Texture/Image
        const isTexture = ['texture', 'sprite', 'image', 'png', 'jpg'].includes(targetItem.type)
        
        if (isTexture) {
          // Opsi 1: Apply ke SpriteRenderer
          if (entity.components.SpriteRenderer) {
            items.push({ 
              label: 'Apply to SpriteRenderer', 
              icon: Stamp, 
              action: () => applyTexture(targetItem, entity._id, 'SpriteRenderer') 
            })
          }
          
          // Opsi 2: Apply ke Tilemap
          if (entity.components.Tilemap) {
             items.push({ 
              label: 'Apply to Tilemap', 
              icon: Stamp, 
              action: () => applyTexture(targetItem, entity._id, 'Tilemap') 
            })
          }

          // Tambahkan separator jika ada menu Apply yang muncul
          if (items.length > 2) { 
             items.push({ separator: true })
          }
        }
      }
      // -------------------------------

      // Menu Standard (Rename & Delete)
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

    // 2. Context Menu untuk Area Kosong (Panel)
    return [
      { label: 'New Folder', icon: FolderPlus, action: () => createNewFolder('New Folder') },
      { label: 'Import Assets...', icon: Download, action: triggerUploadCb },
      { separator: true },
      { label: 'Refresh', icon: RefreshCw, shortcut: 'F5', action: () => {} }
    ]
  })

  return { menu, handleContextMenu, closeMenu, contextMenuItems }
}