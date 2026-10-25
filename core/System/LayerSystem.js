export default class LayerSystem {
    constructor(game) {
        this.game = game;
    }

    getLayer(layerId, contextEntity = null) {
        const allLayers = this.game?.world?.allLayers || [];
        let targetId = layerId;
        if (!targetId || targetId === 'self') {
            targetId = contextEntity?.layerId;
            if (!targetId) {
                return allLayers[0] || null;
            }
        }
        const search = String(targetId).trim().toLowerCase();
        const slug = search.replace(/\s+/g, '_');
        return allLayers.find(l => 
            l.id === targetId || 
            (l.scriptId && (l.scriptId.toLowerCase() === search || l.scriptId.toLowerCase() === slug))
        ) || null;
    }

    _isEntityAndParentsActive(entity) {
        if (!entity || entity.active === false || entity.visible === false) return false;
        const world = this.game?.world;
        if (!world) return true;
        let current = entity;
        while (current && current.parentId) {
            const parentId = current.parentId;
            current = world.entities ? world.entities.find(e => e.id === parentId || (e.scriptId && e.scriptId === parentId)) : null;
            if (!current) break;
            if (current.active === false || current.visible === false) return false;
        }
        return true;
    }

    isInputFrozen(layerId, inputType = 'all', contextEntity = null) {
        const layer = this.getLayer(layerId, contextEntity);
        if (!layer) return false;
        if (layer.active === false || layer.visible === false) return true;
        if (!layer.freezeInput) return false;
        const layerType = (layer.freezeInputType || 'all').toLowerCase();
        const requestedType = (inputType || 'all').toLowerCase();
        if (layerType === 'all' || requestedType === 'all') return true;
        return layerType === requestedType;
    }

    freezeInput(layerId, active = true, inputType = 'all', contextEntity = null) {
        const layer = this.getLayer(layerId, contextEntity);
        if (!layer) return false;
        layer.freezeInput = Boolean(active);
        layer.freezeInputType = (inputType || 'all').toLowerCase();
        return true;
    }

    isEntityInputFrozen(entity, inputType = 'all') {
        if (!entity) return false;
        if (!this._isEntityAndParentsActive(entity)) return true;
        const layer = this.getLayer(entity.layerId, entity);
        if (layer && (layer.active === false || layer.visible === false)) return true;
        if (entity.layerId) {
            return this.isInputFrozen(entity.layerId, inputType, entity);
        }
        return false;
    }

    destroyLayer(layerTarget, destroyEntities = true, contextEntity = null) {
        const layer = this.getLayer(layerTarget, contextEntity);
        if (!layer) return false;

        const layerId = layer.id;
        const world = this.game?.world;
        if (!world) return false;

        if (destroyEntities && this.game.entitySystem) {
            const allEntities = [...(world.entities || [])];
            const entitiesToDestroy = allEntities.filter(e => e.layerId === layerId);
            if (Array.isArray(layer.entities)) {
                for (const e of layer.entities) {
                    if (!entitiesToDestroy.includes(e)) {
                        entitiesToDestroy.push(e);
                    }
                }
            }
            for (const ent of entitiesToDestroy) {
                if (!ent._isDestroyed) {
                    this.game.entitySystem.destroyEntity(ent);
                }
            }
        }

        if (Array.isArray(world.layersWorld)) {
            world.layersWorld = world.layersWorld.filter(l => l.id !== layerId);
        }
        if (Array.isArray(world.layersUI)) {
            world.layersUI = world.layersUI.filter(l => l.id !== layerId);
        }

        return true;
    }
}