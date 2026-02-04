export default class World {
    constructor() {
        this.entities = []; 
        this.layers = []; 
        this.assets = { 
            textures: {}, 
            fonts: {} 
        };
        this.prefabs = {};
        
        // UI Layer khusus untuk Editor (Rulers, Gizmos, dsb)
        this.ui = []; 

        // 1. Scene Settings (Data dari Database / Seeder)
        this.settings = {
            tickRate: 60,
            backgroundColor: "#222222",
            worldBounds: { x: -1000, y: -1000, width: 2000, height: 2000 },
            grid: {
                width: 32,
                height: 32,
                color: "#ffffff",
                opacity: 0.1,
                visible: true,
                snap: true
            },
            showRulers: true
        };
        
        // 2. Editor UI State (Sesi Editor - Tidak disimpan ke DB Scene)
        this._editors = {
            activeTool: 'select',
            activeTabId: null,
            tilemapContext: {
                showOthers: true,  
                opacity: 0.3  
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
        } else if (this.layers.length > 0) {
            if (!this.layers[0].entities) this.layers[0].entities = [];
            this.layers[0].entities.push(entity);
        }
    }

    removeEntity(entityId) {
        const entityIndex = this.entities.findIndex(e => e.id === entityId);
        if (entityIndex === -1) return;
        const entity = this.entities[entityIndex];
        if (entity.children) {
            [...entity.children].forEach(child => this.removeEntity(child.id));
        }
        this.entities.splice(entityIndex, 1);
        this.layers.forEach(l => {
            if (l.entities) {
                const idx = l.entities.findIndex(e => e.id === entityId);
                if (idx !== -1) l.entities.splice(idx, 1);
            }
        });
    }

    setupLayers(layerData) { this.layers = layerData; }
    addTexture(id, data) { this.assets.textures[id] = data; }
    addFont(id, data) { this.assets.fonts[id] = data; }
}