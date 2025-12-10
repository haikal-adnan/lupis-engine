// engine/World/World.js
export default class World {
    constructor() {
        this.layers = new Map();
        this.layerOrder = [];
        this.layerVisibility = {};
        this.entities = [];
        this.systems = [];
        this.assets = { textures: {}, fonts: {} };
        this.ui = [];
        this.camera = { x: 0, y: 0, scale: 1 };
        this.showAxis = true;
        this.showUIRect = true;
    }

    addUI(fn) {
        this.ui.push(fn);
    }

    setupLayers(layersSource) {
        const sortedLayers = layersSource.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
        this.layerOrder = sortedLayers.map(l => l.id);

        for (const l of sortedLayers) {
            this.layers.set(l.id, []);
            this.layerVisibility[l.id] = l.visible ?? true;
        }
    }

    addEntity(e, layer) {
        if (!this.layers.has(layer)) this.layers.set(layer, []);
        this.layers.get(layer).push(e);
        this.entities.push(e);
    }

    update(dt) {
        for (const sys of this.systems) {
            for (const layerId of this.layerOrder) {
                const ents = this.layers.get(layerId);
                if (!ents) continue;
                for (const e of ents) sys.update?.(e, dt);
            }
        }
    }
}