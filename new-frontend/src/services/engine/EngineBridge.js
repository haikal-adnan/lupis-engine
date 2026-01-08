// src/modules/engine/EngineBridge.js

let engineInstance = null;

export const EngineBridge = {
  /**
   * Set instance engine saat startEngine berhasil
   * @param {Object} instance - Instance dari Lupis Engine
   */
  setInstance(instance) {
    engineInstance = instance;
    console.log("[EngineBridge] Connected to Engine");
  },

  /**
   * Bersihkan referensi saat unmount
   */
  disconnect() {
    engineInstance = null;
  },

  // --- ENTITY ACTIONS ---

  createEntity(entityData) {
    if (!engineInstance) return;
    // Emit event ke EventBus engine
    engineInstance.bus.emit("editor:entity:create", entityData);
  },

  updateEntityName(entityId, newName) {
    if (!engineInstance) return;
    engineInstance.bus.emit("editor:entity:update-name", { id: entityId, name: newName });
  },

  deleteEntity(entityId) {
    if (!engineInstance) return;
    engineInstance.bus.emit("editor:entity:delete", entityId);
  },

  moveEntity(payload) {
    if (!engineInstance) return;
    // Payload: { id, context: { newParentId, newLayerId, ... } }
    engineInstance.bus.emit("editor:entity:move", payload);
  },

  // --- LAYER ACTIONS ---

  addLayer(layerData) {
    if (!engineInstance) return;
    engineInstance.bus.emit("editor:layer:create", layerData);
  },

  updateLayerName(layerId, newName) {
    if (!engineInstance) return;
    engineInstance.bus.emit("editor:layer:update-name", { id: layerId, name: newName });
  },

  deleteLayer(layerId) {
    if (!engineInstance) return;
    engineInstance.bus.emit("editor:layer:delete", layerId);
  },

  reorderLayer(payload) {
    if (!engineInstance) return;
    engineInstance.bus.emit("editor:layer:reorder", payload);
  }
};