import { createComponent, createTransform, createUITransform } from '@schemas/sceneSchema/componentSchema.js';
import { GenerateUUID } from '@/commons/utils/generateUUID.js';

export const createEntity = (data = {}) => {
  const cleanComponents = {};

  // 1. Buat Komponen dari data mentah
  if (data.components) {
    for (const [key, val] of Object.entries(data.components)) {
      cleanComponents[key] = createComponent(key, val);
    }
  }

  // 2. Pastikan Transform/UITransform Ada
  // Cek apakah ini Entity UI (punya UITransform) atau Entity World (butuh Transform)
  if (data.type === 'ui' || cleanComponents.UITransform) {
      // Logic khusus UI jika diperlukan validasi tambahan
      if (!cleanComponents.UITransform) {
          cleanComponents.UITransform = createUITransform({});
      }
  } else {
      // Logic untuk Entity World
      if (!cleanComponents.Transform) {
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

          // Buat Transform baru
          cleanComponents.Transform = createTransform({}, { 
            width: defaultWidth, 
            height: defaultHeight 
          });
      }
  }

  const type = data.type || "entity";

  return {
    _id: data._id || `${GenerateUUID()}`,
    scriptId: data.scriptId || `${type}_${GenerateUUID()}`,
    
    name: data.name || "New Entity",
    type: type,
    tag: data.tag || "untagged",
    
    zIndex: Number(data.zIndex ?? 0), 
    orderIndex: Number(data.orderIndex ?? 0),
    
    parentId: data.parentId || null,
    layerId: data.layerId || "layer_root",
    prefabId: data.prefabId || null,
    
    isActive: data.isActive ?? true,
    isVisible: data.isVisible ?? true,
    isLocked: data.isLocked ?? false,
    
    _editor: { 
        locked: data._editor?.locked ?? false, 
        expanded: data._editor?.expanded ?? false 
    },
    
    components: cleanComponents,
    _isDirty: false 
  };
};