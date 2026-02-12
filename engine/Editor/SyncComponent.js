import Entity from "../Core/Entity.js";
import { ApplyResizeToEntity } from "../Util/ApplyResizeToEntity.js";

export default class SyncComponent {
    constructor(world, bus, game) {
        this.world = world;
        this.bus = bus;
        this.game = game;
        this.assetLoader = game.assetLoader;
        this.bindEvents();
    }

    bindEvents() {
        this.bus.on("editor:entity:create", (d) => this.onCreateEntity(d));
        this.bus.on("editor:entity:delete", (id) => this.onDeleteEntity(id));
        this.bus.on("editor:entity:update-name", (p) => this.onUpdateEntityName(p));
        this.bus.on("editor:entity:move", (p) => this.onMoveEntity(p));
        this.bus.on("editor:entity:update-component", (p) => this.onUpdateComponent(p));
        this.bus.on("editor:entity:update-prop", (p) => this.onUpdateEntityProp(p));
        this.bus.on("editor:entity:patch-component", (p) => this.onPatchComponent(p));
        this.bus.on("editor:entity:add-component", (p) => this.onAddComponent(p));
        this.bus.on("editor:entity:remove-component", (p) => this.onRemoveComponent(p));
        
        this.bus.on("editor:layer:create", (d) => this.onCreateLayer(d));
        this.bus.on("editor:layer:delete", (id) => this.onDeleteLayer(id));
        this.bus.on("editor:layer:update-name", (p) => this.onUpdateLayerName(p));
        this.bus.on("editor:layer:reorder", (p) => this.onReorderLayer(p));

        this.bus.on("editor:asset:create", (a) => this.onAssetCreate(a));
        this.bus.on("editor:asset:delete", (id) => this.onAssetDelete(id));
        this.bus.on("editor:script:create", (s) => this.onScriptCreate(s));
        this.bus.on("editor:script:update", (p) => this.onScriptUpdate(p));
        this.bus.on("editor:script:delete", (id) => this.onScriptDelete(id));
        
        this.bus.on("editor:store:update", (p) => this.onUpdateEditorStore(p));
        this.bus.on("editor:scene:settings-update", (p) => this.onUpdateSceneSettings(p));
        this.bus.on("editor:selection:clear", () => this.onClearSelection());
    }

    onUpdateSceneSettings(payload) {
        if (!this.world.settings) return;
        
        if (payload.grid) Object.assign(this.world.settings.grid, payload.grid);
        if (payload.worldBounds) Object.assign(this.world.settings.worldBounds, payload.worldBounds);
        
        if (payload.ui) {
            if (!this.world.settings.ui) {
                this.world.settings.ui = { 
                    active: true, 
                    referenceWidth: 1920, 
                    referenceHeight: 1080, 
                    scaleMode: 'constant', 
                    showUIBorder: true 
                };
            }
            Object.assign(this.world.settings.ui, payload.ui);
        }

        if (payload.showUIBorder !== undefined && this.world.settings.ui) {
            this.world.settings.ui.showUIBorder = payload.showUIBorder;
        }
        
        if (payload.backgroundColor !== undefined) this.world.settings.backgroundColor = payload.backgroundColor;
        if (payload.tickRate !== undefined) this.world.settings.tickRate = payload.tickRate;
        if (payload.showRulers !== undefined) this.world.settings.showRulers = payload.showRulers;
    }

    onClearSelection() { 
        if (this.game.selection) this.game.selection.clear(); 
    }

    onUpdateEditorStore(payload) {
        if (!payload) return;
        if (!this.world._editors) {
            this.world._editors = { 
                activeTool: null, 
                activeTabId: null, 
                tilemapContext: {} 
            };
        }
        
        const { tilemapContext, tileSelection, gridContext, showUIBorder, ...others } = payload;
        
        Object.assign(this.world._editors, others);

        if (tilemapContext) {
            if (!this.world._editors.tilemapContext) this.world._editors.tilemapContext = {};
            Object.assign(this.world._editors.tilemapContext, tilemapContext);
        }
        
        if (tileSelection !== undefined) this.world._editors.tileSelection = tileSelection;
    }

    onCreateLayer(layerData) { 
        const newLayer = { 
            _id: layerData._id, 
            scriptId: layerData.scriptId,
            name: layerData.name, 
            visible: true, 
            locked: false, 
            zIndex: layerData.zIndex ?? 0,
            orderIndex: layerData.orderIndex ?? 0,
            entities: [] 
        };

        const isUI = layerData.scriptId === 'ui' || (layerData.name && layerData.name.toLowerCase().includes('ui'));
        
        if (isUI) {
            this.world.layersUI.push(newLayer);
        } else {
            this.world.layersWorld.push(newLayer);
        }
    }

