import { useAssetStore } from '@/stores/useAssetStore';
import { useFolderStore } from '@/stores/useFolderStore';
import { createAsset } from '@/services/schema/assetSchema.js';
import { createFolder } from '@/services/schema/folderSchema.js';
import { usePopAlert } from '@/composables/usePopAlert';
import { useAssetBackend } from '@/services/api/backend/useAssetBackend.js';
import { useBackend } from '@/services/api/useBackend.js'; 
import { GenerateUUID } from '@/commons/utils/generateUUID.js';

export function useAssetActions() {
  const assetStore = useAssetStore();
  const folderStore = useFolderStore();
  const { showPop } = usePopAlert();
  const { uploadAssetToServer } = useAssetBackend();
  const { CDN_URL } = useBackend();

  const createNewFolder = (name, parentId = null) => {
    const actualParentId = parentId !== undefined ? parentId : folderStore.activeFolderId;
    const folderName = name || 'New Folder';

    const newFolder = createFolder({
      _id: GenerateUUID(),
      name: folderName,
      parentId: actualParentId,
      projectId: 'project_id_placeholder'
    });

    folderStore.createFolder(newFolder);

    showPop({
      title: 'Folder Created',
      message: `Folder "${folderName}" has been created.`,
      type: 'success'
    });

    return newFolder;
  };

  const deleteFolder = (folderId) => {
    folderStore.deleteFolder(folderId);
    
    const assetsInFolder = assetStore.assets.filter(a => a.folderId === folderId);
    assetsInFolder.forEach(a => assetStore.removeAsset(a._id));

    showPop({
      title: 'Folder Deleted',
      message: 'Folder and its contents have been removed.',
      type: 'info'
    });
  };

  const renameFolder = (folderId, newName) => {
    folderStore.updateFolder(folderId, { name: newName });
  };

  const importAsset = async (file) => {
    if (!file) return;

    assetStore.setUploading(true);

    try {
      // Ganti dengan Project ID yang aktif nanti
      const projectId = 'wtge'; 
      
      const [serverData] = await Promise.all([
        uploadAssetToServer(file, projectId),
        new Promise(resolve => setTimeout(resolve, 1000))
      ]);

      let type = 'unknown';
      if (file.type.startsWith('image/')) type = 'texture';
      else if (file.name.endsWith('.ttf')) type = 'font';

      let dimensions = { w: 0, h: 0 };
      if (type === 'texture') {
        dimensions = await _getImageDimensions(file);
      }

      // Logika Penamaan Tampilan (Display Name) Auto-Increment
      let finalDisplayName = file.name;
      const lastDotIndex = file.name.lastIndexOf('.');
      const originalBaseName = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
      const originalExt = lastDotIndex !== -1 ? file.name.substring(lastDotIndex) : '';

      let counter = 1;
      while (
        assetStore.assets.some(a => 
          a.name === finalDisplayName && 
          a.folderId === folderStore.activeFolderId
        )
      ) {
        finalDisplayName = `${originalBaseName} (${counter})${originalExt}`;
        counter++;
      }

      // Format `fileKey` (tanpa ekstensi) dan `fileUrl` (CDN lengkap)
      // Asumsi backend mengembalikan savedName seperti "image_1a2b3c.png"
      const serverExt = `.${serverData.savedName.split('.').pop()}`;
      const fileKey = serverData.savedName.replace(serverExt, '');
      
      // Sesuaikan struktur direktori CDN
      const fileUrl = `${CDN_URL}/projects/${projectId}/${fileKey}.fnt`;
      const textureUrl = `${CDN_URL}/projects/${projectId}/${fileKey}.png`;

      const newAsset = createAsset({
        _id: GenerateUUID(),
        fileKey: fileKey,
        fileUrl: fileUrl,
        name: finalDisplayName,
        type: type,
        folderId: folderStore.activeFolderId,
        localBlob: file, 
        meta: {
          extension: originalExt,
          size: file.size,
          dimensions,
          textureUrl: textureUrl,
          filterMode: 'nearest',
        },
        isSynced: true
      });

      assetStore.addAsset(newAsset);

      console.log(`[AssetActions] Upload success: ${newAsset.name}`);
      showPop({
        title: 'Upload Complete',
        message: `Asset "${newAsset.name}" uploaded successfully.`,
        type: 'success'
      });

      return newAsset;

    } catch (error) {
      console.error("Upload failed", error);
      showPop({
        title: 'Upload Failed',
        message: error.message || `Failed to upload "${file.name}".`,
        type: 'error'
      });
    } finally {
      assetStore.setUploading(false);
    }
  };

  const deleteAsset = (assetId) => {
    assetStore.removeAsset(assetId);

    showPop({
      title: 'Asset Deleted',
      message: 'The asset has been removed permanently.',
      type: 'info'
    });
  };

  const renameAsset = (assetId, newName) => {
    const extension = `.${newName.split('.').pop()}`;
    assetStore.updateAsset(assetId, { 
      name: newName,
      'meta.extension': extension 
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
    renameFolder,
    importAsset,
    deleteAsset,
    renameAsset
  };
}