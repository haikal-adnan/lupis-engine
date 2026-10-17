import { sanitizeScriptId } from '@utils/utils.js';

export const assetSchema = (data = {}) => {
  const meta = data.meta || {};
  const type = data.type || "texture";
  const isTexture = type === "texture";
  const isAudio = type === "audio";
  const isFont = type === "font";

  const cleanMeta = {
    extension: meta.extension || "",
    size: meta.size || 0,
    hasBmFont: isFont ? (meta.hasBmFont ?? false) : false,
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
  };

  if (!isFont) {
    delete cleanMeta.fntFile;
    delete cleanMeta.pngFiles;
  }

  const scriptId = sanitizeScriptId(
    data.scriptId || "asset",
    "asset"
  );

  const asset = {
    id: data.id,
    projectId: data.projectId || null,
    folderId: data.folderId || null,

    scriptId: scriptId,
    type: type,
    
    fileKey: data.fileKey || "",
    fileUrl: data.fileUrl || "",

    meta: cleanMeta,

    localBlob: data.localBlob || null,
    isSynced: data.isSynced ?? true
  };

  return asset;
};