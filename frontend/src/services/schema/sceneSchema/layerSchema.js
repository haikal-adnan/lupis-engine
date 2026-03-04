import { GenerateUUID } from '@/commons/utils/generateUUID.js';

export const createLayer = (data = {}) => {
  return {
    _id: data._id || `${GenerateUUID()}`,
    scriptId: data.scriptId || `layer_${GenerateUUID()}`,
    name: data.name || "New Layer",
    zIndex: Number(data.zIndex ?? 0), 
    orderIndex: Number(data.orderIndex ?? 0),
    active: data.active ?? true,
    visible: data.visible ?? true,
    locked: data.locked ?? false
  };
};