    onDeleteLayer(id) { 
        this.world.layersWorld = this.world.layersWorld.filter((l) => l._id !== id); 
        this.world.layersUI = this.world.layersUI.filter((l) => l._id !== id);
    }

    onUpdateLayerName({ id, name }) { 
        let l = this.world.layersWorld.find((l) => l._id === id);
        if (!l) l = this.world.layersUI.find((l) => l._id === id);
        if (l) l.name = name; 
    }

    onReorderLayer({ id, targetId, position }) { 
        let layers = this.world.layersWorld;
        let oldIndex = layers.findIndex(l => l._id === id);
        
        if (oldIndex === -1) {
            layers = this.world.layersUI;
            oldIndex = layers.findIndex(l => l._id === id);
        }

        if (oldIndex === -1) return;

        const [movedLayer] = layers.splice(oldIndex, 1);
        
        let targetIndex = layers.findIndex(l => l._id === targetId);
        
        if (position === 'bottom') targetIndex += 1;
        if (targetIndex < 0) targetIndex = 0;
        if (targetIndex > layers.length) targetIndex = layers.length;
        
        layers.splice(targetIndex, 0, movedLayer);
        
        layers.forEach((l, idx) => l.orderIndex = idx);
    }

    onCreateEntity(entityData) {
        const entity = this._createEntityInstance(entityData);

        if (this._findEntityById(entityData._id)) {
            console.warn(`[Sync] Entity with ID ${entityData._id} already exists. Skipping.`);
            return;
        }
        
        if (entity.parentId) {
            // Jika punya parent, masukkan HANYA ke children parent
            const parent = this._findEntityById(entity.parentId);
            if (parent) { 
                if (!parent.children) parent.children = []; 
                parent.children.push(entity); 
                parent.children.sort((a, b) => (a.zIndex - b.zIndex) || (a.orderIndex - b.orderIndex));
            }
        } else {
            // Jika tidak punya parent, baru masukkan ke Root Layer
            let layer = this.world.layersWorld.find(l => l._id === entity.layerId) || 
                        this.world.layersUI.find(l => l._id === entity.layerId);
            if (layer) {
                layer.entities.push(entity);
                layer.entities.sort((a, b) => (a.zIndex - b.zIndex) || (a.orderIndex - b.orderIndex));
            }
        }
    }

    onDeleteEntity(id) { 
        const deleteRecursive = (targetId) => {
            const entity = this._findEntityById(targetId);
            if (!entity) return;
            
            if (entity.parentId) {
                const parent = this._findEntityById(entity.parentId);
                if (parent && parent.children) {
                    parent.children = parent.children.filter(c => c._id !== targetId && c.id !== targetId);
                }
            }
            
            let layer = this.world.layersWorld.find(l => l._id === entity.layerId);
            if (!layer) layer = this.world.layersUI.find(l => l._id === entity.layerId);
            
            if (layer) {
                layer.entities = layer.entities.filter(e => e._id !== targetId && e.id !== targetId);
            }
        };
        deleteRecursive(id);
    }

    onMoveEntity({ id, parentId, layerId }) {
        const entity = this._findEntityById(id);
        if (!entity) {
            return;
        }

        let targetContainer = null;

        if (parentId) {
            const newP = this._findEntityById(parentId);
            if (newP) {
                if (!newP.children) newP.children = [];
                targetContainer = newP.children;
            }
        } else {
            let newL = this.world.layersWorld.find(l => l._id === layerId) || 
                    this.world.layersUI.find(l => l._id === layerId);

            if (newL) {
                targetContainer = newL.entities;
            }
        }

        if (!targetContainer) {
            return;
        }

        if (entity.parentId) {
            const oldP = this._findEntityById(entity.parentId);
            if (oldP?.children) {
                const idx = oldP.children.indexOf(entity);
                if (idx !== -1) {
                    oldP.children.splice(idx, 1);
                }
            }
        } else {
            let oldL = this.world.layersWorld.find(l => l._id === entity.layerId) || 
                    this.world.layersUI.find(l => l._id === entity.layerId);

            if (oldL?.entities) {
                const idx = oldL.entities.indexOf(entity);
                if (idx !== -1) {
                    oldL.entities.splice(idx, 1);
                }
            }
        }

        entity.layerId = layerId;
        entity.parentId = parentId;

        targetContainer.push(entity);

        targetContainer.sort((a, b) => {
            if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
            return (a.orderIndex || 0) - (b.orderIndex || 0);
        });
    }

