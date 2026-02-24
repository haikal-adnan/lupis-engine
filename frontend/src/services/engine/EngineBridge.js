import { useEditorStore } from '@/stores/useEditorStore.js'; 

let onNativeEntityModified = null;
let onNativeTilemapUpdate = null;
let onNativeToolPickup = null;

export const EngineBridge = {
  get _instance() {
    return useEditorStore().engine;
  },

  setupListeners() {
    const engine = this._instance;
    if (!engine) return;

    engine.bus.on("entity:modified", (entities) => {
       if (onNativeEntityModified) onNativeEntityModified(entities);
    });
    
    engine.bus.on("editor:tool:pickup", (data) => {
        if (onNativeToolPickup) onNativeToolPickup(data);
    });

    engine.bus.on("editor:tilemap:update-data", (payload) => {
        if (onNativeTilemapUpdate) onNativeTilemapUpdate(payload);
    });
  },

  onEntityModified(cb) { onNativeEntityModified = cb; },
  onTilemapDataUpdated(cb) { onNativeTilemapUpdate = cb; },
  onToolPickup(cb) { onNativeToolPickup = cb; },

  disconnect() {
    const engine = this._instance;
    if (engine) {
        engine.bus.off("entity:modified");
        engine.bus.off("editor:tilemap:update-data");
        engine.bus.off("editor:tool:pickup"); 
    }
    onNativeEntityModified = null;
    onNativeTilemapUpdate = null;
    onNativeToolPickup = null;
  },

  selectEntity(ids) { 
    if (this._instance) this._instance.bus.emit("editor:selection:set", ids); 
  },

  clearSelection() {
    if (this._instance) this._instance.bus.emit("editor:selection:clear");
  },

  updateProjectSettings(payload) {
    if (this._instance) this._instance.bus.emit("editor:project:settings-update", payload);
  },

  updateSceneSettings(payload) {
    if (this._instance) this._instance.bus.emit("editor:scene:settings-update", payload);
  },

  updateEditorState(payload) {
    if (this._instance) this._instance.bus.emit("editor:store:update", payload);
  },

  getCameraPosition() {
    const engine = this._instance;
    if (engine && engine.game && engine.game.camera) {
        return { 
            x: engine.game.camera.x, 
            y: engine.game.camera.y 
        };
    }
    return { x: 0, y: 0 };
  },

  createEntity(d) { if(this._instance) this._instance.bus.emit("editor:entity:create", d); },
  updateEntityName(id, name) { if(this._instance) this._instance.bus.emit("editor:entity:update-name", { id, name }); },
  deleteEntity(id) { if(this._instance) this._instance.bus.emit("editor:entity:delete", id); },
  moveEntity(p) { if(this._instance) this._instance.bus.emit("editor:entity:move", p); },
  updateComponentProp(p) { if(this._instance) this._instance.bus.emit("editor:entity:update-component", p); },
  patchComponent(p) { if(this._instance) this._instance.bus.emit("editor:entity:patch-component", p); },
  updateEntityProp(p) { if(this._instance) this._instance.bus.emit("editor:entity:update-prop", p); },
  updateLayerProp(id, prop, value) { 
    if(this._instance) this._instance.bus.emit("editor:layer:update-prop", { id, prop, value }); 
  },
  addComponent(p) { if(this._instance) this._instance.bus.emit("editor:entity:add-component", p); },
  removeComponent(p) { if(this._instance) this._instance.bus.emit("editor:entity:remove-component", p); },

  addLayer(d) { if(this._instance) this._instance.bus.emit("editor:layer:create", d); },
  updateLayerName(id, name) { if(this._instance) this._instance.bus.emit("editor:layer:update-name", { id, name }); },
  deleteLayer(id) { if(this._instance) this._instance.bus.emit("editor:layer:delete", id); },
  reorderLayer(p) { if(this._instance) this._instance.bus.emit("editor:layer:reorder", p); },

  createAsset(d) { if(this._instance) this._instance.bus.emit("editor:asset:create", d); },
  deleteAsset(id) { if(this._instance) this._instance.bus.emit("editor:asset:delete", id); },
  
  createScript(d) { if(this._instance) this._instance.bus.emit("editor:script:create", d); },
  updateScript(id, updates) { if(this._instance) this._instance.bus.emit("editor:script:update", { id, updates }); },
  deleteScript(id) { if(this._instance) this._instance.bus.emit("editor:script:delete", id); },

  linkEntitiesToPrefab(entities) {
    if (this._instance) this._instance.bus.emit("editor:entity:replace", entities);
  },

  updateEntity(entities) {
     if (this._instance) {
        const data = Array.isArray(entities) ? entities : [entities];
        this._instance.bus.emit("editor:entity:replace", data);
     }
  },

  

  createPrefab(d) { if(this._instance) this._instance.bus.emit("editor:prefab:create", d); },
  updatePrefab(id, updates) { if(this._instance) this._instance.bus.emit("editor:prefab:update", { id, updates }); },
  deletePrefab(id) { if(this._instance) this._instance.bus.emit("editor:prefab:delete", id); },
};