import Entity from "../Core/Entity.js";
import { bus } from "../Util/EventBus.js";

export class EditorBridge {
    constructor(world, assetLoader) {
        this.world = world;
        this.assetLoader = assetLoader;

        this.handlers = {
            createEntity: (data) => this.onCreateEntity(data),
            deleteEntity: (id) => this.onDeleteEntity(id),
            updateEntityName: (p) => this.onUpdateEntityName(p),
            moveEntity: (p) => this.onMoveEntity(p),
            createLayer: (data) => this.onCreateLayer(data),
            deleteLayer: (id) => this.onDeleteLayer(id),
            updateLayerName: (p) => this.onUpdateLayerName(p),
            updateComponent: (p) => this.onUpdateComponent(p),
            updateEntityProp: (p) => this.onUpdateEntityProp(p),
            createAsset: (asset) => this.onAssetCreate(asset),
            deleteAsset: (id) => this.onAssetDelete(id)
        };

        this.bindEvents();
    }

    bindEvents() {
        bus.on("editor:entity:create", this.handlers.createEntity);
        bus.on("editor:entity:delete", this.handlers.deleteEntity);
        bus.on("editor:entity:update-name", this.handlers.updateEntityName);
        bus.on("editor:entity:move", this.handlers.moveEntity);
        bus.on("editor:layer:create", this.handlers.createLayer);
        bus.on("editor:layer:delete", this.handlers.deleteLayer);
        bus.on("editor:layer:update-name", this.handlers.updateLayerName);
        bus.on("editor:entity:update-component", this.handlers.updateComponent);
        bus.on("editor:entity:update-prop", this.handlers.updateEntityProp);
        bus.on("editor:asset:create", this.handlers.createAsset);
        bus.on("editor:asset:delete", this.handlers.deleteAsset);
    }

    destroy() {
        bus.off("editor:entity:create", this.handlers.createEntity);
        bus.off("editor:entity:delete", this.handlers.deleteEntity);
        bus.off("editor:entity:update-name", this.handlers.updateEntityName);
        bus.off("editor:entity:move", this.handlers.moveEntity);
        bus.off("editor:layer:create", this.handlers.createLayer);
        bus.off("editor:layer:delete", this.handlers.deleteLayer);
        bus.off("editor:layer:update-name", this.handlers.updateLayerName);
        bus.off("editor:entity:update-component", this.handlers.updateComponent);
        bus.off("editor:entity:update-prop", this.handlers.updateEntityProp);
        bus.off("editor:asset:create", this.handlers.createAsset);
        bus.off("editor:asset:delete", this.handlers.deleteAsset);
    }

    onCreateEntity(entityData) {
        const entity = this._createEntityInstance(entityData);
        this.world.addEntity(entity);

        if (entity.parentId) {
            const parent = this.world.entities.find((e) => e.id === entity.parentId);
            if (parent) parent.addChild(entity);
        }
    }

    onDeleteEntity(id) {
        const entity = this.world.entities.find((e) => e.id === id);
        if (!entity) return;

        if (entity.parentId) {
            const parent = this.world.entities.find((e) => e.id === entity.parentId);
            if (parent) parent.removeChild(entity.id);
        }

        if (this.world.removeEntity) {
            this.world.removeEntity(id);
        }
    }

    onUpdateEntityName({ id, name }) {
        const entity = this.world.entities.find((e) => e.id === id);
        if (entity) entity.name = name;
    }

    onMoveEntity({ id, context }) {
        const entity = this.world.entities.find((e) => e.id === id);
        if (!entity) return;

        if (entity.parentId) {
            const oldParent = this.world.entities.find((e) => e.id === entity.parentId);
            if (oldParent) oldParent.removeChild(id);
        }

        entity.layerId = context.newLayerId;
        entity.parentId = context.newParentId;

        if (context.newParentId) {
            const newParent = this.world.entities.find((e) => e.id === context.newParentId);
            if (newParent) newParent.addChild(entity);
        }
    }

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
        const entitiesToDelete = this.world.entities
            .filter((e) => e.layerId === id)
            .map((e) => e.id);

        entitiesToDelete.forEach((entityId) => {
            if (this.world.removeEntity) {
                this.world.removeEntity(entityId);
            }
        });

        this.world.layers = this.world.layers.filter((l) => l._id !== id);
    }

    onUpdateLayerName({ id, name }) {
        const layer = this.world.layers.find((l) => l._id === id);
        if (layer) layer.name = name;
    }

    _createEntityInstance(data) {
        const entity = new Entity(data._id);
        entity.name = data.name;
        entity.type = data.type;
        entity.tag = data.tag;
        entity.layerId = data.layerId;
        entity.parentId = data.parentId;
        entity.active = data.isActive;
        entity.visible = data.isVisible;
        entity._editor = data._editor || {};

        if (data.components) {
            for (const [key, val] of Object.entries(data.components)) {
                entity.addComponent(key, val);
            }
        }
        return entity;
    }

    onUpdateComponent({ entityId, componentName, path, value }) {
        const entity = this.world.entities.find((e) => e.id === entityId);
        if (!entity) return;

        let comp = entity.components[componentName] || entity[componentName];
        if (!comp && entity.getComponent) {
            comp = entity.getComponent(componentName);
        }
        if (!comp) return;

        const keys = path.split('.');
        let target = comp;
        for (let i = 0; i < keys.length - 1; i++) {
            target = target[keys[i]];
        }
        target[keys[keys.length - 1]] = value;

        if (entity.isDirty !== undefined) entity.isDirty = true;
    }

    onUpdateEntityProp({ entityId, propName, value }) {
        const entity = this.world.entities.find((e) => e.id === entityId);
        if (entity) {
            entity[propName] = value;
        }
    }

    async onAssetCreate(asset) {
        if (!this.assetLoader) return;
        await this.assetLoader.loadAsset(this.world, [asset]);
    }

    onAssetDelete(id) {
        if (this.world.assets.textures[id]) {
            delete this.world.assets.textures[id];
        }
    }
}