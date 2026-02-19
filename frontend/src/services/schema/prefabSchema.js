import { createEntity } from '@/services/schema/sceneSchema/entitySchema.js';

export const createPrefab = (data = {}) => {
  const entityData = data.data ? createEntity(data.data) : createEntity({});
  
  entityData._id = null; 
  entityData.prefabId = null; 
  entityData.parentId = null;
  entityData.isOverridden = false;

  if (entityData.components) {
    for (const key in entityData.components) {
      if (entityData.components[key]) {
        entityData.components[key].isOverridden = false;
      }
    }
  }

  if (entityData.name === "New Entity" && data.name) {
    entityData.name = data.name;
  }
  
  return {
    _id: data._id,
    projectId: data.projectId || null,
    name: data.name || "New Prefab",
    data: entityData
  };
};