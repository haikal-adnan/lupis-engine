import { projectSchema } from '@projects/projects.js'
import { sceneSchema } from '@scenes/scenes.js';
import { assetSchema } from '@assets/assets.js';
import { prefabSchema } from '@prefabs/prefabs.js';
import { folderSchema } from '@folders/folders.js';
import { scriptSchema } from '@scripts/scripts.js'; 

export function normalizer(
  rawProject,
  rawScenes = [],
  rawAssets = [],
  rawPrefabs = [],
  rawFolders = [],
  rawScripts = [] 
) {
  const projectId = rawProject?.id;

  const cleanProject = projectSchema(rawProject);

  const cleanScenes = Array.isArray(rawScenes)
    ? rawScenes.map(scene => sceneSchema(scene, projectId))
    : [];

  const cleanAssets = Array.isArray(rawAssets)
    ? rawAssets.map(asset => {
        return assetSchema(asset);
      })
    : [];

  const cleanPrefabs = Array.isArray(rawPrefabs)
    ? rawPrefabs.map(prefab => prefabSchema(prefab))
    : [];

  const cleanFolders = Array.isArray(rawFolders)
    ? rawFolders.map(folder => folderSchema(folder))
    : [];

  const cleanScripts = Array.isArray(rawScripts)
    ? rawScripts.map(script => scriptSchema(script))
    : [];

  return {
    project: cleanProject,
    scenes: cleanScenes,
    assets: cleanAssets,
    prefabs: cleanPrefabs,
    folders: cleanFolders,
    scripts: cleanScripts
  };
}