import SceneLoader from "../Loader/SceneLoader.js";
import Config from "../Core/Config.js";

export default class EntitySystem {
    constructor(game) {
        this.game = game;
    }

    getEntity(targetId, ownerEntity = null) {
        if (!targetId) return ownerEntity;
        if (typeof targetId === 'object') {
            return targetId;
        }
        if (typeof targetId !== 'string' || targetId.trim().toLowerCase() === 'self') {
            return ownerEntity;
        }

        const searchKey = targetId.trim();
        const searchLower = searchKey.toLowerCase();
        const searchSlug = searchLower.replace(/\s+/g, '_');
        const entities = this.game?.world?.entities || [];

        const found = entities.find(e => 
            e.id === searchKey || 
            (e.scriptId && (e.scriptId.toLowerCase() === searchLower || e.scriptId.toLowerCase() === searchSlug))
        );

        return found || null;
    }
    
    destroyEntity(target) {
        const world = this.game?.world;
        if (!target || !world) return;

        let entity = target;
        if (typeof target === 'string') {
            entity = this.getEntity(target) || (world.entities ? world.entities.find(e => e.id === target) : null);
        }
        if (!entity || !entity.id) return;

        // Mark as destroyed so script runners, cameras, and external systems immediately stop
        entity._isDestroyed = true;

        const entityId = entity.id;

        // Cascade destroy children from world.entities
        const children = (world.entities || []).filter(e => e.parentId === entityId);
        for (const child of children) {
            if (!child._isDestroyed) {
                this.destroyEntity(child);
            }
        }

        // Also cascade destroy from entity.children if any
        if (Array.isArray(entity.children)) {
            for (const child of [...entity.children]) {
                if (child && !child._isDestroyed) {
                    this.destroyEntity(child);
                }
            }
        }

        // Unlink from parent children array if it has one
        if (entity.parentId) {
            const parent = (world.entities || []).find(e => e.id === entity.parentId);
            if (parent && Array.isArray(parent.children)) {
                parent.children = parent.children.filter(c => c.id !== entityId);
            }
        }

        // Clean up from scriptIdMap
        if (world.scriptIdMap && entity.scriptId) {
            world.scriptIdMap.delete(entity.scriptId);
        }

        // Remove from world.entities
        if (Array.isArray(world.entities)) {
            world.entities = world.entities.filter(e => e.id !== entityId);
        }

        // Remove from all layers (both world and UI layers)
        const allLayers = world.allLayers || [];
        for (const layer of allLayers) {
            if (layer && Array.isArray(layer.entities)) {
                layer.entities = layer.entities.filter(e => e.id !== entityId);
            }
        }

        // Clean up entity scripts, physics bodies, and colliders
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

    destroyEntitiesByTag(tag) {
        const world = this.game?.world;
        if (!tag || !world || !Array.isArray(world.entities)) return 0;

        const targetTag = String(tag).trim();
        const matches = world.entities.filter(e => e.tag === targetTag);
        let count = 0;

        for (const entity of matches) {
            if (!entity._isDestroyed) {
                this.destroyEntity(entity);
                count++;
            }
        }

        return count;
    }

    destroyByTag(tag) {
        return this.destroyEntitiesByTag(tag);
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

    getParent(entity) {
        if (!entity || !entity.parentId) return null;
        const entities = this.game?.world?.entities || [];
        return entities.find(e => e.id === entity.parentId) || null;
    }

    getChildren(entity) {
        if (!entity) return [];
        const entities = this.game?.world?.entities || [];
        return entities.filter(e => e.parentId === entity.id);
    }

    getRoot(entity) {
        if (!entity) return null;
        let current = entity;
        const entities = this.game?.world?.entities || [];
        while (current && current.parentId) {
            const parent = entities.find(e => e.id === current.parentId);
            if (!parent) break;
            current = parent;
        }
        return current;
    }

    findClosestByTag(tag, fromXOrEntity, optFromY) {
        const entities = this.game?.world?.entities || [];
        let originX = 0;
        let originY = 0;
        let excludeId = null;

        if (typeof fromXOrEntity === 'object' && fromXOrEntity !== null) {
            excludeId = fromXOrEntity.id;
            const t = fromXOrEntity.components?.Transform || fromXOrEntity.components?.UITransform;
            originX = t ? (t.x || 0) : 0;
            originY = t ? (t.y || 0) : 0;
        } else {
            originX = Number(fromXOrEntity) || 0;
            originY = Number(optFromY) || 0;
        }

        let closest = null;
        let minDistanceSq = Infinity;

        for (const other of entities) {
            if (other.active === false) continue;
            if (excludeId && other.id === excludeId) continue;
            const otherTag = other.tag || other.components?.Tags?.value;
            if (otherTag === tag) {
                const t = other.components?.Transform || other.components?.UITransform;
                const ox = t ? (t.x || 0) : 0;
                const oy = t ? (t.y || 0) : 0;
                const dx = ox - originX;
                const dy = oy - originY;
                const distSq = dx * dx + dy * dy;
                if (distSq < minDistanceSq) {
                    minDistanceSq = distSq;
                    closest = other;
                }
            }
        }
        return closest;
    }

    getAllByTag(tag) {
        const entities = this.game?.world?.entities || [];
        return entities.filter(e => {
            if (e.active === false) return false;
            const otherTag = e.tag || e.components?.Tags?.value;
            return otherTag === tag;
        });
    }

    findByName(name) {
        const searchLower = String(name).trim().toLowerCase();
        const searchSlug = searchLower.replace(/\s+/g, '_');
        const entities = this.game?.world?.entities || [];
        return entities.find(e => 
            (e.scriptId && (e.scriptId.toLowerCase() === searchLower || e.scriptId.toLowerCase() === searchSlug)) || 
            e.id === name
        ) || null;
    }

    findByScriptId(scriptId) {
        const searchLower = String(scriptId).trim().toLowerCase();
        const searchSlug = searchLower.replace(/\s+/g, '_');
        const entities = this.game?.world?.entities || [];
        return entities.find(e => 
            (e.scriptId && (e.scriptId.toLowerCase() === searchLower || e.scriptId.toLowerCase() === searchSlug))
        ) || null;
    }
}