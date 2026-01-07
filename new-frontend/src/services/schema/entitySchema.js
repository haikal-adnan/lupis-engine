import { createComponent, createTransform } from './componentSchema.js';

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

  // 3. Construct Object
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