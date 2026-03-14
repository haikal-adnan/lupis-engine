import { createComponent } from '@/services/schema/sceneSchema/componentSchema.js'; 
import { GenerateUUID } from '@/commons/utils/generateUUID.js'; 

export const createEntity = (data = {}) => {
  const cleanComponents = {};

  const initialX = data.x !== undefined ? Number(data.x) : 0;
  const initialY = data.y !== undefined ? Number(data.y) : 0;

  if (data.components) {
    for (const [key, val] of Object.entries(data.components)) {
      let componentData = val;
      
      if (key === 'Transform' || key === 'UITransform') {
          componentData = { 
              x: initialX, 
              y: initialY, 
              ...val
          };
      }
      cleanComponents[key] = createComponent(key, componentData);
    }
  }

  if (data.type === 'ui' || cleanComponents.UITransform) {
      if (!cleanComponents.UITransform) {
          cleanComponents.UITransform = createComponent("UITransform", {
              x: initialX,
              y: initialY
          });
      }
  } else {
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

          cleanComponents.Transform = createComponent("Transform", { 
            width: defaultWidth, 
            height: defaultHeight,
            x: initialX,
            y: initialY
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
    overridden: Boolean(data.overridden ?? false), 
    
    active: data.active ?? true,
    visible: data.visible ?? true,
    locked: data.locked ?? false,
    
    _editor: { 
        locked: data._editor?.locked ?? false, 
        expanded: data._editor?.expanded ?? false 
    },
    
    components: cleanComponents,
    _isDirty: false 
  };
};