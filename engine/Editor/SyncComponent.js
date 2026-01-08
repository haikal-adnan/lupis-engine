import Entity from "../Core/Entity.js";

export default class SyncComponent {
    constructor(world, bus, assetLoader) {
        this.world = world;
        this.bus = bus;
        this.assetLoader = assetLoader;
        this.bindEvents();
    }

    bindEvents() {
        this.bus.on("editor:entity:create", (data) => this.onCreateEntity(data));
        this.bus.on("editor:entity:delete", (id) => this.onDeleteEntity(id));
        this.bus.on("editor:entity:update-name", (p) => this.onUpdateEntityName(p));
        this.bus.on("editor:entity:move", (p) => this.onMoveEntity(p));

        this.bus.on("editor:layer:create", (data) => this.onCreateLayer(data));
        this.bus.on("editor:layer:delete", (id) => this.onDeleteLayer(id));
        this.bus.on("editor:layer:update-name", (p) => this.onUpdateLayerName(p));

        this.bus.on("editor:entity:update-component", (p) => this.onUpdateComponent(p));
        this.bus.on("editor:entity:update-prop", (p) => this.onUpdateEntityProp(p));

        this.bus.on("editor:asset:create", (asset) => this.onAssetCreate(asset));
        this.bus.on("editor:asset:delete", (id) => this.onAssetDelete(id));
    }

    onCreateEntity(entityData) {
        const entity = this._createEntityInstance(entityData);
        this.world.addEntity(entity);

        if (entity.parentId) {
            const parent = this.world.entities.find((e) => e.id === entity.parentId);
            if (parent) parent.addChild(entity);
        }
    }

    onDeleteEntity(id) {
        const entity = this.world.entities.find((e) => e.id === id);
        if (!entity) return;

        if (entity.parentId) {
            const parent = this.world.entities.find((e) => e.id === entity.parentId);
            if (parent) parent.removeChild(entity.id);
        }

        if (this.world.removeEntity) {
            this.world.removeEntity(id);
        } else {
            this.world.entities = this.world.entities.filter((e) => e.id !== id);
        }
    }

    onUpdateEntityName({ id, name }) {
        const entity = this.world.entities.find((e) => e.id === id);
        if (entity) entity.name = name;
    }

    onMoveEntity({ id, context }) {
        const entity = this.world.entities.find((e) => e.id === id);
        if (!entity) return;

        if (entity.parentId) {
            const oldParent = this.world.entities.find((e) => e.id === entity.parentId);
            if (oldParent) oldParent.removeChild(id);
        }

        entity.layerId = context.newLayerId;
        entity.parentId = context.newParentId;

        if (context.newParentId) {
            const newParent = this.world.entities.find(
                (e) => e.id === context.newParentId
            );
            if (newParent) newParent.addChild(entity);
        }
    }

    onCreateLayer(layerData) {
        this.world.layers.push({
            _id: layerData._id,
            name: layerData.name,
            visible: true,
            locked: false,
            entities: []
        });
    }

    onDeleteLayer(id) {
        const entitiesToDelete = this.world.entities
            .filter((e) => e.layerId === id)
            .map((e) => e.id);

        entitiesToDelete.forEach((entityId) => {
            if (this.world.removeEntity) {
                this.world.removeEntity(entityId);
            }
        });

        this.world.layers = this.world.layers.filter((l) => l._id !== id);
    }

    onUpdateLayerName({ id, name }) {
        const layer = this.world.layers.find((l) => l._id === id);
        if (layer) layer.name = name;
    }

    _createEntityInstance(data) {
        const entity = new Entity(data._id);

        entity.name = data.name;
        entity.type = data.type;
        entity.tag = data.tag;
        entity.layerId = data.layerId;
        entity.parentId = data.parentId;
        entity.active = data.isActive;
        entity.visible = data.isVisible;
        entity._editor = data._editor || {};

        if (data.components) {
            for (const [key, val] of Object.entries(data.components)) {
                entity.addComponent(key, val);
            }
        }

        return entity;
    }

    onUpdateComponent({ entityId, componentName, path, value }) {
        const entity = this.world.entities.find((e) => e.id === entityId);
        if (!entity) return;

        // Pastikan component ada di instance entity
        // Catatan: Di engine, structure mungkin berbeda, sesuaikan jika perlu.
        // Asumsi: entity.components['SpriteRenderer'] akses langsung atau via getter
        
        // Jika Engine menggunakan sistem ECS murni (Array components), logika pencarian beda.
        // Jika Entity adalah Object container (seperti mock anda):
        let comp = entity.components[componentName] || entity[componentName]; // Coba akses direct properti jika komponen di-attach sebagai properti
        
        // Fallback logic tergantung struktur engine anda:
        if (!comp && entity.getComponent) {
            comp = entity.getComponent(componentName);
        }

        if (!comp) return;

        // Update nested value
        const keys = path.split('.');
        let target = comp;
        for (let i = 0; i < keys.length - 1; i++) {
            target = target[keys[i]];
        }
        target[keys[keys.length - 1]] = value;
        
        // Opsional: Tandai dirty agar re-render
        if (entity.isDirty !== undefined) entity.isDirty = true;
    }

    onUpdateEntityProp({ entityId, propName, value }) {
        const entity = this.world.entities.find((e) => e.id === entityId);
        if (entity) {
            entity[propName] = value;
        }
    }

    async onAssetCreate(asset) {
        console.log("[Sync] Loading new asset to engine:", asset.name);
        
        if (!this.assetLoader) {
            console.warn("[Sync] AssetLoader not found in SyncComponent");
            return;
        }

        // Gunakan assetLoader untuk memuat single asset ini
        // Karena loadAsset menerima array, kita bungkus dalam array
        await this.assetLoader.loadAsset(this.world, [asset]);
        
        // Trigger re-render jika perlu (biasanya otomatis via game loop)
    }

    onAssetDelete(id) {
        // Hapus dari world.assets.textures atau world.assets.fonts
        if (this.world.assets.textures[id]) {
            // Optional: Destroy WebGL texture untuk free memory
            // const gl = this.gl; // butuh akses gl context
            // gl.deleteTexture(this.world.assets.textures[id].glTexture);
            
            delete this.world.assets.textures[id];
            console.log("[Sync] Texture deleted:", id);
        }
        // Handle Font delete logic similar...
    }
}
