import Entity from "../Core/Entity.js";

export default class SyncComponent {
    constructor(world, bus, assetLoader) {
        this.world = world;
        this.bus = bus;
        this.assetLoader = assetLoader;
        this.bindEvents();
    }

    bindEvents() {
        // --- Entity Events ---
        this.bus.on("editor:entity:create", (data) => this.onCreateEntity(data));
        this.bus.on("editor:entity:delete", (id) => this.onDeleteEntity(id));
        this.bus.on("editor:entity:update-name", (p) => this.onUpdateEntityName(p));
        this.bus.on("editor:entity:move", (p) => this.onMoveEntity(p)); 
        this.bus.on("editor:entity:update-component", (p) => this.onUpdateComponent(p));
        this.bus.on("editor:entity:update-prop", (p) => this.onUpdateEntityProp(p));

        // --- Layer Events ---
        this.bus.on("editor:layer:create", (data) => this.onCreateLayer(data));
        this.bus.on("editor:layer:delete", (id) => this.onDeleteLayer(id));
        this.bus.on("editor:layer:update-name", (p) => this.onUpdateLayerName(p));
        this.bus.on("editor:layer:reorder", (p) => this.onReorderLayer(p)); 

        // --- Asset Events ---
        this.bus.on("editor:asset:create", (asset) => this.onAssetCreate(asset));
        this.bus.on("editor:asset:delete", (id) => this.onAssetDelete(id));

        // --- Editor State Sync ---
        this.bus.on("editor:store:update", (payload) => this.onUpdateEditorStore(payload));
    }

    onUpdateEditorStore(payload) {
        if (!payload) return;
        if (!this.world._editors) {
            this.world._editors = {
                activeTool: null,
                activeTabId: null,
                tilemapContext: {},
                gridContext: { display: true, width: 50, height: 50, magnet: true }
            };
        }
        const { tilemapContext, gridContext, tileSelection, ...others } = payload;
        Object.assign(this.world._editors, others);

        if (tilemapContext) {
            if (!this.world._editors.tilemapContext) this.world._editors.tilemapContext = {};
            Object.assign(this.world._editors.tilemapContext, tilemapContext);
        }
        if (gridContext) {
            if (!this.world._editors.gridContext) this.world._editors.gridContext = {};
            Object.assign(this.world._editors.gridContext, gridContext);
        }
        if (tileSelection !== undefined) {
            this.world._editors.tileSelection = tileSelection;
        }
    }

    // --------------------------------------------------------------------------
    // LAYER HANDLERS
    // --------------------------------------------------------------------------

    onCreateLayer(layerData) {
        this.world.layers.push({
            _id: layerData._id,
            name: layerData.name,
            visible: true,
            locked: false,
            entities: [] 
        });
    }

    onDeleteLayer(id) {
        this.world.layers = this.world.layers.filter((l) => l._id !== id);
    }

    onUpdateLayerName({ id, name }) {
        const layer = this.world.layers.find((l) => l._id === id);
        if (layer) layer.name = name;
    }

    onReorderLayer({ id, targetId, position }) {
        const layers = this.world.layers;
        const oldIndex = layers.findIndex(l => l._id === id);
        if (oldIndex === -1) return;

        const [movedLayer] = layers.splice(oldIndex, 1);

        let targetIndex = layers.findIndex(l => l._id === targetId);
        if (position === 'bottom') targetIndex += 1;

        if (targetIndex < 0) targetIndex = 0;
        if (targetIndex > layers.length) targetIndex = layers.length;

        layers.splice(targetIndex, 0, movedLayer);
    }

    // --------------------------------------------------------------------------
    // ENTITY HANDLERS
    // --------------------------------------------------------------------------

