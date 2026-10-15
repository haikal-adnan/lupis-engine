import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAssetStore } from '@assets/assets.js';
import { useFolderStore } from '@folders/folders.js';
import { useAssetActions } from '@assets/assets.js';

import {
  usePopImage,
  usePopAudio
} from '@composables/composables.js';

export function useAssetLogic() {
  const assetStore = useAssetStore();
  const folderStore = useFolderStore();
  const { importAsset } = useAssetActions();
  const { showImage } = usePopImage();
  const { showAudio } = usePopAudio();
  const { isUploading } = storeToRefs(assetStore);

  const viewMode = ref('grid');
  const searchQuery = ref('');
  const selectedId = ref(null);
  const fileInputRef = ref(null);

  const clipboard = ref(null);

  const currentFolderId = computed(() => folderStore.activeFolderId);
  const currentFolder = computed(() => folderStore.getFolderById(currentFolderId.value));

  const folderBreadcrumbs = computed(() => {
    const path = [];
    const visited = new Set();
    let currentId = currentFolderId.value;

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const folder = folderStore.getFolderById(currentId);
      if (folder) {
        path.unshift(folder);
        currentId = folder.parentId || null;
      } else {
        break;
      }
    }
    return path;
  });

  const visibleFolders = computed(() => {
    const targetParentId = currentFolderId.value ?? null;

    let folders = folderStore.folders.filter(f =>
      (f.parentId ?? null) === targetParentId && f.section === 'assets'
    );

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      folders = folders.filter(f => f.name.toLowerCase().includes(q));
    }

    return folders.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
  });

  const visibleAssets = computed(() => {
    const targetFolderId = currentFolderId.value ?? null;

    let assets = assetStore.assets.filter(a => (a.folderId ?? null) === targetFolderId);

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      assets = assets.filter(a => a.name.toLowerCase().includes(q));
    }

    assets.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );

    return assets.map(a => ({
      ...a,
      displayName: a.name,
      originalExt: a.meta ? a.meta.extension : ''
    }));
  });

  const toggleViewMode = () => {
    viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid';
  };

  const navigateTo = (folder) => {
    const targetId = folder ? folder.id : null;
    folderStore.setActiveFolder(targetId);
    selectedId.value = null;
    searchQuery.value = '';
  };

  const handleSelect = (id) => {
    selectedId.value = id;
  };

  const triggerUpload = () => {
    if (fileInputRef.value) {
      fileInputRef.value.click();
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) await importAsset(file);
    e.target.value = '';
  };

  const moveItem = async (id, type, targetFolderId) => {
    if (type === 'asset') {
      await assetStore.moveAsset(id, targetFolderId);
    } else if (type === 'folder') {
      await folderStore.moveFolder(id, targetFolderId);
    }
  };

  const handleDrop = async (e, customTargetFolderId) => {
    const targetFolder = customTargetFolderId ?? currentFolderId.value;
    const internalData = e.dataTransfer.getData('application/json');

    if (internalData) {
      try {
        const { id, type } = JSON.parse(internalData);
        await moveItem(id, type, targetFolder);
        return;
      } catch (err) {
        console.warn('[AssetLogic] Failed to parse drag and drop payload:', err);
      }
    }

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) await importAsset(file);
  };

  const handlePaste = async () => {
    if (!clipboard.value) return;

    const { action, item } = clipboard.value;

    if (action === 'cut') {
      await moveItem(item.id, item.type, currentFolderId.value);
      clipboard.value = null;
    } else if (action === 'copy') {
      if (item.type === 'asset') {
        await assetStore.duplicateAsset(item.id);
      }
    }
  };

  const handleAssetDoubleClick = async (asset) => {
    const assetUrl = await assetStore.getAssetUrlById(asset.id);
    if (asset.type === 'texture') {
      showImage(assetUrl, asset.displayName);
    } else if (['audio', 'sound'].includes(asset.type)) {
      showAudio(assetUrl, asset.displayName);
    }
  };

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
  };
}