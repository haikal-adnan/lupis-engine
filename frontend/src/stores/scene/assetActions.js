import { useAssetStore } from '@/stores/useAssetStore';
import { useFolderStore } from '@/stores/useFolderStore';
import { createAsset } from '@/services/schema/assetSchema.js';
import { createFolder } from '@/services/schema/folderSchema.js';
// 1. Import usePopAlert
import { usePopAlert } from '@/composables/usePopAlert';

export function useAssetActions() {
  const assetStore = useAssetStore();
  const folderStore = useFolderStore();
  
  // 2. Inisialisasi pop alert
  const { showPop } = usePopAlert();

  const createNewFolder = (name, parentId = null) => {
    const actualParentId = parentId !== undefined ? parentId : folderStore.activeFolderId;
    
    // Fallback nama jika kosong agar user tahu folder dibuat
    const folderName = name || 'New Folder';

    const newFolder = createFolder({
      name: folderName,
      parentId: actualParentId,
      projectId: 'project_id_placeholder'
    });

    folderStore.createFolder(newFolder);

    // [ALERT] Success Create
    showPop({
      title: 'Folder Created',
      message: `Folder "${folderName}" has been created.`,
      type: 'success'
    });

    return newFolder;
  };

  const deleteFolder = (folderId) => {
    folderStore.deleteFolder(folderId);
    
    // Hapus juga asset di dalamnya
    const assetsInFolder = assetStore.assets.filter(a => a.folderId === folderId);
    assetsInFolder.forEach(a => assetStore.removeAsset(a._id));

    // [ALERT] Info Delete
    showPop({
      title: 'Folder Deleted',
      message: 'Folder and its contents have been removed.',
      type: 'info' // Menggunakan 'info' karena ini aksi destruktif yang berhasil
    });
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
      // Simulasi upload delay
      await new Promise(resolve => setTimeout(resolve, 800));

      assetStore.updateAsset(newAsset._id, { 
        isSynced: true
      });

      console.log(`[AssetActions] Upload success: ${newAsset.name}`);

      // [ALERT] Success Upload
      showPop({
        title: 'Upload Complete',
        message: `Asset "${newAsset.name}" uploaded successfully.`,
        type: 'success'
      });

    } catch (error) {
      console.error("Upload failed", error);
      assetStore.removeAsset(newAsset._id);

      // [ALERT] Error Upload
      showPop({
        title: 'Upload Failed',
        message: `Failed to upload "${file.name}".`,
        type: 'error'
      });
    }

    return newAsset;
  };

  const deleteAsset = (assetId) => {
    // Kita bisa ambil nama asset dulu untuk pesan alert yang lebih jelas (opsional)
    // const asset = assetStore.assets.find(a => a._id === assetId);
    
    assetStore.removeAsset(assetId);

    // [ALERT] Info Delete Asset
    showPop({
      title: 'Asset Deleted',
      message: 'The asset has been removed permanently.',
      type: 'info'
    });
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