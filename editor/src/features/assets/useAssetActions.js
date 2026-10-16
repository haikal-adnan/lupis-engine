import { useAssetStore } from '@assets/assets.js';
import { useFolderStore } from '@folders/folders.js';
import { assetSchema, useFontConverter } from '@assets/assets.js';
import { usePopAlert } from '@composables/composables.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';

const MAX_FILE_SIZES = {
  font: 20 * 1024 * 1024,      // 20 MB
  texture: 50 * 1024 * 1024,   // 50 MB
  audio: 50 * 1024 * 1024,     // 50 MB
  default: 50 * 1024 * 1024,   // 50 MB
};

export function useAssetActions() {
  const assetStore = useAssetStore();
  const folderStore = useFolderStore();
  const workspaceStore = useWorkspaceStore();
  const { showPop } = usePopAlert();
  const { convertTtfToBmFont } = useFontConverter();

  const importAsset = async (file) => {
    if (!file) return null;
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

      const maxSize = MAX_FILE_SIZES[type] || MAX_FILE_SIZES.default;
      if (file.size > maxSize) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        const limitMb = Math.round(maxSize / (1024 * 1024));
        throw new Error(`File "${file.name}" is too large (${sizeMb}MB). Maximum allowed size is ${limitMb}MB.`);
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
        const isLargeFont = file.size > 1024 * 1024;
        showPop({
          title: 'Converting Font',
          message: isLargeFont
            ? `Converting large font "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)}MB) to BMFont...`
            : `Converting "${file.name}" to BMFont (.fnt + .png)...`,
          type: 'info'
        });

        const converted = await convertTtfToBmFont(file);
        if (!converted || !converted.fntFile) {
          throw new Error(`Font conversion failed for "${file.name}".`);
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

      const isFont = type === 'font';

      const newAsset = assetSchema({
        id: `asset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        projectId,
        folderId: currentFolderId,
        name: finalName,
        type,
        fileKey,
        meta: {
          extension: ext,
          size: file.size,
          dimensions: dimensions,
          duration: duration,
          hasBmFont: isFont,
          ...(isFont && {
            fntFile: `${fileKey}.fnt`,
            pngFiles: extraFiles.filter(e => e.fileName.endsWith('.png')).map(e => e.fileName)
          })
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
      console.error('[AssetAction Error]:', error);
      showPop({
        title: 'Upload Failed',
        message: error.message || `Failed to upload "${file?.name || 'asset'}".`,
        type: 'error'
      });
      throw error;
    } finally {
      assetStore.setUploading(false);
    }
  };

  const deleteAsset = async (assetId) => {
    await assetStore.removeAsset(assetId);
    showPop({
      title: 'Asset Deleted',
      message: 'The asset has been removed.',
      type: 'info'
    });
  };

  const renameAsset = async (assetId, newName) => {
    const cleanName = newName.trim();
    await assetStore.updateAsset(assetId, {
      name: cleanName,
      isSynced: true
    });

    showPop({
      title: 'Success',
      message: 'Asset renamed.',
      type: 'success'
    });
  };

  const updateAssetProperty = async (assetId, updateData) => {
    await assetStore.updateAsset(assetId, updateData);
  };

  const _getImageDimensions = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.width, h: img.height });
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