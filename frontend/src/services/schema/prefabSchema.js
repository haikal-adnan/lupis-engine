import { createEntity } from '@/services/schema/sceneSchema/entitySchema.js';

export const createPrefab = (data = {}) => {
  const entityData = data.data ? createEntity(data.data) : createEntity({});
  
  // 1. Tentukan Name dan Type untuk Root (Prioritas: parameter data > entity > default)
  const finalName = data.name || entityData.name || "New Prefab";
  const finalType = data.type || entityData.type || "world";

  // 2. Bersihkan ID karena ini akan menjadi instance baru/master
  entityData._id = null; 
  entityData.prefabId = null; 
  entityData.parentId = null;
  entityData.isOverridden = false;

  // 3. SINKRONISASI: Paksa entity di dalam prefab menggunakan nama & tipe yang sama
  entityData.name = finalName;
  entityData.type = finalType;

  if (entityData.components) {
    for (const key in entityData.components) {
      if (entityData.components[key]) {
        entityData.components[key].isOverridden = false;
      }
    }
  }
  
  // 4. Return struktur yang memisahkan Metadata Root dan Data Entity
  return {
    _id: data._id,
    projectId: data.projectId || null,
    name: finalName, // Letaknya sekarang di Root
    type: finalType, // Letaknya sekarang di Root
    data: entityData // Objek entity seutuhnya
  };
};