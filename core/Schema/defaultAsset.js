export const assetSchema = (data = {}) => {
  const meta = data.meta || {};
  const type = data.type || "texture";
  const isTexture = type === "texture";
  const isAudio = type === "audio";
  const isFont = type === "font";

  return {
    id: data.id,
    projectId: data.projectId || null,
    name: data.name || "Asset",
    type: type,
    fileKey: data.fileKey || "",
    fileUrl: data.fileUrl || "",
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
      ...(isFont && {
        textureUrl: meta.textureUrl || ""
      }),
      ...meta
    }
  };
};

export const createDefaultAsset = (overrideData = {}) => {
  const type = overrideData.type || "texture";
  const meta = overrideData.meta || {};

  let defaultMeta = {
    extension: meta.extension || "",
    size: meta.size || 0,
    ...meta
  };

  if (type === "texture") {
    defaultMeta.dimensions = {
      w: meta.dimensions?.w || 0,
      h: meta.dimensions?.h || 0
    };
  } else if (type === "audio") {
    defaultMeta.duration = meta.duration || 0;
  } else if (type === "font") {
    defaultMeta.textureUrl = meta.textureUrl || "";
  }

  const baseData = {
    id: overrideData.id || `asset_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    projectId: overrideData.projectId || null,
    name: overrideData.name || `Asset_${type}`,
    type: type,
    fileKey: overrideData.fileKey || "",
    fileUrl: overrideData.fileUrl || "",
    meta: defaultMeta
  };

  return assetSchema(baseData);
};

export const DEFAULT_SYSTEM_FONT_ASSET = assetSchema({
  id: "system_default",
  name: "System Default Font",
  type: "font",
  fileKey: "system_default",
  fileUrl: "",
  meta: {
    extension: ".fnt",
    size: 0,
    textureUrl: ""
  }
});

export const DEFAULT_ASSET_TEMPLATES = {
  TEXTURE: () => createDefaultAsset({ type: "texture", name: "Default Texture" }),
  AUDIO: () => createDefaultAsset({ type: "audio", name: "Default Audio" }),
  FONT: () => createDefaultAsset({ type: "font", name: "Default Font" })
};

export default createDefaultAsset;