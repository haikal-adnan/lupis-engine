export default class World {
    constructor() {
        this.entities = []; 
        
        // UPDATED: Split Layer Storage
        this.layersWorld = []; 
        this.layersUI = []; 
        
        this.assets = { 
            textures: {}, 
            fonts: {} 
        };
        this.prefabs = {};

        this.settings = {
            tickRate: 60,
            backgroundColor: "#222222",
            worldBounds: { x: -1000, y: -1000, width: 2000, height: 2000 },
            grid: {
                width: 32, height: 32, color: "#ffffff", opacity: 0.1, visible: true, snap: true
            },
            ui: {
                referenceWidth: 1920, referenceHeight: 1080, scaleMode: "constant", showUIBorder: true, active: true
            },
            showRulers: true
        };
        
        this._editors = {
            activeTool: 'select',
            activeTabId: null,
            tilemapContext: { showOthers: true, opacity: 0.3 },
            tabs: []
        };
    }

    // Helper: Mendapatkan semua layer (penting untuk loop rendering)
    get allLayers() {
        return [...this.layersWorld, ...this.layersUI];
    }

    addEntity(entity) {
        this.entities.push(entity);
        
        // Cari layer target di World
        let targetLayer = this.layersWorld.find(l => l._id === entity.layerId);
        
        // Jika tidak ada, cari di UI
        if (!targetLayer) {
            targetLayer = this.layersUI.find(l => l._id === entity.layerId);
        }

        // Masukkan entity ke dalam layer group untuk optimasi
        if (targetLayer) {
            if (!targetLayer.entities) targetLayer.entities = [];
            targetLayer.entities.push(entity);
        } else {
            // Fallback: Masukkan ke layer pertama World jika orphan layer
            if (this.layersWorld.length > 0) {
                 if (!this.layersWorld[0].entities) this.layersWorld[0].entities = [];
                 this.layersWorld[0].entities.push(entity);
            }
        }
    }

    removeEntity(entityId) {
        const entityIndex = this.entities.findIndex(e => e.id === entityId);
        if (entityIndex === -1) return;
        
        const entity = this.entities[entityIndex];
        
        // Recursive remove children
        if (entity.children) {
            [...entity.children].forEach(child => this.removeEntity(child.id));
        }

        // Remove from main list
        this.entities.splice(entityIndex, 1);

        // Remove from Layer list (Check both collections)
        const all = this.allLayers;
        for (const layer of all) {
            if (layer.entities) {
                const idx = layer.entities.findIndex(e => e.id === entityId);
                if (idx !== -1) {
                    layer.entities.splice(idx, 1);
                    break; // Entity found and removed
                }
            }
        }
    }

    setupLayers(worldData, uiData) { 
        this.layersWorld = worldData || [];
        this.layersUI = uiData || [];
    }
    
    addTexture(id, data) { this.assets.textures[id] = data; }
    addFont(id, data) { this.assets.fonts[id] = data; }
}