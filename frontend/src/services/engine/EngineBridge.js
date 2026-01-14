// src/modules/engine/EngineBridge.js

let engineInstance = null;
let onNativeEntityModified = null;

export const EngineBridge = {
  setInstance(instance) {
    engineInstance = instance;

    engineInstance.bus.on("entity:modified", (entities, isTransient) => {
       if (onNativeEntityModified) {
         onNativeEntityModified(entities);
       }
    });
  },

  onEntityModified(callback) {
    onNativeEntityModified = callback;
  },

  disconnect() {
    if (engineInstance) {
        engineInstance.bus.off("entity:modified");
    }
    engineInstance = null;
    onNativeEntityModified = null;
  },

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
    engineInstance.bus.emit("editor:entity:move", payload);
  },

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
  },

  updateComponentProp(payload) {
    if (!engineInstance) return;
    engineInstance.bus.emit("editor:entity:update-component", payload);
  },

  updateEntityProp(payload) {
    if (!engineInstance) return;
    engineInstance.bus.emit("editor:entity:update-prop", payload);
  },

  createAsset(assetData) {
    if (!engineInstance) return;
    // Emit event: engine akan menangkap ini dan memproses blob/url menjadi Texture
    engineInstance.bus.emit("editor:asset:create", assetData);
  },

  deleteAsset(assetId) {
    if (!engineInstance) return;
    engineInstance.bus.emit("editor:asset:delete", assetId);
  },

  updateEditorState(payload) {
    if (!engineInstance) return;
    
    engineInstance.bus.emit("editor:store:update", payload);
  },

  onTilemapResized(callback) {
    if (!engineInstance) return;
    engineInstance.bus.on("editor:tilemap:resize", (data) => {
        callback(data);
    });
  },
};