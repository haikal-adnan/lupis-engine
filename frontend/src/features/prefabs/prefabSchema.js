import { entitySchema } from '@scenes/scenes.js'; 

export const prefabSchema = (data = {}) => {
  const entityData = data.data ? entitySchema(data.data) : entitySchema({});
  
  const finalName = data.name || entityData.name || "New Prefab";
  const finalType = data.type || entityData.type || "world";

  entityData.prefabId = null; 
  entityData.parentId = null; 
  entityData.overridden = false;
  entityData.name = finalName;
  entityData.type = finalType;

  if (entityData.components) {
    for (const key in entityData.components) {
      if (entityData.components[key]) {
        entityData.components[key].overridden = false;
      }
    }
  }

  const childrenData = (data.children || []).map(child => {
    const c = entitySchema({ ...child, id: child.id, parentId: child.parentId });
    
    c.overridden = false;
    if (c.components) {
      for (const key in c.components) {
        if (c.components[key]) c.components[key].overridden = false;
      }
    }
    return c;
  });
  
  return {
    id: data.id,
    projectId: data.projectId || null,
    folderId: data.folderId || null, 
    name: finalName,
    type: finalType, 
    data: entityData,
    children: childrenData
  };
};