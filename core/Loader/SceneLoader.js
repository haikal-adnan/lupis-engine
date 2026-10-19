import Entity from "../Core/Entity.js";

export default class SceneLoader {
    constructor(world, mode) {
        this.world = world;
        this.mode = mode;
    }

    loadScene(sceneData) {
        if (!sceneData) return;

        if (this.world) {
            this.world.currentSceneId = sceneData.id; 
            this.world.currentSceneScriptId = sceneData.scriptId || sceneData.id || null;
            
            if (sceneData.settings) {
                this.world.settings = { ...this.world.settings, ...sceneData.settings };
            }
        }

        const parseLayers = (layers, defaultZ) => {
            if (Array.isArray(layers) && layers.length > 0) {
                return layers.map((layer, index) => ({
                    id: layer.id,
                    scriptId: layer.scriptId, 
                    visible: layer.visible ?? true,
                    locked: layer.locked ?? false,
                    active: layer.active ?? true,
                    opacity: layer.opacity ?? 1.0, 
                    zIndex: Number(layer.zIndex ?? defaultZ), 
                    orderIndex: Number(layer.orderIndex ?? index),
                    entities: []
                }));
            }
            return [];
        };

        this.world.layersWorld = parseLayers(sceneData.layersWorld, 0);
        this.world.layersUI = parseLayers(sceneData.layersUI, 100);

        if (this.world.layersWorld.length === 0) {
            this.world.layersWorld.push({ 
                id: "layer_w_root", scriptId: "root_w", 
                visible: true, locked: false, zIndex: 0, orderIndex: 0, entities: [] 
            });
        }
        if (this.world.layersUI.length === 0) {
            this.world.layersUI.push({ 
                id: "layer_ui_root", scriptId: "root_ui", 
                visible: true, locked: false, zIndex: 100, orderIndex: 0, entities: [] 
            });
        }

        if (!Array.isArray(sceneData.entities)) return;

        this.world.entities = [];
        if (this.world.scriptIdMap) this.world.scriptIdMap.clear();

        const createdEntities = new Map();

        for (const entityData of sceneData.entities) {
            const entity = this._createEntityInstance(entityData);
            if (!entity) continue;

            createdEntities.set(entity.id, entity);
            this.world.addEntity(entity);
            
            if (this.world.scriptIdMap && entity.scriptId) {
                this.world.scriptIdMap.set(entity.scriptId, entity);
            }
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

        if (instanceData.prefabId) {
            const prefab = this.world.prefabs?.[instanceData.prefabId];
            if (prefab) {
                let template = null;

                if (prefab.children && prefab.children.length > 0) {
                    template = prefab.children.find(c => c.scriptId === instanceData.scriptId);
                }

                if (!template) {
                    template = prefab.data;
                }

                if (template) {
                    finalData = this._mergePrefabData(template, instanceData);
                }
            }
        }

        const entity = new Entity(finalData.id);

        entity.scriptId = finalData.scriptId; 
        entity.type = finalData.type;
        entity.tag = finalData.tag;
        entity.layerId = finalData.layerId;
        entity.parentId = finalData.parentId;

        entity.zIndex = Number(finalData.zIndex ?? 0);
        entity.orderIndex = Number(finalData.orderIndex ?? 0);

        entity.active = finalData.active ?? true;
        entity.visible = finalData.visible ?? true;
        entity.locked = finalData.locked ?? false;
        entity.prefabId = finalData.prefabId;
        
        entity.overridden = finalData.overridden ?? false;

        if(this.mode == "editor") entity._editor = finalData._editor;

        if (finalData.components) {
            for (const [key, val] of Object.entries(finalData.components)) {
                entity.addComponent(key, val);
            }
            if (entity.components.UITransform) {
                const ut = entity.components.UITransform;
                if (typeof ut._baseWidth !== 'number' && typeof ut.width === 'number') ut._baseWidth = ut.width;
                if (typeof ut._baseHeight !== 'number' && typeof ut.height === 'number') ut._baseHeight = ut.height;
                if (typeof ut._baseX !== 'number' && typeof ut.x === 'number') ut._baseX = ut.x;
                if (typeof ut._baseY !== 'number' && typeof ut.y === 'number') ut._baseY = ut.y;
            }
            if (entity.components.SpriteRenderer) {
                const sr = entity.components.SpriteRenderer;
                if (typeof sr._baseSourceWidth !== 'number' && typeof sr.sourceWidth === 'number') sr._baseSourceWidth = sr.sourceWidth;
                if (typeof sr._baseSourceHeight !== 'number' && typeof sr.sourceHeight === 'number') sr._baseSourceHeight = sr.sourceHeight;
                if (typeof sr._baseSourceX !== 'number' && typeof sr.sourceX === 'number') sr._baseSourceX = sr.sourceX;
                if (typeof sr._baseSourceY !== 'number' && typeof sr.sourceY === 'number') sr._baseSourceY = sr.sourceY;
            }
            if (entity.components.ShapeRenderer) {
                const sh = entity.components.ShapeRenderer;
                if (typeof sh._baseWidth !== 'number' && typeof sh.width === 'number') sh._baseWidth = sh.width;
                if (typeof sh._baseHeight !== 'number' && typeof sh.height === 'number') sh._baseHeight = sh.height;
            }
        }

        return entity;
    }

    _mergePrefabData(template, instance) {
        const merged = JSON.parse(JSON.stringify(template));

        merged.id = instance.id;
        merged.scriptId = instance.scriptId || template.scriptId; 
        merged.parentId = instance.parentId;
        merged.layerId = instance.layerId;
        merged.prefabId = instance.prefabId;
        merged.tag = instance.tag;
        merged.active = instance.active;
        merged.visible = instance.visible;
        merged.locked = instance.locked;
        merged.zIndex = instance.zIndex;
        merged.orderIndex = instance.orderIndex;
        
        merged.components ??= {};
        const instanceComps = instance.components || {};

        for (const [key, compData] of Object.entries(instanceComps)) {
            const isCompOverridden = compData.overridden === true;
            
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