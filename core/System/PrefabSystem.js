import SceneLoader from "../Loader/SceneLoader.js";
import Config from "../Core/Config.js";
import { GenerateUUID } from "../Util/GenerateUUID.js";

export default class PrefabSystem {
    constructor(game) {
        this.game = game;
    }

    initLibrary(prefabs) {
        if (!Array.isArray(prefabs)) return;
        this.game.world.prefabs = Object.fromEntries(prefabs.map(p => [p.id, {
            id: p.id,
            name: p.name,
            data: p.data,
            children: p.children || []
        }]));
    }

    spawnPrefab(prefabIdentifier, posX = 0, posY = 0, layerScriptId = "", zIndex = 0, customScriptId = "") {
        const world = this.game.world;
        if (!world.prefabs) return null;

        let prefabData = null;
        let prefabChildren = [];

        for (const key in world.prefabs) {
            const p = world.prefabs[key];
            if (p.id === prefabIdentifier || p.name === prefabIdentifier) {
                prefabData = p.data;
                prefabChildren = p.children || [];
                break;
            }
        }

        if (!prefabData) return null;

        let targetLayerId = "layer_w_root";
        let targetLayer = null;
        if (world.allLayers) {
            if (layerScriptId) targetLayer = world.allLayers.find(l => l.scriptId === layerScriptId);
            if (!targetLayer) targetLayer = world.allLayers.find(l => l.id === targetLayerId);
            if (targetLayer) targetLayerId = targetLayer.id;
        }

        let baseOrderIndex = 0;
        if (targetLayer && targetLayer.entities) {
            baseOrderIndex = targetLayer.entities.reduce((max, e) => Math.max(max, e.orderIndex || 0), -1);
        }

        let finalRootScriptId = 'script_' + GenerateUUID(16);

        if (typeof customScriptId === 'string' && customScriptId.trim() !== "") {
            let sanitizedId = customScriptId.toLowerCase().replace(/[^a-z0-9_]/g, '');

            if (sanitizedId !== '') {
                let isIdExist = false;
                if (world.scriptIdMap) {
                    isIdExist = world.scriptIdMap.has(sanitizedId);
                } else {
                    isIdExist = world.entities.some(e => e.scriptId === sanitizedId);
                }

                if (!isIdExist) {
                    finalRootScriptId = sanitizedId;
                } else {
                    console.warn(`[PrefabSystem] Script ID '${sanitizedId}' already exists. Generating random ID.`);
                }
            }
        }

        const idMap = {};
        const allNewData = [];
        const uniqueSuffix = GenerateUUID(16).substring(0, 8);

        const rootData = JSON.parse(JSON.stringify(prefabData));
        const newRootId = 'ent_' + GenerateUUID(16);
        idMap[rootData.id] = newRootId;

        baseOrderIndex++;

        rootData.id = newRootId;
        rootData.scriptId = finalRootScriptId;
        rootData.layerId = targetLayerId;
        rootData.zIndex = zIndex;
        rootData.orderIndex = baseOrderIndex;
        rootData.parentId = null;

        if (rootData.components?.Transform) {
            rootData.components.Transform.x = posX;
            rootData.components.Transform.y = posY;
        } else if (rootData.components?.UITransform) {
            rootData.components.UITransform.x = posX;
            rootData.components.UITransform.y = posY;
        }
        allNewData.push(rootData);

        if (prefabChildren && prefabChildren.length > 0) {
            const clonedChildren = prefabChildren.map(child => {
                const c = JSON.parse(JSON.stringify(child));
                const newChildId = 'ent_' + GenerateUUID(16);

                idMap[c.id] = newChildId;
                baseOrderIndex++;

                c.id = newChildId;
                c.scriptId = `${c.scriptId}_${uniqueSuffix}`;
                c.layerId = targetLayerId;
                c.zIndex = zIndex;
                c.orderIndex = baseOrderIndex;
                return c;
            });

            clonedChildren.forEach(c => {
                c.parentId = idMap[c.parentId] || newRootId;
            });
            allNewData.push(...clonedChildren);
        }

        const sceneLoader = new SceneLoader(world, Config.ENGINE_MODE);
        const createdEntities = new Map();
        let rootEntity = null;

        for (const data of allNewData) {
            const entity = sceneLoader._createEntityInstance(data);
            if (!entity) continue;

            if (data.id === newRootId) rootEntity = entity;
            createdEntities.set(entity.id, entity);

            world.addEntity(entity);
            if (world.scriptIdMap && entity.scriptId) world.scriptIdMap.set(entity.scriptId, entity);
            if (targetLayer) targetLayer.entities.push(entity);
        }

        for (const entity of createdEntities.values()) {
            if (!entity.parentId) continue;
            let parent = createdEntities.get(entity.parentId) || world.entities.find(e => e.id === entity.parentId);

            if (parent) {
                if (typeof parent.addChild === 'function') parent.addChild(entity);
                else {
                    if (!parent.children) parent.children = [];
                    if (!parent.children.find(c => c.id === entity.id)) parent.children.push(entity);
                }
            }
        }

        if (targetLayer) {
            targetLayer.entities.sort((a, b) => {
                if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
                return (a.orderIndex || 0) - (b.orderIndex || 0);
            });
        }

        if (Config.ENGINE_MODE === "runtime") {
            for (const entity of createdEntities.values()) {
                this.game.entitySystem.initializeSingleEntityScript(entity);
            }
        }

        return rootEntity;
    }
}