    onCreateEntity(entityData) {
        const entity = this._createEntityInstance(entityData);
        
        // Masukkan ke Layer yang sesuai
        const layer = this.world.layers.find(l => l._id === entity.layerId);
        if (layer) {
            layer.entities.push(entity);
        }

        // Jika punya Parent, masukkan ke Children Parent juga
        if (entity.parentId) {
            const parent = this._findEntityById(entity.parentId);
            if (parent) {
                if(!parent.children) parent.children = [];
                parent.children.push(entity);
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

            const layer = this.world.layers.find(l => l._id === entity.layerId);
            if (layer) {
                layer.entities = layer.entities.filter(e => e._id !== targetId && e.id !== targetId);
            }
        };

        deleteRecursive(id);
    }

    // Helper: Mencegah Loop Circular (Bapak jadi anak dari anaknya)
    _isCircular(parentId, childId) {
        if (!parentId) return false;
        if (parentId === childId) return true;
        
        const parent = this._findEntityById(parentId);
        if (!parent) return false; // Parent tidak ketemu, aman (atau error lain)
        
        return this._isCircular(parent.parentId, childId);
    }

    onMoveEntity({ id, context }) {
        const entity = this._findEntityById(id);
        if (!entity) return;

        // [SAFETY] Cek Circular Reference sebelum memindahkan
        if (context.newParentId && this._isCircular(context.newParentId, id)) {
            console.warn(`[Sync] Blocked circular move: ${id} to ${context.newParentId}`);
            return;
        }

        // 1. DETACH: Hapus dari lokasi lama
        if (entity.parentId) {
            const oldParent = this._findEntityById(entity.parentId);
            if (oldParent && oldParent.children) {
                const idx = oldParent.children.findIndex(c => c === entity || c.id === entity.id);
                if (idx !== -1) oldParent.children.splice(idx, 1);
            }
        } else {
            const oldLayer = this.world.layers.find(l => l._id === entity.layerId);
            if (oldLayer) {
                const idx = oldLayer.entities.findIndex(e => e === entity || e.id === entity.id);
                if (idx !== -1) oldLayer.entities.splice(idx, 1);
            }
        }

        // 2. UPDATE INFO
        entity.layerId = context.newLayerId;
        entity.parentId = context.newParentId;

        // 3. TARGET ARRAY: Tentukan array tujuan
        let targetArray = null;

        if (context.newParentId) {
            const newParent = this._findEntityById(context.newParentId);
            if (newParent) {
                if (!newParent.children) newParent.children = [];
                targetArray = newParent.children;
            }
        } else {
            const newLayer = this.world.layers.find(l => l._id === context.newLayerId);
            if (newLayer) {
                targetArray = newLayer.entities;
            }
        }

        if (!targetArray) return;

        // 4. ATTACH: Masukkan ke posisi baru (Splicing)
        if (context.insertionType === 'append') {
            targetArray.push(entity);
        } else {
            const siblingIndex = targetArray.findIndex(e => (e._id || e.id) === context.referenceId);
            
            if (siblingIndex !== -1) {
                // after = index + 1, before = index
                const insertIndex = context.insertionType === 'after' ? siblingIndex + 1 : siblingIndex;
                targetArray.splice(insertIndex, 0, entity);
            } else {
                targetArray.push(entity);
            }
        }
    }

    _findEntityById(id) {
        for (const layer of this.world.layers) {
            for (const entity of layer.entities) {
                if (entity.id === id || entity._id === id) return entity;
                
                const found = this._findEntityRecursive(entity, id);
                if (found) return found;
            }
        }
        return null;
    }

    _findEntityRecursive(parent, id) {
        if (!parent.children) return null;
        for (const child of parent.children) {
            if (child.id === id || child._id === id) return child;
            const found = this._findEntityRecursive(child, id);
            if (found) return found;
        }
        return null;
    }

    onUpdateEntityName({ id, name }) {
        const entity = this._findEntityById(id);
        if (entity) entity.name = name;
    }

    onUpdateComponent({ entityId, componentName, path, value }) {
        const entity = this._findEntityById(entityId);
        if (!entity) return;

        let comp = entity.components[componentName];
        if (!comp) return;

        const keys = path.split('.');
        let target = comp;
        for (let i = 0; i < keys.length - 1; i++) {
            target = target[keys[i]];
        }
        target[keys[keys.length - 1]] = value;
    }

    onUpdateEntityProp({ entityId, propName, value }) {
        const entity = this._findEntityById(entityId);
        if (entity) entity[propName] = value;
    }

    async onAssetCreate(asset) {
        if (this.assetLoader) await this.assetLoader.loadAsset(this.world, [asset]);
    }

    onAssetDelete(id) {
        if (this.world.assets.textures[id]) delete this.world.assets.textures[id];
    }

    _createEntityInstance(data) {
        const entity = new Entity(data._id);
        entity.name = data.name;
        entity.type = data.type;
        entity.layerId = data.layerId;
        entity.parentId = data.parentId;
        entity.active = data.isActive;
        entity.visible = data.isVisible;
        entity.children = []; 
        
        if (data.components) {
            for (const [key, val] of Object.entries(data.components)) {
                entity.addComponent(key, val);
            }
        }
        return entity;
    }
}