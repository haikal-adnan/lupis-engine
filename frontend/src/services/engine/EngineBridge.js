// src/modules/engine/EngineBridge.js

let engineInstance = null;
let onNativeEntityModified = null;
let onNativeTilemapUpdate = null;
let onNativeToolPickup = null;

export const EngineBridge = {
  setInstance(instance) {
    engineInstance = instance;

    engineInstance.bus.on("entity:modified", (entities, isTransient) => {
       if (onNativeEntityModified) {
         onNativeEntityModified(entities);
       }
    });
    
    engineInstance.bus.on("editor:tool:pickup", (data) => {
        if (onNativeToolPickup) {
            onNativeToolPickup(data);
        }
    });

    engineInstance.bus.on("editor:tilemap:update-data", (payload) => {
        console.log()

        if (onNativeTilemapUpdate) {
          
            onNativeTilemapUpdate(payload);
        }
    });
  },

  onEntityModified(callback) {
    onNativeEntityModified = callback;
  },

  onTilemapDataUpdated(callback) {
      onNativeTilemapUpdate = callback;
  },

  onToolPickup(callback) {
    onNativeToolPickup = callback;
  },

  disconnect() {
    if (engineInstance) {
        engineInstance.bus.off("entity:modified");
    }
    if (engineInstance) {
        engineInstance.bus.off("editor:tilemap:update-data");
      }
    if (engineInstance) {
        engineInstance.bus.off("editor:tool:pickup"); 
    }
    engineInstance = null;
    onNativeEntityModified = null;
    onNativeTilemapUpdate = null;
  },

  createEntity(entityData) {
    if (!engineInstance) return;
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

  patchComponent(payload) {
    if (!engineInstance) return;
    engineInstance.bus.emit("editor:entity:patch-component", payload);
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

  addComponent(payload) {
    if (!engineInstance) return;
    engineInstance.bus.emit("editor:entity:add-component", payload);
  },

  removeComponent(payload) {
    if (!engineInstance) return;
    engineInstance.bus.emit("editor:entity:remove-component", payload);
  },

  createScript(scriptData) {
    if (!engineInstance) return;
    engineInstance.bus.emit("editor:script:create", scriptData);
  },

  updateScript(scriptId, updates) {
    if (!engineInstance) return;
    engineInstance.bus.emit("editor:script:update", { id: scriptId, updates });
  },

  deleteScript(scriptId) {
    if (!engineInstance) return;
    engineInstance.bus.emit("editor:script:delete", scriptId);
  },

};