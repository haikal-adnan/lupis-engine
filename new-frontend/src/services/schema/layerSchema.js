/**
 * Membuat object Layer baru sesuai Mongoose LayerSchema
 */
export const createLayer = (data = {}) => {
  return {
    _id: data._id || `layer_${Date.now()}`,
    name: data.name || "New Layer",
    visible: data.visible ?? true,
    locked: data.locked ?? false
  };
};