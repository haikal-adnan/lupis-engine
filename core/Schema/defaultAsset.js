import { sanitizeScriptId } from "../Util/identifier.js";

// Core runtime asset schema factory
export const assetSchema = (data = {}) => {
  const meta = data.meta || {};
  const type = data.type || "texture";
  const isTexture = type === "texture";
  const isAudio = type === "audio";
  const isFont = type === "font";

  const scriptId = sanitizeScriptId(
    data.scriptId || "Asset",
    "Asset"
  );

  const asset = {
    id: data.id,
    projectId: data.projectId || null,
    folderId: data.folderId || null,
    scriptId: scriptId,
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

  return asset;
};

// Creates a default asset instance populated with type-specific fallback metadata
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
    folderId: overrideData.folderId || null,
    scriptId: overrideData.scriptId || `Asset_${type}`,
    type: type,
    fileKey: overrideData.fileKey || "",
    fileUrl: overrideData.fileUrl || "",
    meta: defaultMeta
  };

  return assetSchema(baseData);
};

// Built-in default MSDF font asset definition used across all text rendering fallbacks
export const DEFAULT_SYSTEM_FONT_ASSET = assetSchema({
  id: "system_default",
  scriptId: "system_default_font",
  type: "font",
  fileKey: "system_default",
  fileUrl: "",
  meta: {
    extension: ".fnt",
    size: 0,
    textureUrl: ""
  }
});

// Standard asset template factories for quick asset prototyping
export const DEFAULT_ASSET_TEMPLATES = {
  TEXTURE: () => createDefaultAsset({ type: "texture", scriptId: "default_texture" }),
  AUDIO: () => createDefaultAsset({ type: "audio", scriptId: "default_audio" }),
  FONT: () => createDefaultAsset({ type: "font", scriptId: "default_font" })
};

export default createDefaultAsset;
