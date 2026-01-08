import { createComponent, createTransform } from './componentSchema.js';

export const createEntity = (data = {}) => {
  const cleanComponents = {};

  if (data.components) {
    for (const [key, val] of Object.entries(data.components)) {
      cleanComponents[key] = createComponent(key, val);
    }
  }

  let defaultWidth = 100;
  let defaultHeight = 100;

  if (cleanComponents.TextRenderer) {
    defaultWidth = 107;
    defaultHeight = 23;
  } else if (cleanComponents.SpriteRenderer || cleanComponents.ShapeRenderer) {
    defaultWidth = 100;
    defaultHeight = 100;
  }

  const rawTransform = cleanComponents.Transform || data.transform || {};
  
  cleanComponents.Transform = createTransform(rawTransform, { 
    width: defaultWidth, 
    height: defaultHeight 
  });

  return {
    _id: data._id || `ent_${Date.now()}`,
    name: data.name || "New Entity",
    type: data.type || "entity",
    tag: data.tag || "untagged",
    
    parentId: data.parentId || null,
    layerId: data.layerId || "layer_root",
    prefabId: data.prefabId || null,

    isActive: data.isActive ?? true,
    isVisible: data.isVisible ?? true,

    _editor: {
      locked: data._editor?.locked ?? false,
      expanded: data._editor?.expanded ?? false,
      hiddenInList: data._editor?.hiddenInList ?? false,
      selected: false
    },

    components: cleanComponents,
    _isDirty: false 
  };
};