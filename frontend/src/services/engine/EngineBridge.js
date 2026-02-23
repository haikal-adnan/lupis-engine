let engineInstance = null;
let onNativeEntityModified = null;
let onNativeTilemapUpdate = null;
let onNativeToolPickup = null;

export const EngineBridge = {
  setInstance(instance) {
    engineInstance = instance;

    engineInstance.bus.on("entity:modified", (entities) => {
       if (onNativeEntityModified) onNativeEntityModified(entities);
    });
    
    engineInstance.bus.on("editor:tool:pickup", (data) => {
        if (onNativeToolPickup) onNativeToolPickup(data);
    });

    engineInstance.bus.on("editor:tilemap:update-data", (payload) => {
        if (onNativeTilemapUpdate) onNativeTilemapUpdate(payload);
    });
  },

  onEntityModified(cb) { onNativeEntityModified = cb; },
  onTilemapDataUpdated(cb) { onNativeTilemapUpdate = cb; },
  onToolPickup(cb) { onNativeToolPickup = cb; },

  disconnect() {
    if (engineInstance) {
        engineInstance.bus.off("entity:modified");
        engineInstance.bus.off("editor:tilemap:update-data");
        engineInstance.bus.off("editor:tool:pickup"); 
    }
    engineInstance = null;
    onNativeEntityModified = null;
    onNativeTilemapUpdate = null;
  },

  selectEntity(ids) { 
    if (engineInstance) {
        engineInstance.bus.emit("editor:selection:set", ids); 
    }
  },

  clearSelection() {
    if (engineInstance) {
        engineInstance.bus.emit("editor:selection:clear");
    }
  },

  updateSceneSettings(payload) {
    if (engineInstance) engineInstance.bus.emit("editor:scene:settings-update", payload);
  },

  updateEditorState(payload) {
    if (engineInstance) engineInstance.bus.emit("editor:store:update", payload);
  },

  getCameraPosition() {
    if (engineInstance.game && engineInstance.game.camera) {
        return { 
            x: engineInstance.game.camera.x, 
            y: engineInstance.game.camera.y 
        };
    }
    return { x: 0, y: 0 };
  },

  createEntity(d) { if(engineInstance) engineInstance.bus.emit("editor:entity:create", d); },
  updateEntityName(id, name) { if(engineInstance) engineInstance.bus.emit("editor:entity:update-name", { id, name }); },
  deleteEntity(id) { if(engineInstance) engineInstance.bus.emit("editor:entity:delete", id); },
  moveEntity(p) { if(engineInstance) engineInstance.bus.emit("editor:entity:move", p); },
  updateComponentProp(p) { if(engineInstance) engineInstance.bus.emit("editor:entity:update-component", p); },
  patchComponent(p) { if(engineInstance) engineInstance.bus.emit("editor:entity:patch-component", p); },
  updateEntityProp(p) { if(engineInstance) engineInstance.bus.emit("editor:entity:update-prop", p); },
  addComponent(p) { if(engineInstance) engineInstance.bus.emit("editor:entity:add-component", p); },
  removeComponent(p) { if(engineInstance) engineInstance.bus.emit("editor:entity:remove-component", p); },

  addLayer(d) { if(engineInstance) engineInstance.bus.emit("editor:layer:create", d); },
  updateLayerName(id, name) { if(engineInstance) engineInstance.bus.emit("editor:layer:update-name", { id, name }); },
  deleteLayer(id) { if(engineInstance) engineInstance.bus.emit("editor:layer:delete", id); },
  reorderLayer(p) { if(engineInstance) engineInstance.bus.emit("editor:layer:reorder", p); },

  createAsset(d) { if(engineInstance) engineInstance.bus.emit("editor:asset:create", d); },
  deleteAsset(id) { if(engineInstance) engineInstance.bus.emit("editor:asset:delete", id); },
  
  createScript(d) { if(engineInstance) engineInstance.bus.emit("editor:script:create", d); },
  updateScript(id, updates) { if(engineInstance) engineInstance.bus.emit("editor:script:update", { id, updates }); },
  deleteScript(id) { if(engineInstance) engineInstance.bus.emit("editor:script:delete", id); },

  linkEntitiesToPrefab(entities) {
    if (engineInstance) {
        engineInstance.bus.emit("editor:entity:replace", entities);
    }
  },

  updateEntity(entities) {
     if (engineInstance) {
        const data = Array.isArray(entities) ? entities : [entities];
        engineInstance.bus.emit("editor:entity:replace", data);
     }
  },

  createPrefab(d) { if(engineInstance) engineInstance.bus.emit("editor:prefab:create", d); },
  updatePrefab(id, updates) { if(engineInstance) engineInstance.bus.emit("editor:prefab:update", { id, updates }); },
  deletePrefab(id) { if(engineInstance) engineInstance.bus.emit("editor:prefab:delete", id); },
};