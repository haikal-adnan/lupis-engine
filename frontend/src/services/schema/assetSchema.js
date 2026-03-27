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

    meta: {
      extension: meta.extension || "",
      size: meta.size || 0,
      ...(isTexture && {
        dimensions: {
          w: meta.dimensions?.w || 0,
          h: meta.dimensions?.h || 0
        }
      }),
      ...(isAudio && {
        duration: meta.duration || 0
      }),
      ...meta 
    },

    localBlob: data.localBlob || null,
    isSynced: data.isSynced ?? true
  };
};