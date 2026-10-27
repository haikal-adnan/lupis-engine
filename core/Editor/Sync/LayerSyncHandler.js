export class LayerSyncHandler {
    constructor(syncContext) {
        this.ctx = syncContext;
    }

    onCreateLayer(layerData) {
        const scriptId = layerData.scriptId || "layer_default";
        const newLayer = {
            id: layerData.id,
            scriptId: scriptId,
            visible: layerData.visible ?? true,
            active: layerData.active ?? true,
            locked: layerData.locked ?? false,
            opacity: layerData.opacity ?? 1.0,
            zIndex: layerData.zIndex ?? 0,
            orderIndex: layerData.orderIndex ?? 0,
            freezeInput: Boolean(layerData.freezeInput ?? false),
            freezeInputType: layerData.freezeInputType || 'all',
            entities: []
        };

        const isUI = layerData.section === "ui" || 
                     (layerData.scriptId && (layerData.scriptId === "ui" || layerData.scriptId.startsWith("ui") || layerData.scriptId.toLowerCase().includes("ui")));

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

    onUpdateLayerScriptId({ id, scriptId }) {
        const layer = this._findLayer(id);
        if (layer) {
            layer.scriptId = scriptId;
        }
    }

    onUpdateLayerProp({ id, prop, value }) {
        const layer = this._findLayer(id);
        if (layer) {
            layer[prop] = value;
            if (prop === "zIndex" || prop === "orderIndex") {
                if (this.ctx.world?.layersUI?.includes(layer)) {
                    this.ctx.world.layersUI.sort((a, b) => {
                        const zA = a.zIndex ?? 0;
                        const zB = b.zIndex ?? 0;
                        if (zA !== zB) return zA - zB;
                        return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
                    });
                } else if (this.ctx.world?.layersWorld?.includes(layer)) {
                    this.ctx.world.layersWorld.sort((a, b) => {
                        const zA = a.zIndex ?? 0;
                        const zB = b.zIndex ?? 0;
                        if (zA !== zB) return zA - zB;
                        return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
                    });
                }
            }
        }
    }

    onReorderLayer({ id, targetId, position }) {
        let layers = this.ctx.world.layersWorld;
        let oldIndex = layers.findIndex(l => l.id === id);

        if (oldIndex === -1) {
            layers = this.ctx.world.layersUI;
            oldIndex = layers.findIndex(l => l.id === id);
        }

        if (oldIndex === -1) return;

        const movedLayer = layers[oldIndex];
        const targetLayer = layers.find(l => l.id === targetId);
        if (!targetLayer) return;

        const movedZ = movedLayer.zIndex ?? 0;
        const targetZ = targetLayer.zIndex ?? 0;
        if (movedZ !== targetZ) return;

        layers.splice(oldIndex, 1);
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