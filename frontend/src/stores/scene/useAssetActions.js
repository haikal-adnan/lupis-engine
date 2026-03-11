import { useAssetStore } from '@/stores/useAssetStore';
import { useFolderStore } from '@/stores/useFolderStore';
import { createAsset } from '@/services/schema/assetSchema.js';
import { usePopAlert } from '@/composables/usePopAlert';
import { useAssetBackend } from '@/services/api/backend/useAssetBackend.js';
import { useBackend } from '@/services/api/useBackend.js'; 
import { useEditorStore } from '@/stores/useEditorStore';

export function useAssetActions() {
  const assetStore = useAssetStore();
  const editorStore = useEditorStore();
  const folderStore = useFolderStore();
  const { showPop } = usePopAlert();
  
  const { createAssetToServer, updateAssetToServer, deleteAssetFromServer } = useAssetBackend();
  const { CDN_URL } = useBackend();

  const importAsset = async (file) => {
    if (!file) return;

    assetStore.setUploading(true);

  try {
      const projectId = editorStore.activeProjectId;
      const currentFolderId = folderStore.activeFolderId;
      
      const lastDotIndex = file.name.lastIndexOf('.');
      const pureName = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;

      let type = 'unknown';
      if (file.type.startsWith('image/')) type = 'texture';
      else if (file.name.endsWith('.ttf')) type = 'font';
      // Deteksi file audio
      else if (file.type.startsWith('audio/') || ['.wav', '.mp3', '.ogg'].some(ext => file.name.toLowerCase().endsWith(ext))) type = 'audio';

      let dimensions = { w: 0, h: 0 };
      let duration = 0;

      // Ambil meta spesifik berdasarkan tipe
      if (type === 'texture') {
        dimensions = await _getImageDimensions(file);
      } else if (type === 'audio') {
        duration = await _getAudioDuration(file);
      }

      let finalName = pureName;
      let counter = 1;
      while (assetStore.assets.some(a => a.name === finalName && a.folderId === currentFolderId)) {
        finalName = `${pureName} (${counter})`;
        counter++;
      }

      // Pastikan duration dikirim sebagai parameter
      const [serverData] = await Promise.all([
        createAssetToServer(file, projectId, currentFolderId, dimensions, finalName, duration),
        new Promise(resolve => setTimeout(resolve, 1000))
      ]);

      const dbAsset = serverData.asset;

      const newAsset = createAsset({
        _id: dbAsset._id,               
        projectId: dbAsset.projectId,
        folderId: dbAsset.folderId,
        name: dbAsset.name,
        type: dbAsset.type,
        fileKey: dbAsset.fileKey,       
        localBlob: file,                
        meta: dbAsset.meta,
        isSynced: true
      });

      assetStore.addAsset(newAsset);

      showPop({
        title: 'Upload Complete',
        message: `Asset "${newAsset.name}" uploaded successfully.`,
        type: 'success'
      });

      return newAsset;

    } catch (error) {
      showPop({
        title: 'Upload Failed',
        message: error.message || `Failed to upload "${file.name}".`,
        type: 'error'
      });
    } finally {
      assetStore.setUploading(false);
    }
  };

  const deleteAsset = async (assetId) => {
    try {
      assetStore.updateAsset(assetId, { isSynced: false });

      await deleteAssetFromServer(assetId);
      
      assetStore.removeAsset(assetId);

      showPop({
        title: 'Asset Deleted',
        message: 'The asset has been removed permanently.',
        type: 'info'
      });
    } catch (error) {
      assetStore.updateAsset(assetId, { isSynced: true });
      showPop({
        title: 'Delete Failed',
        message: error.message || 'Failed to delete the asset.',
        type: 'error'
      });
    }
  };

  const renameAsset = async (assetId, newName) => {
    try {
      const cleanName = newName.trim();
      if (!cleanName) return;

      assetStore.updateAsset(assetId, { isSynced: false });

      await updateAssetToServer(assetId, { name: cleanName });
      
      assetStore.updateAsset(assetId, { 
        name: cleanName, 
        isSynced: true 
      });

      showPop({ 
        title: 'Success', 
        message: 'Asset renamed.', 
        type: 'success' 
      });
    } catch (error) {
      assetStore.updateAsset(assetId, { isSynced: true });
      showPop({
        title: 'Rename Failed',
        message: error.message || 'Failed to rename the asset.',
        type: 'error'
      });
    }
  };
  
  const updateAssetProperty = async (assetId, updateData) => {
    try {
      await updateAssetToServer(assetId, updateData);
      assetStore.updateAsset(assetId, updateData);
    } catch (error) {
      showPop({ 
        title: 'Update Failed', 
        message: error.message, 
        type: 'error' 
      });
    }
  };

  const _getImageDimensions = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.width, h: img.height });
      img.onerror = () => resolve({ w: 0, h: 0 });
      img.src = URL.createObjectURL(file);
    });
  };

  const _getAudioDuration = (file) => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        resolve(0);
        URL.revokeObjectURL(url);
      };
      audio.src = url;
    });
  };

  return {
    importAsset,
    deleteAsset,
    renameAsset,
    updateAssetProperty
  };
}