import { createComponent, createTransform } from './componentSchema.js';

export const createEntity = (data = {}) => {
  const cleanComponents = {};

  // 1. Clean semua components dulu agar datanya siap
  if (data.components) {
    for (const [key, val] of Object.entries(data.components)) {
      cleanComponents[key] = createComponent(key, val);
    }
  }

  // 2. Tentukan Default Width & Height berdasarkan Tipe Component
  let defaultWidth = 100;
  let defaultHeight = 100;

  if (cleanComponents.Tilemap) {
    defaultWidth = cleanComponents.Tilemap.width * cleanComponents.Tilemap.tileWidth;
    defaultHeight = cleanComponents.Tilemap.height * cleanComponents.Tilemap.tileHeight;
    
  } else if (cleanComponents.TextRenderer) {
    defaultWidth = 107;
    defaultHeight = 23;
  } else if (cleanComponents.SpriteRenderer || cleanComponents.ShapeRenderer) {
    defaultWidth = 100;
    defaultHeight = 100;
  }

  // 3. Buat Transform dengan default size
  const rawTransform = cleanComponents.Transform || data.transform || {};
  
  cleanComponents.Transform = createTransform(rawTransform, { 
    width: defaultWidth, 
    height: defaultHeight 
  });

  const timestamp = Date.now();
  const type = data.type || "entity";

  return {
    _id: data._id || `ent_${timestamp}`,
    
    // === UPDATE: Script ID ===
    // Jika data tidak punya scriptId (project lama), generate baru
    scriptId: data.scriptId || `${type}_${timestamp}`,

    name: data.name || "New Entity",
    type: type,
    tag: data.tag || "untagged",
    
    parentId: data.parentId || null,
    layerId: data.layerId || "layer_root",
    prefabId: data.prefabId || null,

    isActive: data.isActive ?? true,
    isVisible: data.isVisible ?? true,

    _editor: {
      locked: data._editor?.locked ?? false,
      expanded: data._editor?.expanded ?? false,
    },

    components: cleanComponents,
    _isDirty: false 
  };
};