import { ref, computed } from 'vue'
import { useAssetStore } from '@/stores/useAssetStore'
import { useFolderStore } from '@/stores/useFolderStore'
import { useAssetActions } from '@/stores/scene/assetActions'

export function useAssetLogic() {
  const assetStore = useAssetStore()
  const folderStore = useFolderStore()
  const { importAsset } = useAssetActions()

  const viewMode = ref('grid')
  const searchQuery = ref('')
  const selectedId = ref(null)
  const fileInputRef = ref(null)

  const currentFolderId = computed(() => folderStore.activeFolderId)
  const currentFolder = computed(() => folderStore.getFolderById(currentFolderId.value))

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
    return assets
  })

  // --- Actions ---
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
    for (const file of files) await importAsset(file)
    e.target.value = ''
  }

  const handleDrop = async (e) => {
    const files = Array.from(e.dataTransfer.files)
    for (const file of files) await importAsset(file)
  }

  // NOTE: Logic Double Click dihapus total dari sini

  return {
    viewMode, searchQuery, selectedId, fileInputRef,
    currentFolder, visibleFolders, visibleAssets,
    toggleViewMode, navigateTo, handleSelect,
    triggerUpload, handleFileUpload, handleDrop
  }
}