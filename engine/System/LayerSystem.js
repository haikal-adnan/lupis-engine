export default class LayerSystem {
    constructor(game) {
        this.game = game;
    }

    getLayer(layerId) {
        if (!layerId || !this.game?.world?.allLayers) return null;
        return this.game.world.allLayers.find(l => l.scriptId === layerId || l.id === layerId) || null;
    }
}