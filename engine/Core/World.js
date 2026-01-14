export default class World {
    constructor() {
        this.entities = []; 
        this.layers = []; 
        this.assets = { 
            textures: {}, 
            fonts: {} 
        };
        this.prefabs = {};
        
        this._editors = {
            activeTool: null,
            activeTabId: null,
            tilemapContext: {
                showOthers: true,  
                opacity: 0.3  
            },
            gridContext: {
                display: true,
                width: 50,
                height: 50,
                magnet: true 
            },
            tabs: []
        };
    }

    addEntity(entity) {
        this.entities.push(entity);

        const targetLayer = this.layers.find(l => l._id === entity.layerId);
        if (targetLayer) {
            if (!targetLayer.entities) targetLayer.entities = [];
            targetLayer.entities.push(entity);
        } else {
            if (this.layers.length > 0) {
                 if (!this.layers[0].entities) this.layers[0].entities = [];
                 this.layers[0].entities.push(entity);
            }
        }
    }

    removeEntity(entityId) {
        const entityIndex = this.entities.findIndex(e => e.id === entityId);
        if (entityIndex === -1) return;

        const entity = this.entities[entityIndex];

        if (entity.children && entity.children.length > 0) {
            [...entity.children].forEach(child => {
                this.removeEntity(child.id); 
            });
        }

        this.entities.splice(entityIndex, 1);

        const layer = this.layers.find(l => l._id === entity.layerId);
        if (layer && layer.entities) {
            const layerEntIndex = layer.entities.findIndex(e => e.id === entityId);
            if (layerEntIndex !== -1) {
                layer.entities.splice(layerEntIndex, 1);
            }
        }
        
        this.layers.forEach(l => {
            if (l.entities) {
                const idx = l.entities.findIndex(e => e.id === entityId);
                if (idx !== -1) l.entities.splice(idx, 1);
            }
        });
    }

    setupLayers(layerData) {
        this.layers = layerData;
    }

    addTexture(id, data) {
        this.assets.textures[id] = data;
    }

    addFont(id, data) {
        this.assets.fonts[id] = data;
    }
}