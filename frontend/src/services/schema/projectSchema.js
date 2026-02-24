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
      tickRate: Number(data.settings?.tickRate || 60),
      
      ui: {
        width: Number(data.settings?.ui?.width ?? 1920),
        height: Number(data.settings?.ui?.height ?? 1080),
        showUIBorder: data.settings?.ui?.showUIBorder ?? true,
        active: data.settings?.ui?.active ?? true
      },

      grid: {
        width: Number(data.settings?.grid?.width ?? 32),
        height: Number(data.settings?.grid?.height ?? 32),
        color: data.settings?.grid?.color || '#ffffff',
        opacity: Number(data.settings?.grid?.opacity ?? 0.1),
        visible: data.settings?.grid?.visible ?? true,
        snap: data.settings?.grid?.snap ?? true       
      }
    },

    globalVariables: Array.isArray(data.globalVariables) 
      ? data.globalVariables.map(v => ({
          _id: v._id || GenerateUUID(),
          name: v.name || "NewGlobalVar",
          type: v.type || "String",
          defaultValue: v.defaultValue ?? null
        }))
      : [],

    tags: Array.isArray(data.tags) && data.tags.length > 0 
      ? data.tags 
      : ['Untagged', 'Player', 'Enemy'],

    scenes: data.scenes || [] 
  };
};