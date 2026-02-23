import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAssetStore } from '@/stores/useAssetStore'
import { useFolderStore } from '@/stores/useFolderStore'
import { useAssetActions } from '@/stores/scene/useAssetActions'

export function useAssetLogic() {
  const assetStore = useAssetStore()
  const folderStore = useFolderStore()
  const { importAsset } = useAssetActions()

  const { isUploading } = storeToRefs(assetStore)

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

    let formattedAssets = assets.map(a => {
      let ext = a.meta?.extension || ''
      if (!ext && a.name.includes('.')) {
        ext = `.${a.name.split('.').pop()}`
      }

      let displayName = a.name.endsWith(ext) ? a.name : `${a.name}${ext}`
      let baseName = displayName.replace(ext, '')

      if (a.type === 'font') {
        ext = '.ttf'
        displayName = `${baseName}.ttf`
      }

      return {
        ...a,
        displayName,
        baseName,
        originalExt: a.meta?.extension || ext,
        ext
      }
    })

    const fontBaseNames = formattedAssets
      .filter(a => a.type === 'font')
      .map(a => a.baseName)

    formattedAssets = formattedAssets.filter(a => {
      if (a.type === 'texture' && a.originalExt === '.png' && fontBaseNames.includes(a.baseName)) {
        return false
      }

      if (a.originalExt === '.fnt' && a.type !== 'font') {
        return false
      }

      return true
    })

    const uniqueAssets = []
    const seenFonts = new Set()

    for (const asset of formattedAssets) {
      if (asset.type === 'font') {
        if (seenFonts.has(asset.baseName)) continue
        seenFonts.add(asset.baseName)
      }
      uniqueAssets.push(asset)
    }

    return uniqueAssets
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
    for (const file of files) await importAsset(file)
    e.target.value = ''
  }

  const handleDrop = async (e) => {
    const files = Array.from(e.dataTransfer.files)
    for (const file of files) await importAsset(file)
  }

  return {
    isUploading,
    viewMode, searchQuery, selectedId, fileInputRef,
    currentFolder, visibleFolders, visibleAssets,
    toggleViewMode, navigateTo, handleSelect,
    triggerUpload, handleFileUpload, handleDrop
  }
}