    onUpdateEntityName({ id, name }) { 
        const e = this._findEntityById(id); 
        if (e) e.name = name; 
    }

    onUpdateComponent({ entityId, componentName, path, value }) { 
        const e = this._findEntityById(entityId); 
        if (!e) return;

        const c = e.components[componentName]; 
        if (!c) return;

        const k = path.split('.'); 
        let t = c; 
        for (let i = 0; i < k.length - 1; i++) {
            if (!t[k[i]]) t[k[i]] = {}; 
            t = t[k[i]]; 
        }
        t[k[k.length - 1]] = value; 

        if (componentName === 'TextRenderer') {
            if (['fontSize', 'value', 'assetId', 'lockRatio'].includes(path)) {
                ApplyResizeToEntity(e, this.world, true);
                this.bus.emit("entity:modified", [e]);
            }
        }
    }

    onUpdateEntityProp({ id, prop, value }) { 
        const e = this._findEntityById(id); 
        if (e) {
            e[prop] = value;
            if (prop === 'zIndex' || prop === 'orderIndex') {
                const container = e.parentId 
                    ? this._findEntityById(e.parentId)?.children 
                    : (this.world.layersWorld.find(l => l._id === e.layerId) || this.world.layersUI.find(l => l._id === e.layerId))?.entities;
                
                if (container) {
                    container.sort((a, b) => {
                        const zA = a.zIndex ?? 0;
                        const zB = b.zIndex ?? 0;
                        if (zA !== zB) return zA - zB;
                        return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
                    });
                }
            }
        } 
    }
    
    _findEntityById(id) { 
        const allLayers = [...this.world.layersWorld, ...this.world.layersUI];
        for (const l of allLayers) {
            if (!l.entities) continue;
            for (const e of l.entities) {
                if (e.id === id || e._id === id) return e;
                const f = this._findEntityRecursive(e, id); 
                if (f) return f;
            }
        }
        return null;
    }

    _findEntityRecursive(p, id) { 
        if(!p.children) return null; 
        for(const c of p.children) { 
            if(c.id === id || c._id === id) return c; 
            const f = this._findEntityRecursive(c, id); 
            if(f) return f; 
        } 
        return null; 
    }

    _createEntityInstance(data) {
        const e = new Entity(data._id);
        e.name = data.name;
        e.type = data.type;
        e.layerId = data.layerId;
        e.parentId = data.parentId;
        e.active = data.isActive;
        e.visible = data.isVisible;
        
        e.zIndex = data.zIndex ?? 0;
        e.orderIndex = data.orderIndex ?? 0;

        e.children = [];
        if (data.components) {
            for (const [k, v] of Object.entries(data.components)) {
                e.addComponent(k, v);
            }
        }
        return e;
    }
    
    async onAssetCreate(asset) { 
        if (this.assetLoader) await this.assetLoader.loadAsset(this.world, [asset]); 
    }
    
    onAssetDelete(id) { 
        if (this.world.assets.textures[id]) delete this.world.assets.textures[id]; 
    }
    
    onScriptCreate(s) { 
        if(!this.world.scripts) this.world.scripts = {}; 
        this.world.scripts[s._id] = { 
            _id: s._id, 
            name: s.name, 
            type: s.type, 
            variables: s.exposedVariables || [], 
            nodes: s.nodes || [], 
            edges: s.edges || [] 
        }; 
    }
    
    onScriptUpdate({ id, updates }) { 
        if (this.world.scripts?.[id]) Object.assign(this.world.scripts[id], updates); 
    }
    
    onScriptDelete(id) { 
        if (this.world.scripts?.[id]) delete this.world.scripts[id]; 
    }

    onPatchComponent({ entityId, componentName, updates }) {
        const e = this._findEntityById(entityId); if (!e) return;
        if (!e.components) e.components = {};
        if (!e.components[componentName]) e.addComponent(componentName, updates);
        else {
            const c = e.components[componentName];
            if (updates.data && Array.isArray(updates.data)) c.data = [...updates.data];
            else Object.assign(c, updates);
        }
    }

    onAddComponent({ entityId, componentName, data }) { 
        const e = this._findEntityById(entityId); 
        if(e) e.addComponent(componentName, data); 
    }
    
    onRemoveComponent({ entityId, componentName }) {
        const e = this._findEntityById(entityId); 
        if(e && e.components) delete e.components[componentName]; 
    }
}