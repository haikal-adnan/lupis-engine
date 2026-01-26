import { GenerateUUID } from '@/commons/utils/generateUUID.js';

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

    // 1. Global Variables (Existing)
    globalVariables: Array.isArray(data.globalVariables) 
      ? data.globalVariables.map(v => ({
          _id: v._id || GenerateUUID(),
          name: v.name || "NewGlobalVar",
          type: v.type || "String",
          defaultValue: v.defaultValue ?? null
        }))
      : [],

    globalEvents: Array.isArray(data.globalEvents)
      ? data.globalEvents.map(e => ({
          _id: e._id || GenerateUUID(),
          name: e.name || "NewEvent",
          description: e.description || ""
        }))
      : [],

    tags: Array.isArray(data.tags) && data.tags.length > 0 
      ? data.tags 
      : ['Untagged', 'Player', 'Enemy'],

    scenes: data.scenes || [] 
  };
};