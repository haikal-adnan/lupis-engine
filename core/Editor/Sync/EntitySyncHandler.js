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
            }
            const childIndices = [];
            layer.entities.forEach((e, i) => {
                if (e.parentId === id) childIndices.push(i);
            });
            for (let i = childIndices.length - 1; i >= 0; i--) {
                const childId = layer.entities[childIndices[i]].id;
                layer.entities.splice(childIndices[i], 1);
                this.onDeleteEntity(childId);
            }
        }
    }

    onUpdateEntityScriptId({ id, scriptId }) {
        const e = this._findEntityById(id);
        if (e && scriptId) {
            e.scriptId = scriptId;
        }
    }

    onMoveEntity({ id, layerId, parentId }) {
        if (this.ctx.isInternalUpdate) return;

        const entity = this._findEntityById(id);
        if (!entity) return;

        const newLayer = this._findLayer(layerId);
        if (!newLayer) return;

        this.ctx.isInternalUpdate = true;
        this._removeEntityFromCurrentContainer(entity);

        if (entity.parentId) {
            const oldParent = this._findEntityById(entity.parentId);
            if (oldParent && Array.isArray(oldParent.children)) {
                oldParent.children = oldParent.children.filter(c => c.id !== entity.id);
            }
        }

        entity.layerId = layerId;
        entity.parentId = parentId !== undefined ? parentId : null;

        if (entity.parentId) {
            const newParent = this._findEntityById(entity.parentId);
            if (newParent && typeof newParent.addChild === 'function') {
                newParent.addChild(entity);
            }
        }

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
        e.isDirty = true;

        const isTextLayoutProp = componentName === "TextRenderer" && [
            "fontSize", "value", "assetId", "lockRatio", "autoFit",
            "maxWidth", "maxLine", "autoLine", "lineSpacing", "letterSpacing", "overflow", "align", "alignLine"
        ].includes(path);

        const oldH = (componentName === "Transform" || componentName === "UITransform" || e.components?.TextRenderer) 
            ? (e.components?.Transform?.height ?? e.components?.UITransform?.height) 
            : undefined;

        this.ctx.isInternalUpdate = true;
        if (
            (componentName === "Transform" || componentName === "UITransform") ||
            isTextLayoutProp
        ) {
            ApplyResizeToEntity(e, this.ctx.world, true);
        }
        this.ctx.isInternalUpdate = false;

        const newH = (e.components?.Transform?.height ?? e.components?.UITransform?.height);

        if (oldH !== undefined && newH !== undefined && oldH !== newH) {
            this.ctx.bus.emit("entity:modified", [e]);
        }
    }

    onPatchComponent({ entityId, componentName, updates }) {
        const e = this._findEntityById(entityId);
        if (!e) return;

        if (!e.components) e.components = {};

        if (!e.components[componentName]) {
            e.addComponent(componentName, updates);
        } else {
            const c = e.components[componentName];
            
            // 1. Assign all base properties (color, isFilled, opacity, etc.)
            Object.assign(c, updates);

            // 2. Perform deep copy for specialized arrays to ensure safe references
            if (updates.data && Array.isArray(updates.data)) {
                c.data = JSON.parse(JSON.stringify(updates.data));
            }
            if (updates.elements && Array.isArray(updates.elements)) {
                c.elements = JSON.parse(JSON.stringify(updates.elements));
            }
        }
        
        const oldH = (e.components?.Transform?.height ?? e.components?.UITransform?.height);

        // 3. Mark dirty & call resize/bounds update if needed
        e.isDirty = true;
        if (typeof ApplyResizeToEntity === 'function') {
            this.ctx.isInternalUpdate = true;
            ApplyResizeToEntity(e, this.ctx.world, true);
            this.ctx.isInternalUpdate = false;
        }

        const newH = (e.components?.Transform?.height ?? e.components?.UITransform?.height);
        if (componentName === "TextRenderer" && oldH !== undefined && newH !== undefined && oldH !== newH) {
            this.ctx.bus.emit("entity:modified", [e]);
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
            entity.scriptId = newData.scriptId || entity.scriptId;
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
        const scriptId = data.scriptId || "Entity";
        Object.assign(e, {
            scriptId: scriptId,
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