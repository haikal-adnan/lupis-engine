import Entity from "../Core/Entity.js";

export default class SceneLoader {
    constructor(world, mode) {
        this.world = world;
        this.mode = mode;
    }

    loadScene(sceneData) {
        if (!sceneData) return;

        // 1. Load Global Settings
        if (this.world) {
            this.world.currentSceneScriptId = sceneData.scriptId;
            if (sceneData.settings) {
                this.world.settings = { ...this.world.settings, ...sceneData.settings };
            }
        }

        // 2. Load Layers (World & UI Split)
        const parseLayers = (layers, defaultName, defaultZ) => {
            if (Array.isArray(layers) && layers.length > 0) {
                return layers.map((layer, index) => ({
                    _id: layer._id,
                    scriptId: layer.scriptId, 
                    name: layer.name,
                    visible: layer.visible ?? true,
                    locked: layer.locked ?? false,
                    // Load Sorting Props
                    zIndex: Number(layer.zIndex ?? defaultZ), 
                    orderIndex: Number(layer.orderIndex ?? index),
                    entities: []
                }));
            }
            return [];
        };

        this.world.layersWorld = parseLayers(sceneData.layersWorld, "World Root", 0);
        this.world.layersUI = parseLayers(sceneData.layersUI, "UI Root", 100);

        // Fallback: Create default layers if empty
        if (this.world.layersWorld.length === 0) {
            this.world.layersWorld.push({ 
                _id: "layer_w_root", scriptId: "root_w", name: "World Root", 
                visible: true, locked: false, zIndex: 0, orderIndex: 0, entities: [] 
            });
        }
        if (this.world.layersUI.length === 0) {
            this.world.layersUI.push({ 
                _id: "layer_ui_root", scriptId: "root_ui", name: "UI Root", 
                visible: true, locked: false, zIndex: 100, orderIndex: 0, entities: [] 
            });
        }

        // 3. Load Entities
        if (!Array.isArray(sceneData.entities)) return;

        this.world.entities = [];
        if (this.world.scriptIdMap) this.world.scriptIdMap.clear();

        const createdEntities = new Map();

        // Phase A: Instantiation
        for (const entityData of sceneData.entities) {
            const entity = this._createEntityInstance(entityData);
            if (!entity) continue;

            createdEntities.set(entity.id, entity);
            this.world.addEntity(entity);
            
            if (this.world.scriptIdMap && entity.scriptId) {
                this.world.scriptIdMap.set(entity.scriptId, entity);
            }
        }

        // Phase B: Hierarchy & Parenting
        for (const entity of createdEntities.values()) {
            if (!entity.parentId) continue;

            const parent = createdEntities.get(entity.parentId);
            if (parent) {
                parent.addChild(entity);
            } else {
                entity.parentId = null; // Orphaned
            }
        }

        // Phase C: Initial Sort (Prevent visual popping)
        this.world.allLayers.forEach(layer => {
            if(layer.entities.length > 0) {
                layer.entities.sort((a, b) => {
                     // Sort by Z-Index first
                     if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
                     // Then by Order Index
                     return a.orderIndex - b.orderIndex;
                });
            }
        });
    }

    _createEntityInstance(entityData) {
        let finalData = entityData;

        // Merge Prefab Data
        if (entityData.prefabId) {
            const prefab = this.world.prefabs?.[entityData.prefabId];
            if (prefab) {
                finalData = this._mergePrefabData(prefab.data, entityData);
            }
        }

        const entity = new Entity(finalData._id);

        entity.scriptId = finalData.scriptId; 
        entity.name = finalData.name;
        entity.type = finalData.type;
        entity.tag = finalData.tag;
        entity.layerId = finalData.layerId;
        entity.parentId = finalData.parentId;

        // NEW: Sorting Properties
        entity.zIndex = Number(finalData.zIndex ?? 0);
        entity.orderIndex = Number(finalData.orderIndex ?? 0);

        entity.active = finalData.isActive ?? true;
        entity.visible = finalData.isVisible ?? true;
        entity.prefabId = finalData.prefabId;

        if(this.mode == "editor") entity._editor = finalData._editor;

        if (finalData.components) {
            for (const [key, val] of Object.entries(finalData.components)) {
                entity.addComponent(key, val);
            }
        }

        return entity;
    }

    _mergePrefabData(template, instance) {
        const merged = structuredClone(template);

        merged._id = instance._id;
        merged.scriptId = instance.scriptId; 
        merged.name = instance.name;
        merged.parentId = instance.parentId;
        merged.layerId = instance.layerId;
        merged.prefabId = instance.prefabId;
        
        // Instance overrides Prefab zIndex/orderIndex
        merged.zIndex = instance.zIndex ?? merged.zIndex;
        merged.orderIndex = instance.orderIndex ?? merged.orderIndex;

        merged.isActive = instance.isActive;
        merged.isVisible = instance.isVisible;

        merged.components ??= {};

        if (instance.components) {
            for (const [key, val] of Object.entries(instance.components)) {
                merged.components[key] = merged.components[key]
                    ? { ...merged.components[key], ...val }
                    : val;
            }
        }

        return merged;
    }
}