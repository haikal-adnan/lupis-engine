import { CDN_URL } from "@/services/api/project.js";

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

export const createEntity = (data = {}) => {
  const cleanComponents = {};

  if (data.components) {
    for (const [key, val] of Object.entries(data.components)) {
      cleanComponents[key] = createComponent(key, val);
    }
  }

  const rawTransform = cleanComponents.Transform || data.transform || {};
  cleanComponents.Transform = createTransform(rawTransform);

  return {
    _id: data._id,
    name: data.name || "New Entity",
    type: data.type || "entity",
    tag: data.tag || "untagged",
    parentId: data.parentId || null,
    layerId: data.layerId || "layer_root",
    prefabId: data.prefabId || null,

    isActive: data.isActive ?? true,
    isVisible: data.isVisible ?? true,

    locked: data.locked ?? false,
    _editor: {
      expanded: data._editor?.expanded ?? false,
      selected: false,
      locked: data._editor?.locked ?? false,
      hiddenInList: data._editor?.hiddenInList ?? false
    },

    components: cleanComponents,
    _isDirty: false
  };
};

export const createComponent = (type, data = {}) => {
  switch (type) {
    case "SpriteRenderer":
      return {
        assetId: data.assetId || null,
        color: data.color || "#FFFFFF",
        flipX: data.flipX || false,
        flipY: data.flipY || false,
        pixelPerfect: data.pixelPerfect ?? true,
        source: data.source || null,
        opacity: Number(data.opacity ?? 1),
        ...data
      };

    case "TextRenderer":
      return {
        text: data.value || data.text || "New Text",
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

export const normalizeProjectLoad = (
  rawProject,
  rawScenes,
  rawAssets,
  rawPrefabs
) => {
  const projectId = rawProject._id;

  const cleanProject = {
    _id: projectId,
    name: rawProject?.name || "Untitled Project",
    ownerId: rawProject?.ownerId,
    createdAt: rawProject?.created_at || rawProject?.createdAt,
    settings: {
      width: Number(rawProject?.settings?.width || 1280),
      height: Number(rawProject?.settings?.height || 720),
      backgroundColor:
        rawProject?.settings?.backgroundColor || "#222222",
      pixelArt: rawProject?.settings?.pixelArt ?? true
    },
    layers:
      rawProject?.layers || [{ _id: "layer_root", name: "Root", order: 0 }]
  };

  const cleanScenes = Array.isArray(rawScenes)
    ? rawScenes.map(scene => ({
        _id: scene._id,
        projectId,
        name: scene.name || "Untitled Scene",
        settings: scene.settings || {},
        entities: (scene.entities || []).map(createEntity)
      }))
    : [];

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
              processedMeta.textureUrl =
                URL.createObjectURL(processedMeta.imageBlob);
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

  const cleanPrefabs = Array.isArray(rawPrefabs)
    ? rawPrefabs.map(p => {
        // 1. Normalisasi data menggunakan createEntity
        const entityData = p.data ? createEntity(p.data) : {};

        // 2. KONSISTENSI ID: Set ke NULL, jangan dihapus.
        // Ini menandakan bahwa ini adalah "Cetakan" (Template), belum punya identitas.
        entityData._id = null; 

        // 3. FIX NAMA: Ambil nama dari Root Prefab jika nama entity default
        if (entityData.name === "New Entity") {
            entityData.name = p.name;
        }

        // 4. PREFAB ID: Pastikan template tahu siapa 'induk'-nya
        // Ini penting agar nanti saat di-save, engine tahu entity ini berasal dari prefab mana.
        entityData.prefabId = p._id; 

        return {
          _id: p._id, // ROOT ID: Ini yang dipakai World sebagai Key
          name: p.name,
          data: entityData // Data Template (_id: null)
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
