export const createAsset = (data = {}) => {
  const meta = data.meta || {};
  const type = data.type || "texture";
  const isTexture = type === "texture";
  const isAudio = type === "audio";

  return {
    _id: data._id,
    projectId: data.projectId || null,
    folderId: data.folderId || null,

    name: data.name || "New Asset",
    type: type,
    
    fileKey: data.fileKey || "",

    // Meta dikonfigurasi berdasarkan tipe aset
    meta: {
      extension: meta.extension || "",
      size: meta.size || 0,
      ...(isTexture && {
        dimensions: {
          w: meta.dimensions?.w || 0,
          h: meta.dimensions?.h || 0
        },
        filterMode: meta.filterMode || 'nearest'
      }),
      ...(isAudio && {
        duration: meta.duration || 0
      }),
      ...meta // Tangkap sisa meta dari DB jika ada
    },

    localBlob: data.localBlob || null,
    isSynced: data.isSynced ?? true
  };
};