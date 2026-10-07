import { GenerateUUID } from '@utils/utils.js';

export const layerSchema = (data = {}) => {
  return {
    id: data.id || `${GenerateUUID()}`,
    scriptId: data.scriptId || `layer_${GenerateUUID()}`,
    name: data.name || "New Layer",
    zIndex: Number(data.zIndex ?? 0), 
    orderIndex: Number(data.orderIndex ?? 0),
    active: data.active ?? true,
    visible: data.visible ?? true,
    locked: data.locked ?? false,
    opacity: data.opacity ?? 1.0
  };
};