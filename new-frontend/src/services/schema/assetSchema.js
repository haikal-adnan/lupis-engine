// services/schema/assetSchema.js

export const createAsset = (data = {}) => {
  // Pastikan meta object ada agar tidak error saat akses nested property
  const meta = data.meta || {};

  return {
    // 1. Identitas & Relasi
    _id: data._id || `asset_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    projectId: data.projectId || null,
    folderId: data.folderId || null, // null = Root, string = Folder ID

    // 2. Data Utama
    name: data.name || "New Asset",
    type: data.type || "texture", // Enum: 'texture', 'sound', 'font', 'script', 'video'

    fileKey: data.fileKey || "",
    fileUrl: data.fileUrl || null, 

    meta: {
      extension: meta.extension || "",
      size: meta.size || 0, 
      dimensions: {
        w: meta.dimensions?.w || 0,
        h: meta.dimensions?.h || 0
      },
      filterMode: meta.filterMode || 'nearest', 
      ...meta 
    },

    localBlob: data.localBlob || null, 
    isSynced: data.isSynced ?? true 
  };
};