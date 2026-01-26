import { useAssetStore } from '@/stores/useAssetStore';
import { useFolderStore } from '@/stores/useFolderStore';
import { createAsset } from '@/services/schema/assetSchema.js';
import { createFolder } from '@/services/schema/folderSchema.js';

export function useAssetActions() {
  const assetStore = useAssetStore();
  const folderStore = useFolderStore();

  const createNewFolder = (name, parentId = null) => {
    const actualParentId = parentId !== undefined ? parentId : folderStore.activeFolderId;
    
    const newFolder = createFolder({
      name: name || 'New Folder',
      parentId: actualParentId,
      projectId: 'project_id_placeholder'
    });

    folderStore.createFolder(newFolder);
    return newFolder;
  };

  const deleteFolder = (folderId) => {
    folderStore.deleteFolder(folderId);
    const assetsInFolder = assetStore.assets.filter(a => a.folderId === folderId);
    assetsInFolder.forEach(a => assetStore.removeAsset(a._id));
  };

  const importAsset = async (file) => {
    if (!file) return;

    let type = 'unknown';
    if (file.type.startsWith('image/')) type = 'texture';
    else if (file.type.startsWith('font/') || file.name.endsWith('.fnt')) type = 'font';

    let dimensions = { w: 0, h: 0 };
    if (type === 'texture') {
      dimensions = await _getImageDimensions(file);
    }

    const newAsset = createAsset({
      name: file.name,
      type: type,
      folderId: folderStore.activeFolderId,
      localBlob: file,
      fileUrl: URL.createObjectURL(file),
      meta: {
        extension: `.${file.name.split('.').pop()}`,
        size: file.size,
        dimensions
      },
      isSynced: false
    });

    assetStore.addAsset(newAsset);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      assetStore.updateAsset(newAsset._id, { 
        isSynced: true
      });

      console.log(`[AssetActions] Upload success: ${newAsset.name}`);
    } catch (error) {
      console.error("Upload failed", error);
      assetStore.removeAsset(newAsset._id);
    }

    return newAsset;
  };

  const deleteAsset = (assetId) => {
    assetStore.removeAsset(assetId);
  };

  const _getImageDimensions = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.width, h: img.height });
      img.onerror = () => resolve({ w: 0, h: 0 });
      img.src = URL.createObjectURL(file);
    });
  };

  return {
    createNewFolder,
    deleteFolder,
    importAsset,
    deleteAsset
  };
}
