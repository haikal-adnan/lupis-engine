// src/services/schema/schema.js

import { CDN_URL } from "@/services/api/project.js";

// Import semua schema creator
import { createProject } from '@schemas/projectSchema.js';
import { createScene } from '@schemas/sceneSchema.js'; 
import { createAsset } from '@schemas/assetSchema.js';
import { createPrefab } from '@schemas/prefabSchema.js';
import { createFolder } from '@schemas/folderSchema.js';
import { createScript } from '@schemas/scriptSchema.js'; // <--- 1. Import ini

export const normalizeProjectLoad = (
  rawProject,
  rawScenes = [],
  rawAssets = [],
  rawPrefabs = [],
  rawFolders = [],
  rawScripts = [] // <--- 2. Tambahkan parameter rawScripts
) => {
  const projectId = rawProject?._id;

  const cleanProject = createProject(rawProject);

  const cleanScenes = Array.isArray(rawScenes)
    ? rawScenes.map(scene => createScene(scene, projectId))
    : [];

  const cleanAssets = Array.isArray(rawAssets)
    ? rawAssets.map(asset => {
        const preparedData = prepareAssetData(asset, projectId);
        return createAsset(preparedData);
      })
    : [];

  const cleanPrefabs = Array.isArray(rawPrefabs)
    ? rawPrefabs.map(prefab => createPrefab(prefab))
    : [];

  const cleanFolders = Array.isArray(rawFolders)
    ? rawFolders.map(folder => createFolder(folder))
    : [];

  const cleanScripts = Array.isArray(rawScripts)
    ? rawScripts.map(script => createScript(script))
    : [];

  return {
    project: cleanProject,
    scenes: cleanScenes,
    assets: cleanAssets,
    prefabs: cleanPrefabs,
    folders: cleanFolders,
    scripts: cleanScripts
  };
};

const prepareAssetData = (asset, projectId) => {
  let baseUrl = asset.fileUrl || "";
  let isBlob = false;

  if (asset.localBlob) {
    baseUrl = URL.createObjectURL(asset.localBlob);
    isBlob = true;
  } else if (!baseUrl && asset.fileKey) {
    baseUrl = `${CDN_URL}/projects/${projectId}/${asset.fileKey}`;
  }

  const meta = { ...asset.meta };
  const extension = meta.extension || "";
  let finalUrl = baseUrl;

  if (asset.type === "font") {
    if (isBlob) {
      if (extension === ".fnt" && meta.imageBlob) {
        meta.textureUrl = URL.createObjectURL(meta.imageBlob);
      }
    } else {
      finalUrl = `${baseUrl}${extension}`; 
      if (extension === ".fnt") {
        meta.textureUrl = `${baseUrl}.png`; 
      }
    }
  } else if (asset.type === "texture" && !isBlob) {
    finalUrl = `${baseUrl}${extension}`;
  }

  return {
    ...asset,
    fileUrl: finalUrl,
    meta: meta
  };
};