// src/services/schema/projectSchema.js (atau lokasi file helper project kamu)

export const createProject = (data = {}) => {
  return {
    _id: data._id, 
    name: data.name || "Untitled Project",
    ownerId: data.ownerId || null,
    description: data.description || "",
    createdAt: data.createdAt || new Date().toISOString(),
    thumbnailUrl: data.thumbnailUrl || null,
    
    settings: {
      width: Number(data.settings?.width || 1280),
      height: Number(data.settings?.height || 720)
    },

    globalVariables: Array.isArray(data.globalVariables) 
      ? data.globalVariables.map(v => ({
          name: v.name || "NewGlobalVar",
          type: v.type || "String",
          defaultValue: v.defaultValue ?? null
        }))
      : [],
    
    scenes: data.scenes || [] 
  };
};