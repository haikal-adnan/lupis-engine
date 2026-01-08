import { useAssetStore } from '@/stores/useAssetStore';
import { useFolderStore } from '@/stores/useFolderStore';
import { createAsset } from '@/services/schema/assetSchema.js';
import { createFolder } from '@/services/schema/folderSchema.js';

export function useAssetActions() {
  const assetStore = useAssetStore();
  const folderStore = useFolderStore();

  // --- FOLDER ACTIONS ---

  const createNewFolder = (name, parentId = null) => {
    // Gunakan activeFolderId dari store jika parentId tidak spesifik
    const actualParentId = parentId !== undefined ? parentId : folderStore.activeFolderId;
    
    const newFolder = createFolder({
      name: name || 'New Folder',
      parentId: actualParentId,
      projectId: 'project_id_placeholder' // Sebaiknya ambil dari projectStore
    });

    folderStore.createFolder(newFolder);
    return newFolder;
  };

  const deleteFolder = (folderId) => {
    // Hapus folder
    folderStore.deleteFolder(folderId);
    // Hapus juga asset di dalamnya (Opsional, tergantung kebijakan)
    const assetsInFolder = assetStore.assets.filter(a => a.folderId === folderId);
    assetsInFolder.forEach(a => assetStore.removeAsset(a._id));
  };

  // --- ASSET ACTIONS ---

    const importAsset = async (file) => {
        if (!file) return;

        // 1. Setup Type & Dimensions
        let type = 'unknown';
        if (file.type.startsWith('image/')) type = 'texture';
        else if (file.type.startsWith('font/') || file.name.endsWith('.fnt')) type = 'font';

        let dimensions = { w: 0, h: 0 };
        if (type === 'texture') {
        dimensions = await _getImageDimensions(file);
        }

        // 2. Create Schema (State Awal: isSynced = false)
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
        isSynced: false // <--- Ini yang memicu loading overlay
        });

        // 3. Masukkan ke Store (UI akan menampilkan loading)
        assetStore.addAsset(newAsset);

        // ============================================================
        // 4. PROSES UPLOAD (FIX INFINITY LOADING)
        // ============================================================
        try {
        // Simulasi Upload ke Server (Delay 1 detik)
        // Nanti ganti ini dengan: const uploadedData = await uploadApi(newAsset);
        await new Promise(resolve => setTimeout(resolve, 800));

        // Jika sukses, update store:
        // a. Matikan loading (isSynced: true)
        // b. (Opsional) Ganti fileUrl blob dengan URL dari server CDN jika sudah ada
        assetStore.updateAsset(newAsset._id, { 
            isSynced: true,
            // fileUrl: uploadedData.fileUrl // Nanti aktifkan ini jika backend sudah siap
        });

        console.log(`[AssetActions] Upload success: ${newAsset.name}`);

        } catch (error) {
        console.error("Upload failed", error);
        // Opsional: Hapus asset dari store jika gagal, atau beri tanda error
        assetStore.removeAsset(newAsset._id);
        }

        return newAsset;
  };

  const deleteAsset = (assetId) => {
    assetStore.removeAsset(assetId);
  };

  // Helper untuk baca dimensi gambar
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