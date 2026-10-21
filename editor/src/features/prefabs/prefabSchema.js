import { entitySchema } from '@scenes/scenes.js'; 
import { sanitizeScriptId } from '@utils/utils.js';

export const prefabSchema = (data = {}) => {
  const entityData = data.data ? entitySchema(data.data) : entitySchema({});
  
  const finalScriptId = sanitizeScriptId(
    data.scriptId || entityData.scriptId || "prefab_1",
    "prefab_1"
  );
  const finalType = data.type || entityData.type || "world";

  entityData.prefabId = null; 
  entityData.parentId = null; 
  entityData.overridden = false;
  const originalEntityScriptId = data.data && (data.data.scriptId || data.data.name);
  entityData.scriptId = originalEntityScriptId 
    ? sanitizeScriptId(originalEntityScriptId, finalScriptId) 
    : finalScriptId;
  entityData.type = finalType;

  if (entityData.components) {
    for (const key in entityData.components) {
      if (entityData.components[key]) {
        entityData.components[key].overridden = false;
      }
    }
  }

  const childrenData = (data.children || []).map(child => {
    const rawChildScriptId = child.scriptId && child.scriptId !== 'undefined' 
      ? child.scriptId 
      : (child.name || child.type || 'child');
    const c = entitySchema({ ...child, scriptId: rawChildScriptId, id: child.id, parentId: child.parentId });
    
    c.overridden = false;
    if (c.components) {
      for (const key in c.components) {
        if (c.components[key]) c.components[key].overridden = false;
      }
    }
    return c;
  });
  
  const prefab = {
    id: data.id,
    projectId: data.projectId || null,
    folderId: data.folderId || null, 
    scriptId: finalScriptId,
    type: finalType, 
    data: entityData,
    children: childrenData
  };

  return prefab;
};