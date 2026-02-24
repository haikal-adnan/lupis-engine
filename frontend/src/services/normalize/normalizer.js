import { CDN_URL } from "@/services/api/useFetchProjectById.js";

import { createProject } from '@schemas/projectSchema.js';
import { createScene } from '@schemas/sceneSchema.js'; 
import { createAsset } from '@schemas/assetSchema.js';
import { createPrefab } from '@schemas/prefabSchema.js';
import { createFolder } from '@schemas/folderSchema.js';
import { createScript } from '@schemas/scriptSchema.js'; 

export const normalizeProjectLoad = (
  rawProject,
  rawScenes = [],
  rawAssets = [],
  rawPrefabs = [],
  rawFolders = [],
  rawScripts = [] 
) => {
  const projectId = rawProject?._id;

  const cleanProject = createProject(rawProject);

  const cleanScenes = Array.isArray(rawScenes)
    ? rawScenes.map(scene => createScene(scene, projectId))
    : [];

  const cleanAssets = Array.isArray(rawAssets)
    ? rawAssets.map(asset => {
        return createAsset(asset);
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
