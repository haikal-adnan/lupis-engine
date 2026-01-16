import Entity from "../Core/Entity.js";

export default class SceneLoader {
    constructor(world, mode) {
        this.world = world;
        this.mode = mode;
    }

    loadScene(sceneData) {
        if (!sceneData) return;

        // ... (Bagian Layers tetap sama) ...
        if (Array.isArray(sceneData.layers)) {
            this.world.layers = sceneData.layers.map(layer => ({
                _id: layer._id,
                name: layer.name,
                visible: layer.visible ?? true,
                locked: layer.locked ?? false,
                entities: []
            }));
        } else {
            this.world.layers = [{ _id: "layer_root", name: "Root", visible: true, locked: false, entities: [] }];
        }

        if (!Array.isArray(sceneData.entities)) return;

        this.world.entities = [];
        
        // OPTIONAL: Reset Map Script ID di World (untuk pencarian cepat)
        if (this.world.scriptIdMap) this.world.scriptIdMap.clear();

        const createdEntities = new Map();

        for (const entityData of sceneData.entities) {
            const entity = this._createEntityInstance(entityData);
            if (!entity) continue;

            createdEntities.set(entity.id, entity);
            this.world.addEntity(entity);
            
            // OPTIONAL: Simpan ke Map khusus untuk performa logic
            if (this.world.scriptIdMap && entity.scriptId) {
                this.world.scriptIdMap.set(entity.scriptId, entity);
            }
        }

        // ... (Bagian Parent-Child linking tetap sama) ...
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

        // === 1. SIMPAN SCRIPT ID DI SINI ===
        entity.scriptId = finalData.scriptId; 
        
        entity.name = finalData.name;
        entity.type = finalData.type;
        entity.tag = finalData.tag;
        entity.layerId = finalData.layerId;
        entity.parentId = finalData.parentId;

        entity.active = finalData.isActive;
        entity.visible = finalData.isVisible;
        entity.prefabId = finalData.prefabId;

        if(this.mode == "editor") entity._editor = finalData._editor;

        for (const [key, val] of Object.entries(finalData.components)) {
            entity.addComponent(key, val);
        }

        return entity;
    }

    _mergePrefabData(template, instance) {
        const merged = structuredClone(template);

        // === 2. PASTIKAN INSTANCE MENG-OVERRIDE SCRIPT ID PREFAB ===
        // Karena scriptId harus unik per scene, kita pakai yang dari instance
        merged._id = instance._id;
        merged.scriptId = instance.scriptId; // <--- Penting!
        
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