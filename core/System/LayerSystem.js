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

    isInputFrozen(layerId, inputType = 'all', contextEntity = null) {
        const layer = this.getLayer(layerId, contextEntity);
        if (!layer || !layer.freezeInput) return false;
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
        if (!entity || !entity.layerId) return false;
        return this.isInputFrozen(entity.layerId, inputType, entity);
    }
}