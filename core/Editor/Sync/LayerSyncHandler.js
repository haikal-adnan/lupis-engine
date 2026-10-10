export class LayerSyncHandler {
    constructor(syncContext) {
        this.ctx = syncContext;
    }

    onCreateLayer(layerData) {
        const newLayer = {
            id: layerData.id,
            scriptId: layerData.scriptId,
            name: layerData.name,
            visible: true,
            locked: false,
            opacity: layerData.opacity ?? 1.0,
            zIndex: layerData.zIndex ?? 0,
            orderIndex: layerData.orderIndex ?? 0,
            entities: []
        };

        const isUI = layerData.section === "ui" || 
                     layerData.scriptId === "ui" ||
                     (layerData.name && layerData.name.toLowerCase().includes("ui"));

        if (isUI) {
            this.ctx.world.layersUI.push(newLayer);
        } else {
            this.ctx.world.layersWorld.push(newLayer);
        }
    }

    onDeleteLayer(id) {
        this.ctx.world.layersWorld = this.ctx.world.layersWorld.filter(l => l.id !== id);
        this.ctx.world.layersUI = this.ctx.world.layersUI.filter(l => l.id !== id);
    }

    onUpdateLayerName({ id, name }) {
        const layer = this._findLayer(id);
        if (layer) layer.name = name;
    }

    onUpdateLayerProp({ id, prop, value }) {
        const layer = this._findLayer(id);
        if (layer) layer[prop] = value;
    }

    onReorderLayer({ id, targetId, position }) {
        let layers = this.ctx.world.layersWorld;
        let oldIndex = layers.findIndex(l => l.id === id);

        if (oldIndex === -1) {
            layers = this.ctx.world.layersUI;
            oldIndex = layers.findIndex(l => l.id === id);
        }

        if (oldIndex === -1) return;

        const [movedLayer] = layers.splice(oldIndex, 1);
        let targetIndex = layers.findIndex(l => l.id === targetId);

        if (position === "bottom") targetIndex += 1;
        if (targetIndex < 0) targetIndex = 0;
        if (targetIndex > layers.length) targetIndex = layers.length;

        layers.splice(targetIndex, 0, movedLayer);
        layers.forEach((l, idx) => { l.orderIndex = idx; });
    }

    _findLayer(id) {
        return this.ctx.world.layersWorld.find(l => l.id === id) ||
               this.ctx.world.layersUI.find(l => l.id === id);
    }
}