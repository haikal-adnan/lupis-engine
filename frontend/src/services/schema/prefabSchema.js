import { createEntity } from '@/services/schema/sceneSchema/entitySchema.js';

export const createPrefab = (data = {}) => {
  const entityData = data.data ? createEntity(data.data) : createEntity({});
  
  const finalName = data.name || entityData.name || "New Prefab";
  const finalType = data.type || entityData.type || "world";

  // HAPUS entityData._id = null; agar relasi ke anak-anaknya tidak terputus!
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
    // Gunakan _id dan parentId asli agar struktur pohon (tree) tetap utuh
    const c = createEntity({ ...child, _id: child._id, parentId: child.parentId });
    
    // CATATAN: Kita tidak mengeset c.prefabId = null di sini 
    // agar jika child ini adalah "Prefab Lain", statusnya tetap terjaga.
    
    c.overridden = false;
    if (c.components) {
      for (const key in c.components) {
        if (c.components[key]) c.components[key].overridden = false;
      }
    }
    return c;
  });
  
  return {
    _id: data._id,
    projectId: data.projectId || null,
    name: finalName,
    type: finalType, 
    data: entityData,
    children: childrenData
  };
};