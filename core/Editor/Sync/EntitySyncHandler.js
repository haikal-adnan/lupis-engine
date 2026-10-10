import Entity from "../../Core/Entity.js";
import { ApplyResizeToEntity } from "../../Util/ApplyResizeToEntity.js";

export class EntitySyncHandler {
    constructor(syncContext) {
        this.ctx = syncContext; // Memegang referensi { world, game }
    }

    onCreateEntity(data) {
        if (Array.isArray(data)) {
            data.forEach(item => this._processSingleEntityCreation(item));
        } else {
            this._processSingleEntityCreation(data);
        }
    }

    _processSingleEntityCreation(entityData) {
        const safeData = { ...entityData };
        const entity = this._createEntityInstance(safeData);
        if (this._findEntityById(entityData.id)) return;

        const layer = this._findLayer(entity.layerId);

        if (layer) {
            layer.entities.push(entity);
            this.ctx._sortContainer(layer.entities);
        }
    }

    onDeleteEntity(id) {
        const allLayers = [...this.ctx.world.layersWorld, ...this.ctx.world.layersUI];
        for (const layer of allLayers) {
            if (!layer.entities) continue;
            const idx = layer.entities.findIndex(e => e.id === id);
            if (idx !== -1) {
                layer.entities.splice(idx, 1);
                return;
            }
        }
    }

    onUpdateEntityName({ id, name }) {
        const e = this._findEntityById(id);
        if (e) e.name = name;
    }

    onMoveEntity({ id, layerId, parentId }) {
        if (this.ctx.isInternalUpdate) return;

        const entity = this._findEntityById(id);
        if (!entity) return;

        const newLayer = this._findLayer(layerId);
        if (!newLayer) return;

        this.ctx.isInternalUpdate = true;
        this._removeEntityFromCurrentContainer(entity);

        entity.layerId = layerId;
        entity.parentId = parentId !== undefined ? parentId : null;

        newLayer.entities.push(entity);
        this.ctx._sortContainer(newLayer.entities);
        this.ctx.isInternalUpdate = false;
    }

    onUpdateComponent({ entityId, componentName, path, value }) {
        const e = this._findEntityById(entityId);
        if (!e?.components?.[componentName]) return;

        const c = e.components[componentName];
        const keys = path.split(".");
        let target = c;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!target[keys[i]]) target[keys[i]] = {};
            target = target[keys[i]];
        }

        target[keys[keys.length - 1]] = value;

        this.ctx.isInternalUpdate = true;
        if (
            (componentName === "Transform" || componentName === "UITransform") ||
            (componentName === "TextRenderer" && ["fontSize", "value", "assetId", "lockRatio"].includes(path))
        ) {
            ApplyResizeToEntity(e, this.ctx.world, true);
        }
        this.ctx.isInternalUpdate = false;
    }

    onPatchComponent({ entityId, componentName, updates }) {
        const e = this._findEntityById(entityId);
        if (!e) return;

        if (!e.components) e.components = {};

        if (!e.components[componentName]) {
            e.addComponent(componentName, updates);
        } else {
            const c = e.components[componentName];
            
            // 1. Assign seluruh properti dasar (color, isFilled, opacity, dll)
            Object.assign(c, updates);

            // 2. Lakukan deep copy untuk array khusus agar referensi aman
            if (updates.data && Array.isArray(updates.data)) {
                c.data = JSON.parse(JSON.stringify(updates.data));
            }
            if (updates.elements && Array.isArray(updates.elements)) {
                c.elements = JSON.parse(JSON.stringify(updates.elements));
            }
        }
        
        // 3. Mark dirty & panggil resize/bounds update jika diperlukan
        e.isDirty = true;
        if (typeof ApplyResizeToEntity === 'function') {
            ApplyResizeToEntity(e, this.ctx.world, true);
        }
    }
    
    onAddComponent({ entityId, componentName, data }) {
        const e = this._findEntityById(entityId);
        if (e) e.addComponent(componentName, data);
    }

    onRemoveComponent({ entityId, componentName }) {
        const e = this._findEntityById(entityId);
        if (e?.components) delete e.components[componentName];
    }

    onUpdateEntityProp({ id, prop, value }) {
        const e = this._findEntityById(id);
        if (!e) return;

        e[prop] = value;
        if (prop === "visible") e.visible = value;
        if (prop === "active") e.active = value;

        if (prop === "zIndex" || prop === "orderIndex") {
            const layer = this._findLayer(e.layerId);
            if (layer?.entities) this.ctx._sortContainer(layer.entities);
        }
    }

    onEntityReplace(entitiesData) {
        const entities = Array.isArray(entitiesData) ? entitiesData : [entitiesData];

        entities.forEach(newData => {
            const entity = this._findEntityById(newData.id);
            if (!entity) return;

            entity.prefabId = newData.prefabId;
            entity.name = newData.name;
            if (newData.overridden !== undefined) entity.overridden = newData.overridden;

            entity.components = {};
            if (newData.components) {
                for (const [key, value] of Object.entries(newData.components)) {
                    if (typeof entity.addComponent === 'function') {
                        entity.addComponent(key, value);
                    } else {
                        entity.components[key] = value;
                    }
                }
            }
            ApplyResizeToEntity(entity, this.ctx.world, true);
        });
    }

    _createEntityInstance(data) {
        const e = new Entity(data.id);
        Object.assign(e, {
            name: data.name,
            type: data.type,
            layerId: data.layerId,
            parentId: data.parentId || null,
            active: data.active,
            visible: data.visible,
            zIndex: data.zIndex ?? 0,
            orderIndex: data.orderIndex ?? 0,
            children: []
        });

        if (data.components) {
            for (const [k, v] of Object.entries(data.components)) {
                e.addComponent(k, v);
            }
        }
        return e;
    }

    _findEntityById(id) {
        return this.ctx._findEntityById(id);
    }

    _findLayer(layerId) {
        return this.ctx.world.layersWorld.find(l => l.id === layerId) ||
               this.ctx.world.layersUI.find(l => l.id === layerId);
    }

    _removeEntityFromCurrentContainer(entity) {
        const oldLayer = this._findLayer(entity.layerId);
        if (oldLayer?.entities) {
            const idx = oldLayer.entities.indexOf(entity);
            if (idx !== -1) oldLayer.entities.splice(idx, 1);
        }
    }
}