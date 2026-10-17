export default class LayerSystem {
    constructor(game) {
        this.game = game;
    }

    getLayer(layerId) {
        if (!layerId || !this.game?.world?.allLayers) return null;
        const search = String(layerId).trim().toLowerCase();
        const slug = search.replace(/\s+/g, '_');
        return this.game.world.allLayers.find(l => 
            l.id === layerId || 
            (l.scriptId && (l.scriptId.toLowerCase() === search || l.scriptId.toLowerCase() === slug))
        ) || null;
    }
}