// engine/Core/World.js
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

    // engine/World/World.js
    setupLayers(layersSource) {
        // Pastikan layersSource adalah array
        const source = Array.isArray(layersSource) ? layersSource : ["layer_objects"];
        
        this.layerOrder = source.map(l => {
            // Jika l adalah string, gunakan l langsung. Jika object, gunakan l.id
            return typeof l === 'string' ? l : l.id;
        });

        for (const id of this.layerOrder) {
            if (!this.layers.has(id)) {
                this.layers.set(id, []);
            }
            this.layerVisibility[id] = true;
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