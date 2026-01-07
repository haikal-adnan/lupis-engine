import { CDN_URL } from "@/services/api/project.js";
import { createLayer } from './layerSchema.js';
import { createEntity } from './entitySchema.js';

export const normalizeProjectLoad = (
  rawProject,
  rawScenes,
  rawAssets,
  rawPrefabs
) => {
  const projectId = rawProject._id;

  // 1. Normalize Project
  const cleanProject = {
    _id: projectId,
    name: rawProject?.name || "Untitled Project",
    ownerId: rawProject?.ownerId,
    description: rawProject?.description || "",
    createdAt: rawProject?.createdAt || new Date().toISOString(),
    thumbnailUrl: rawProject?.thumbnailUrl || null,
    settings: {
      width: Number(rawProject?.settings?.width || 1280),
      height: Number(rawProject?.settings?.height || 720)
    },
    scenes: rawProject?.scenes || [] 
  };

  // 2. Normalize Scenes
  const cleanScenes = Array.isArray(rawScenes)
    ? rawScenes.map(scene => ({
        _id: scene._id,
        projectId,
        name: scene.name || "Untitled Scene",
        version: scene.version || 1,
        settings: {
          backgroundColor: scene.settings?.backgroundColor || "#222222",
          gravity: scene.settings?.gravity || { x: 0, y: 9.8 },
          worldBounds: scene.settings?.worldBounds || { x: 0, y: 0, width: 2000, height: 2000 }
        },
        layers: Array.isArray(scene.layers) 
          ? scene.layers.map(l => createLayer(l))
          : [createLayer({ _id: "layer_root", name: "Root" })],
        entities: (scene.entities || []).map(createEntity)
      }))
    : [];

  // 3. Normalize Assets
  const cleanAssets = Array.isArray(rawAssets)
    ? rawAssets.map(asset => {
        let baseUrl = asset.fileUrl || "";
        let isBlob = false;

        if (asset.localBlob) {
          baseUrl = URL.createObjectURL(asset.localBlob);
          isBlob = true;
        } else if (!baseUrl && asset.fileKey) {
          baseUrl = `${CDN_URL}/projects/${projectId}/${asset.fileKey}`;
        }

        const processedMeta = { ...asset.meta };
        const extension = processedMeta.extension || "";
        let finalUrl = baseUrl;

        if (asset.type === "font") {
          if (isBlob) {
            if (extension === ".fnt" && processedMeta.imageBlob) {
              processedMeta.textureUrl = URL.createObjectURL(processedMeta.imageBlob);
            }
          } else {
            finalUrl = `${baseUrl}${extension}`;
            if (extension === ".fnt") {
              processedMeta.textureUrl = `${baseUrl}.png`;
            }
          }
        } else if (asset.type === "texture") {
          if (!isBlob) {
            finalUrl = `${baseUrl}${extension}`;
          }
        }

        return {
          _id: asset._id,
          name: asset.name,
          type: asset.type,
          fileKey: asset.fileKey || "",
          meta: processedMeta,
          fileUrl: finalUrl,
          folderId: asset.folderId || null,
          isSynced: asset.isSynced ?? true,
          localBlob: asset.localBlob || null
        };
      })
    : [];

  // 4. Normalize Prefabs
  const cleanPrefabs = Array.isArray(rawPrefabs)
    ? rawPrefabs.map(p => {
        const entityData = p.data ? createEntity(p.data) : {};
        entityData._id = null; 
        if (entityData.name === "New Entity") entityData.name = p.name;
        entityData.prefabId = p._id; 

        return {
          _id: p._id,
          name: p.name,
          thumbnailUrl: p.thumbnailUrl,
          data: entityData
        };
      })
    : [];

  return {
    project: cleanProject,
    scenes: cleanScenes,
    assets: cleanAssets,
    prefabs: cleanPrefabs
  };
};