// engine/Renderer/RenderQueue.js
export default class RenderQueue {
    constructor() {
        this.items = [];
    }

    clear() {
        this.items.length = 0;
    }

    push(layerIndex, zIndex, type, entity) {
        this.items.push({
            layerIndex,
            zIndex,
            type,
            entity
        });
    }

    sort() {
        this.items.sort((a, b) => {
            if (a.layerIndex !== b.layerIndex) return a.layerIndex - b.layerIndex;
            if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
            return a.type - b.type;
        });
    }
}
