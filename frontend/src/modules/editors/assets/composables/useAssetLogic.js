import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAssetStore } from '@/stores/useAssetStore'
import { useFolderStore } from '@/stores/useFolderStore'
import { useAssetActions } from '@/stores/scene/useAssetActions'
import { useAssetBackend } from '@/services/api/backend/useAssetBackend.js';
import { usePopImage } from '@/composables/usePopImage';
import { usePopAudio } from '@/composables/usePopAudio';

export function useAssetLogic() {
  const assetStore = useAssetStore()
  const folderStore = useFolderStore()
  const { importAsset } = useAssetActions()
  const { updateAssetToServer } = useAssetBackend() 
  const { showImage } = usePopImage()
  const { showAudio } = usePopAudio()
  const { isUploading } = storeToRefs(assetStore)

  const viewMode = ref('grid')
  const searchQuery = ref('')
  const selectedId = ref(null)
  const fileInputRef = ref(null)
  
  const clipboard = ref(null) 

  const currentFolderId = computed(() => folderStore.activeFolderId)
  const currentFolder = computed(() => folderStore.getFolderById(currentFolderId.value))

  const folderBreadcrumbs = computed(() => {
    const path = []
    let currentId = currentFolderId.value
    
    while (currentId) {
      const folder = folderStore.getFolderById(currentId)
      if (folder) {
        path.unshift(folder) 
        currentId = folder.parentId
      } else {
        break
      }
    }
    return path
  })

  const visibleFolders = computed(() => {
    let folders = folderStore.folders.filter(f => f.parentId === currentFolderId.value)
    if (searchQuery.value) {
      folders = folders.filter(f => f.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
    }
    return folders
  })

  const visibleAssets = computed(() => {
    let assets = assetStore.assets.filter(a => a.folderId === currentFolderId.value)

    if (searchQuery.value) {
      assets = assets.filter(a => a.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
    }

    return assets.map(a => ({
      ...a,
      displayName: a.name, 
      originalExt: a.meta?.extension || ''
    }))
  })

  const toggleViewMode = () => {
    viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
  }

  const navigateTo = (folder) => {
    folderStore.setActiveFolder(folder ? folder._id : null)
    selectedId.value = null
    searchQuery.value = ''
  }

  const handleSelect = (id) => {
    selectedId.value = id
  }

  const triggerUpload = () => {
    fileInputRef.value?.click()
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) await importAsset(file, currentFolderId.value)
    e.target.value = ''
  }

  const moveItem = async (id, type, targetFolderId) => {
    try {
      if (type === 'asset') {
        await updateAssetToServer(id, { folderId: targetFolderId })
        const assetIndex = assetStore.assets.findIndex(a => a._id === id || a.id === id)
        if (assetIndex !== -1) {
          assetStore.assets[assetIndex].folderId = targetFolderId
        }
      } else if (type === 'folder') {
      }
    } catch (err) {
      console.error('Failed to move item:', err)
    }
  }

  const handleDrop = async (e, customTargetFolderId = null) => {
    const targetFolder = customTargetFolderId !== null ? customTargetFolderId : currentFolderId.value

    try {
      const internalData = e.dataTransfer.getData('application/json')
      if (internalData) {
        const { id, type } = JSON.parse(internalData)
        await moveItem(id, type, targetFolder)
        return
      }
    } catch (err) {
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files)
      for (const file of files) await importAsset(file, targetFolder)
    }
  }

  const handlePaste = async () => {
    if (!clipboard.value) return
    const { action, item } = clipboard.value

    if (action === 'cut') {
      await moveItem(item.id, item.type, currentFolderId.value)
      clipboard.value = null 
    } else if (action === 'copy') {
      try {
        if (item.type === 'asset') {
          const duplicatedAsset = await duplicateAssetOnServer(item.id, currentFolderId.value)
          
          if (duplicatedAsset) {
            assetStore.assets.push(duplicatedAsset)
          }
        } else if (item.type === 'folder') {
        }
      } catch (err) {
        console.error('Failed to copy item:', err)
      }
    }
  }

  const handleAssetDoubleClick = (asset) => {
    if (asset.type === 'texture') {
      const imgUrl = assetStore.getAssetUrlById(asset._id);
      showImage(imgUrl, asset.displayName || asset.name);
    } 
    // TAMBAHKAN KONDISI UNTUK AUDIO DI SINI
    else if (['audio', 'sound'].includes(asset.type)) {
      const audioUrl = assetStore.getAssetUrlById(asset._id);
      showAudio(audioUrl, asset.displayName || asset.name);
    }
  }

  return {
    isUploading,
    viewMode, searchQuery, selectedId, fileInputRef,
    currentFolder, visibleFolders, visibleAssets,
    folderBreadcrumbs,
    clipboard,
    toggleViewMode, navigateTo, handleSelect,
    triggerUpload, handleFileUpload, handleDrop,
    moveItem, handlePaste,
    handleAssetDoubleClick
  }
}