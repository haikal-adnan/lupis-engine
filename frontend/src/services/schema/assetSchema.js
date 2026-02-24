export const createAsset = (data = {}) => {
  const meta = data.meta || {};

  return {
    _id: data._id,
    projectId: data.projectId || null,
    folderId: data.folderId || null,

    name: data.name || "New Asset",
    type: data.type || "texture",
    
    fileKey: data.fileKey || "",

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