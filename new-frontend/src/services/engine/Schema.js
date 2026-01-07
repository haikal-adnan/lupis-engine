import { CDN_URL } from "@/services/api/project.js";

/**
 * Membuat object Layer baru sesuai Mongoose LayerSchema
 * Field: _id, name, locked, visible
 */
export const createLayer = (data = {}) => {
  return {
    _id: data._id || `layer_${Date.now()}`,
    name: data.name || "New Layer",
    visible: data.visible ?? true,
    locked: data.locked ?? false
  };
};

/**
 * Standardisasi komponen Transform
 */
export const createTransform = (data = {}) => {
  const tx = data.translate?.x ?? data.x ?? 0;
  const ty = data.translate?.y ?? data.y ?? 0;
  const sx = data.scale?.x ?? data.scaleX ?? 1;
  const sy = data.scale?.y ?? data.scaleY ?? 1;
  const px = data.pivot?.x ?? data.pivotX ?? 0.5;
  const py = data.pivot?.y ?? data.pivotY ?? 0.5;

  return {
    x: Number(tx),
    y: Number(ty),
    rotation: Number(data.rotation ?? 0),
    scaleX: Number(sx),
    scaleY: Number(sy),
    pivotX: Number(px),
    pivotY: Number(py),
    width: Number(data.width ?? 0),
    height: Number(data.height ?? 0)
  };
};

/**
 * Factory untuk membuat component data
 */
export const createComponent = (type, data = {}) => {
  switch (type) {
    case "SpriteRenderer":
      return {
        assetId: data.assetId || null,
        color: data.color || "#FFFFFF",
        flipX: data.flipX || false,
        flipY: data.flipY || false,
        source: data.source || null, // { x, y, w, h }
        opacity: Number(data.opacity ?? 1),
        ...data
      };

    case "TextRenderer":
      return {
        value: data.value || "New Text",
        fontSize: Number(data.fontSize || 12),
        color: data.color || "#FFFFFF",
        align: data.align || "left",
        assetId: data.assetId || null,
        opacity: Number(data.opacity ?? 1),
        ...data
      };

    case "ShapeRenderer":
      return {
        type: data.type || "rectangle",
        color: data.color || "#FF0000",
        width: Number(data.width || 100),
        height: Number(data.height || 100),
        thickness: Number(data.thickness || 1),
        opacity: Number(data.opacity ?? 1),
        ...data
      };

    case "Transform":
      return createTransform(data);

    default:
      return { ...data };
  }
};

/**
 * Membuat object Entity baru sesuai Mongoose EntitySchema
 */
export const createEntity = (data = {}) => {
  const cleanComponents = {};

  // 1. Process Components
  if (data.components) {
    for (const [key, val] of Object.entries(data.components)) {
      cleanComponents[key] = createComponent(key, val);
    }
  }

  // 2. Ensure Transform exists
  const rawTransform = cleanComponents.Transform || data.transform || {};
  cleanComponents.Transform = createTransform(rawTransform);

  // 3. Construct Object sesuai Schema
  return {
    _id: data._id || `ent_${Date.now()}`,
    name: data.name || "New Entity",
    type: data.type || "entity", // enum: ['entity', 'group']
    tag: data.tag || "untagged",
    
    // Hierarchy References
    parentId: data.parentId || null,
    layerId: data.layerId || "layer_root",
    prefabId: data.prefabId || null,

    // States
    isActive: data.isActive ?? true,
    isVisible: data.isVisible ?? true,

    // Editor State (Sesuai EditorStateSchema)
    _editor: {
      locked: data._editor?.locked ?? false,
      expanded: data._editor?.expanded ?? false, // Untuk Group/Hierarchy
      hiddenInList: data._editor?.hiddenInList ?? false,
      selected: false // Runtime only (tidak disimpan di DB, tapi butuh di frontend)
    },

    components: cleanComponents,
    
    // Runtime flag
    _isDirty: false 
  };
};

/**
 * Helper untuk menormalisasi data dari Backend ke Frontend Store
 */
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
    // Project model hanya menyimpan array of Scene ID strings
    scenes: rawProject?.scenes || [] 
  };

  // 2. Normalize Scenes
  // Menggabungkan data Layers dan Entities menggunakan factory functions di atas
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
        // Mapping Layers (Sesuai LayerSchema: tanpa order)
        layers: Array.isArray(scene.layers) 
          ? scene.layers.map(l => createLayer(l))
          : [createLayer({ _id: "layer_root", name: "Root" })],
        // Mapping Entities
        entities: (scene.entities || []).map(createEntity)
      }))
    : [];

  // 3. Normalize Assets
  const cleanAssets = Array.isArray(rawAssets)
    ? rawAssets.map(asset => {
        let baseUrl = asset.fileUrl || "";
        let isBlob = false;

        // Handle Local Blob (saat upload sebelum sync)
        if (asset.localBlob) {
          baseUrl = URL.createObjectURL(asset.localBlob);
          isBlob = true;
        } else if (!baseUrl && asset.fileKey) {
          // Construct CDN URL
          baseUrl = `${CDN_URL}/projects/${projectId}/${asset.fileKey}`;
        }

        const processedMeta = { ...asset.meta };
        const extension = processedMeta.extension || "";
        let finalUrl = baseUrl;

        // Logic khusus untuk Font & Texture URLs
        if (asset.type === "font") {
          if (isBlob) {
            if (extension === ".fnt" && processedMeta.imageBlob) {
              processedMeta.textureUrl = URL.createObjectURL(processedMeta.imageBlob);
            }
          } else {
            finalUrl = `${baseUrl}${extension}`;
            if (extension === ".fnt") {
              // Asumsi file texture font (.png) memiliki nama sama
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
          type: asset.type, // 'texture', 'sound', 'font', etc.
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
        // PrefabDataSchema mirip dengan EntitySchema
        const entityData = p.data ? createEntity(p.data) : {};
        
        // Bersihkan ID entity instance di dalam prefab data template
        entityData._id = null; 
        
        if (entityData.name === "New Entity") {
            entityData.name = p.name;
        }

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