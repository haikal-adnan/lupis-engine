import { createEntity } from '@schemas/sceneSchema/entitySchema.js';

export const createPrefab = (data = {}) => {
  const entityData = data.data ? createEntity(data.data) : {};
  
  entityData._id = null; 
  
  if (entityData.name === "New Entity") {
    entityData.name = data.name;
  }
  
  entityData.prefabId = data._id; 

  return {
    _id: data._id,
    name: data.name || "New Prefab",
    thumbnailUrl: data.thumbnailUrl || null,
    data: entityData
  };
};