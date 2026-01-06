import Entity from "../Core/Entity.js";

export default class SceneLoader {
    constructor(world) {
        this.world = world;
    }

    loadScene(sceneData) {
        if (!sceneData || !Array.isArray(sceneData.entities)) return;

        this.world.entities = [];
        this.world.layers.forEach(l => (l.entities = []));

        const createdEntities = new Map();

        for (const entityData of sceneData.entities) {
            const entity = this._createEntityInstance(entityData);
            if (!entity) continue;

            createdEntities.set(entity.id, entity);
            this.world.addEntity(entity);
        }

        for (const entity of createdEntities.values()) {
            if (!entity.parentId) continue;

            const parent = createdEntities.get(entity.parentId);
            if (parent) {
                parent.addChild(entity);
            } else {
                entity.parentId = null;
            }
        }
    }

    _createEntityInstance(entityData) {
        let finalData = entityData;

        if (entityData.prefabId) {
            const prefab = this.world.prefabs?.[entityData.prefabId];
            if (prefab) {
                finalData = this._mergePrefabData(prefab.data, entityData);
            }
        }

        const entity = new Entity(finalData._id);

        entity.name = finalData.name;
        entity.type = finalData.type;
        entity.tag = finalData.tag;
        entity.layerId = finalData.layerId;
        entity.parentId = finalData.parentId;

        entity.active = finalData.isActive;
        entity.visible = finalData.isVisible;
        entity.prefabId = finalData.prefabId;

        for (const [key, val] of Object.entries(finalData.components)) {
            entity.addComponent(key, val);
        }

        return entity;
    }

    _mergePrefabData(template, instance) {
        const merged = structuredClone(template);

        merged._id = instance._id;
        merged.name = instance.name;
        merged.parentId = instance.parentId;
        merged.layerId = instance.layerId;
        merged.prefabId = instance.prefabId;
        merged.isActive = instance.isActive;
        merged.isVisible = instance.isVisible;

        merged.components ??= {};

        for (const [key, val] of Object.entries(instance.components)) {
            merged.components[key] = merged.components[key]
                ? { ...merged.components[key], ...val }
                : val;
        }

        return merged;
    }
}
