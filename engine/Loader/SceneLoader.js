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

        // 2. Load Layers
        const parseLayers = (layers, defaultName, defaultZ) => {
            if (Array.isArray(layers) && layers.length > 0) {
                return layers.map((layer, index) => ({
                    _id: layer._id,
                    scriptId: layer.scriptId, 
                    name: layer.name,
                    visible: layer.visible ?? true,
                    locked: layer.locked ?? false,
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

        // Phase C: Initial Sort
        this.world.allLayers.forEach(layer => {
            if(layer.entities.length > 0) {
                layer.entities.sort((a, b) => {
                    if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
                    return a.orderIndex - b.orderIndex;
                });
            }
        });
    }

    _createEntityInstance(instanceData) {
        let finalData = instanceData;

        // --- PREFAB MERGE LOGIC ---
        // Jika entity memiliki prefabId, kita gabungkan data dari Master Prefab
        if (instanceData.prefabId) {
            const prefab = this.world.prefabs?.[instanceData.prefabId];
            if (prefab) {
                // instanceData adalah data yang tersimpan di Scene (berisi override)
                // prefab.data adalah data Master (default)
                finalData = this._mergePrefabData(prefab.data, instanceData);
            }
        }

        const entity = new Entity(finalData._id);

        entity.scriptId = finalData.scriptId; 
        entity.name = finalData.name;
        entity.type = finalData.type;
        entity.tag = finalData.tag;
        entity.layerId = finalData.layerId;
        entity.parentId = finalData.parentId;

        entity.zIndex = Number(finalData.zIndex ?? 0);
        entity.orderIndex = Number(finalData.orderIndex ?? 0);

        entity.active = finalData.isActive ?? true;
        entity.visible = finalData.isVisible ?? true;
        entity.prefabId = finalData.prefabId;
        
        // Simpan flag override agar editor tahu statusnya
        entity.isOverridden = finalData.isOverridden ?? false;

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
        
        const isRootOverridden = instance.isOverridden === true;

        if (isRootOverridden) {
            merged.tag = instance.tag;
            merged.isActive = instance.isActive;
            merged.zIndex = instance.zIndex ?? merged.zIndex;
            merged.orderIndex = instance.orderIndex ?? merged.orderIndex;
        } 

        merged.components ??= {};
        const instanceComps = instance.components || {};

        for (const [key, compData] of Object.entries(instanceComps)) {
            const isCompOverridden = compData.isOverridden === true;
            
            if (isCompOverridden) {
                merged.components[key] = { ...compData }; 
            } else {
                if (merged.components[key]) {
                    if (key === "Transform" || key === "UITransform") {
                        if (compData.x !== undefined) merged.components[key].x = compData.x;
                        if (compData.y !== undefined) merged.components[key].y = compData.y;
                        if (compData.rotation !== undefined) merged.components[key].rotation = compData.rotation;
                    }
                } else {
                    merged.components[key] = { ...compData };
                }
            }
        }

        return merged;
    }
}