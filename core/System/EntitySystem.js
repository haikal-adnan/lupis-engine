import SceneLoader from "../Loader/SceneLoader.js";
import Config from "../Core/Config.js";

export default class EntitySystem {
    constructor(game) {
        this.game = game;
    }

    getEntity(targetId, ownerEntity = null) {
        if (!targetId || typeof targetId !== 'string' || targetId.trim().toLowerCase() === 'self') {
            return ownerEntity;
        }

        const searchKey = targetId.trim();
        const entities = this.game?.world?.entities || [];

        const found = entities.find(e => 
            e.id === searchKey || 
            e.scriptId === searchKey || 
            (e.name && e.name.toLowerCase() === searchKey.toLowerCase())
        );

        return found || null;
    }
    
    destroyEntity(entity) {
        const world = this.game.world;
        if (!entity || !world) return;

        const entityId = entity.id;

        const children = world.entities.filter(e => e.parentId === entityId);
        for (const child of children) {
            this.destroyEntity(child);
        }

        if (entity.parentId) {
            const parent = world.entities.find(e => e.id === entity.parentId);
            if (parent && Array.isArray(parent.children)) {
                parent.children = parent.children.filter(c => c.id !== entityId);
            }
        }

        if (world.scriptIdMap && entity.scriptId) {
            world.scriptIdMap.delete(entity.scriptId);
        }

        world.entities = world.entities.filter(e => e.id !== entityId);

        if (world.allLayers) {
            const layer = world.allLayers.find(l => l.id === entity.layerId);
            if (layer && Array.isArray(layer.entities)) {
                layer.entities = layer.entities.filter(e => e.id !== entityId);
            }
        }

        if (this.game.scriptSystem && typeof this.game.scriptSystem.removeEntityScripts === 'function') {
            this.game.scriptSystem.removeEntityScripts(entity);
        }
        if (this.game.physicsSystem && typeof this.game.physicsSystem.removeBody === 'function') {
            this.game.physicsSystem.removeBody(entity);
        }
        if (this.game.colliderSystem && typeof this.game.colliderSystem.removeCollider === 'function') {
            this.game.colliderSystem.removeCollider(entity);
        }
    }

    async cloneEntity(sourceEntity) {
        if (!sourceEntity) return null;

        const world = this.game.world;
        const clonedData = JSON.parse(JSON.stringify(sourceEntity));

        const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
        const newId = 'ent_clone_' + generateId();
        const newScriptId = 'script_clone_' + generateId();

        clonedData.id = newId;
        clonedData.scriptId = newScriptId;
        clonedData.children = [];

        const sceneLoader = new SceneLoader(world, Config.ENGINE_MODE);
        const entity = sceneLoader._createEntityInstance(clonedData);

        if (!entity) return null;

        world.addEntity(entity);
        if (world.scriptIdMap) {
            world.scriptIdMap.set(entity.scriptId, entity);
        }

        if (world.allLayers) {
            const layer = world.allLayers.find(l => l.id === entity.layerId);
            if (layer) {
                layer.entities.push(entity);
                layer.entities.sort((a, b) => {
                    if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
                    return a.orderIndex - b.orderIndex;
                });
            }
        }

        if (entity.parentId) {
            const parent = world.entities.find(e => e.id === entity.parentId);
            if (parent) parent.addChild(entity);
        }

        if (Config.ENGINE_MODE === "runtime") {
            this.initializeSingleEntityScript(entity);
        }

        return entity;
    }

    initializeSingleEntityScript(entity) {
        const controller = entity.components?.ScriptController;
        if (!Array.isArray(controller?.data)) return;

        controller.data.forEach(instance => {
            const asset = this.game.world.scripts[instance.assetId];
            if (asset) {
                const instanceVars = instance.variables || {};
                const mergedVars = asset.variables.map(v => ({
                    ...v,
                    defaultValue: instanceVars[v.id] !== undefined ? instanceVars[v.id] : v.defaultValue
                }));

                const newScriptData = { ...asset, variables: mergedVars };
                this.game.scriptSystem.add(newScriptData, entity);

                const newRunner = this.game.scriptSystem.runners[this.game.scriptSystem.runners.length - 1];
                if (newRunner) {
                    newRunner.start();
                }
            }
        });
    }
}