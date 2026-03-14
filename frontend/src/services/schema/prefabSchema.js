import { createEntity } from '@/services/schema/sceneSchema/entitySchema.js';

export const createPrefab = (data = {}) => {
  const entityData = data.data ? createEntity(data.data) : createEntity({});
  
  const finalName = data.name || entityData.name || "New Prefab";
  const finalType = data.type || entityData.type || "world";

  entityData._id = null; 
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
  
  return {
    _id: data._id,
    projectId: data.projectId || null,
    name: finalName,
    type: finalType, 
    data: entityData 
  };
};