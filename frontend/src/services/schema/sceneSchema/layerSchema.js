import { GenerateUUID } from '@/commons/utils/generateUUID.js';

export const createLayer = (data = {}) => {
  return {
    _id: data._id || `${GenerateUUID()}`,
    
    scriptId: data.scriptId || `layer_${GenerateUUID()}`,
    
    name: data.name || "New Layer",
    visible: data.visible ?? true,
    locked: data.locked ?? false
  };
};