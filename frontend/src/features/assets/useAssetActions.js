import { useAssetStore } from '@assets/assets.js';
import { useFolderStore } from '@folders/folders.js';
import { assetSchema, useFontConverter } from '@assets/assets.js';
import { usePopAlert } from '@composables/composables.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';

export function useAssetActions() {
  const assetStore = useAssetStore();
  const folderStore = useFolderStore();
  const workspaceStore = useWorkspaceStore();
  const { showPop } = usePopAlert();
  const { convertTtfToBmFont } = useFontConverter();

  const importAsset = async (file) => {
    if (!file) return;

    assetStore.setUploading(true);

    try {
      const projectId = workspaceStore.activeProjectId;
      const currentFolderId = folderStore.activeFolderId;

      const lastDotIndex = file.name.lastIndexOf('.');
      const pureName = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
      const ext = lastDotIndex !== -1 ? file.name.substring(lastDotIndex).toLowerCase() : '';

      let type = 'texture';
      let label = 'image_';

      if (file.type.startsWith('image/')) {
        type = 'texture';
        label = 'image_';
      } else if (ext === '.ttf' || ext === '.otf') {
        type = 'font';
        label = 'font_';
      } else if (file.type.startsWith('audio/') || ['.wav', '.mp3', '.ogg'].includes(ext)) {
        type = 'audio';
        label = 'audio_';
      }

      let dimensions = { w: 0, h: 0 };
      let duration = 0;

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

      const randomHex = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      const fileKey = `${label}${randomHex}`;

      let extraFiles = [];
      if (type === 'font') {
        showPop({
          title: 'Converting Font',
          message: `Mengonversi "${file.name}" ke BMFont (.fnt + .png)...`,
          type: 'info'
        });

        const converted = await convertTtfToBmFont(file);
        if (!converted) {
          throw new Error('Proses konversi font dibatalkan atau gagal.');
        }

        extraFiles.push({
          file: converted.fntFile,
          fileName: `${fileKey}.fnt`
        });

        converted.pngFiles.forEach((pngFile, index) => {
          const pngName = converted.pngFiles.length === 1 
            ? `${fileKey}.png` 
            : `${fileKey}_${index}.png`;

          extraFiles.push({
            file: pngFile,
            fileName: pngName
          });
        });
      }

      const newAsset = assetSchema({
        id: `asset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        projectId,
        folderId: currentFolderId || null,
        name: finalName,
        type,
        fileKey,
        meta: {
          extension: ext,
          size: file.size,
          dimensions: dimensions.w ? dimensions : undefined,
          duration: duration || undefined,
          hasBmFont: type === 'font',
          fntFile: type === 'font' ? `${fileKey}.fnt` : undefined,
          pngFiles: type === 'font' ? extraFiles.filter(e => e.fileName.endsWith('.png')).map(e => e.fileName) : []
        },
        isSynced: true
      });

      await assetStore.addAsset(newAsset, file, extraFiles);

      showPop({
        title: 'Upload Ready',
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
      await assetStore.removeAsset(assetId);

      showPop({
        title: 'Asset Deleted',
        message: 'The asset has been removed.',
        type: 'info'
      });
    } catch (error) {
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

      await assetStore.updateAsset(assetId, { 
        name: cleanName, 
        isSynced: true 
      });

      showPop({ 
        title: 'Success', 
        message: 'Asset renamed.', 
        type: 'success' 
      });
    } catch (error) {
      showPop({
        title: 'Rename Failed',
        message: error.message || 'Failed to rename the asset.',
        type: 'error'
      });
    }
  };

  const updateAssetProperty = async (assetId, updateData) => {
    try {
      await assetStore.updateAsset(assetId, updateData);
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