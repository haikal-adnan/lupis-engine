import Entity from "../Core/Entity.js";
import { ApplyResizeToEntity } from "../Util/ApplyResizeToEntity.js";
import SceneLoader from "../Loader/SceneLoader.js"; 
import ScriptLoader from "../Loader/ScriptLoader.js";

export default class SyncComponent {
    constructor(world, bus, game) {
        this.world = world;
        this.bus = bus;
        this.game = game;
        this.assetLoader = game.assetLoader;
        this.isInternalUpdate = false;
        this.bindEvents();
    }

    bindEvents() {
        this.bus.on("editor:entity:create", d => this.onCreateEntity(d));
        this.bus.on("editor:entity:delete", id => this.onDeleteEntity(id));
        this.bus.on("editor:entity:update-name", p => this.onUpdateEntityName(p));
        this.bus.on("editor:entity:move", p => this.onMoveEntity(p));
        this.bus.on("editor:entity:update-component", p => this.onUpdateComponent(p));
        this.bus.on("editor:entity:update-prop", p => this.onUpdateEntityProp(p));
        this.bus.on("editor:entity:patch-component", p => this.onPatchComponent(p));
        this.bus.on("editor:entity:add-component", p => this.onAddComponent(p));
        this.bus.on("editor:entity:remove-component", p => this.onRemoveComponent(p));
        this.bus.on("editor:layer:update-prop", p => this.onUpdateLayerProp(p));
        this.bus.on("editor:entity:replace", p => this.onEntityReplace(p)); 

        this.bus.on("editor:layer:create", d => this.onCreateLayer(d));
        this.bus.on("editor:layer:delete", id => this.onDeleteLayer(id));
        this.bus.on("editor:layer:update-name", p => this.onUpdateLayerName(p));
        this.bus.on("editor:layer:reorder", p => this.onReorderLayer(p));

        this.bus.on("editor:asset:create", a => this.onAssetCreate(a));
        this.bus.on("editor:asset:delete", id => this.onAssetDelete(id));
        this.bus.on("editor:script:create", s => this.onScriptCreate(s));
        this.bus.on("editor:script:update", p => this.onScriptUpdate(p));
        this.bus.on("editor:script:delete", id => this.onScriptDelete(id));

        this.bus.on("editor:store:update", p => this.onUpdateEditorStore(p));
        this.bus.on("editor:project:settings-update", p => this.onUpdateProjectSettings(p));
        this.bus.on("editor:scene:settings-update", p => this.onUpdateSceneSettings(p));    
        this.bus.on("editor:selection:clear", () => this.onClearSelection());
        this.bus.on("editor:selection:set", (ids) => {
             if (this.game.selection) {
                 this.game.selection.onEditorSelect(ids);
             }
        });

        this.bus.on("editor:scene:reload", payload => this.onSceneReload(payload));
    }

    onUpdateProjectSettings(payload) {
        if (!this.world.settings) return;

        if (payload.grid) {
            Object.assign(this.world.settings.grid, payload.grid);
        }

        if (payload.ui) {
            if (!this.world.settings.ui) this.world.settings.ui = {};
            Object.assign(this.world.settings.ui, payload.ui);
        }

        if (payload.camera) {
            if (!this.world.settings.camera) this.world.settings.camera = {};
            Object.assign(this.world.settings.camera, payload.camera);
        }

        if (payload.tickRate !== undefined) {
            this.world.settings.tickRate = payload.tickRate;
        }
    }

    onEntityReplace(entitiesData) {
        const entities = Array.isArray(entitiesData) ? entitiesData : [entitiesData];

        entities.forEach(newData => {
            const entity = this._findEntityById(newData._id);
            if (!entity) return;

            entity.prefabId = newData.prefabId;
            entity.name = newData.name;
            if (newData.overridden !== undefined) entity.overridden = newData.overridden;

            if (entity.components) {
                Object.keys(entity.components).forEach(key => {
                    delete entity.components[key];
                });
            } else {
                entity.components = {};
            }

            if (newData.components) {
                for (const [key, value] of Object.entries(newData.components)) {
                    if (typeof entity.addComponent === 'function') {
                        entity.addComponent(key, value);
                    } else {
                        entity.components[key] = value;
                    }
                }
            }

            ApplyResizeToEntity(entity, this.world, true);
        });
    }

    onMoveEntity({ id, layerId, parentId }) { 
        if (this.isInternalUpdate) return;

        const entity = this._findEntityById(id);
        if (!entity) return;

        const hitTester = this.game.selection?.hitTester;
        if (!hitTester) return;

        const oldWorldPos = hitTester.getGlobalPosition(entity);

        const newLayer =
            this.world.layersWorld.find(l => l._id === layerId) ||
            this.world.layersUI.find(l => l._id === layerId);

        if (!newLayer) return;

        const targetContainer = newLayer.entities;

        this.isInternalUpdate = true;

        this._removeEntityFromCurrentContainer(entity);

        entity.layerId = layerId;
        entity.parentId = parentId !== undefined ? parentId : null; 

        targetContainer.push(entity);

        const t = entity.components.Transform || entity.components.UITransform;
        
        if (t && entity.type !== 'ui') {
            const resolvedLocal = hitTester.solveLocalPosition(
                null,
                oldWorldPos.x,
                oldWorldPos.y
            );

            t.x = resolvedLocal.x;
            t.y = resolvedLocal.y;
            this.bus.emit("entity:modified", [entity]);
        }

        this._sortContainer(targetContainer);
        this.isInternalUpdate = false;
    }

    _sortContainer(container) {
        if (!container) return;

        container.sort((a, b) => {
            const zA = a.zIndex ?? 0;
            const zB = b.zIndex ?? 0;
            if (zA !== zB) return zA - zB;
            return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
        });
    }

    _removeEntityFromCurrentContainer(entity) {
        const oldLayer =
            this.world.layersWorld.find(l => l._id === entity.layerId) ||
            this.world.layersUI.find(l => l._id === entity.layerId);

        if (oldLayer?.entities) {
            const idx = oldLayer.entities.indexOf(entity);
            if (idx !== -1) oldLayer.entities.splice(idx, 1);
        }
    }

    _findEntityById(id) {
        const allLayers = [
            ...this.world.layersWorld,
            ...this.world.layersUI
        ];

        for (const layer of allLayers) {
            if (!layer.entities) continue;

            for (const entity of layer.entities) {
                if (entity.id === id || entity._id === id) return entity;
            }
        }

        return null;
    }

    _createEntityInstance(data) {
        const e = new Entity(data._id);
        Object.assign(e, {
            name: data.name,
            type: data.type,
            layerId: data.layerId,
            parentId: null,
            active: data.active,
            visible: data.visible,
            zIndex: data.zIndex ?? 0,
            orderIndex: data.orderIndex ?? 0,
            children: []
        });

        if (data.components) {
            for (const [k, v] of Object.entries(data.components)) {
                e.addComponent(k, v);
            }
        }

        return e;
    }

    async onAssetCreate(asset) {
        if (this.assetLoader) {
            console.log(`[SyncComponent] Memuat asset baru ke engine: ${asset.name}`);
            try {
                await this.assetLoader.loadAsset(this.world, [asset], this.game.baseURL);
                
                this.bus.emit("engine:asset:loaded", asset._id);
            } catch (error) {
                console.error(`[SyncComponent] Gagal memuat asset ${asset.name}:`, error);
            }
        }
    }

    onAssetDelete(id) {
        if (this.world.assets.textures[id]) {
            delete this.world.assets.textures[id];
        }
    }

    onScriptCreate(s) {
        if (!this.world.scripts) this.world.scripts = {};

        this.world.scripts[s._id] = {
            _id: s._id,
            name: s.name,
            type: s.type,
            variables: s.exposedVariables || [],
            nodes: s.nodes || [],
            edges: s.edges || []
        };
    }

    onScriptUpdate({ id, updates }) {
        if (this.world.scripts?.[id]) {
            Object.assign(this.world.scripts[id], updates);
        }
    }

    onScriptDelete(id) {
        if (this.world.scripts?.[id]) {
            delete this.world.scripts[id];
        }
    }

    onPatchComponent({ entityId, componentName, updates }) {
        const e = this._findEntityById(entityId);
        if (!e) return;

        if (!e.components) e.components = {};

        if (!e.components[componentName]) {
            e.addComponent(componentName, updates);
        } else {
            const c = e.components[componentName];
            if (updates.data && Array.isArray(updates.data)) {
                c.data = [...updates.data];
            } else {
                Object.assign(c, updates);
            }
        }
    }

    onAddComponent({ entityId, componentName, data }) {
        const e = this._findEntityById(entityId);
        if (e) e.addComponent(componentName, data);
    }

    onRemoveComponent({ entityId, componentName }) {
        const e = this._findEntityById(entityId);
        if (e?.components) delete e.components[componentName];
    }

    onUpdateEntityName({ id, name }) {
        const e = this._findEntityById(id);
        if (e) e.name = name;
    }

    onUpdateComponent({ entityId, componentName, path, value }) {
        const e = this._findEntityById(entityId);
        if (!e) return;

        const c = e.components[componentName];
        if (!c) return;

        const keys = path.split(".");
        let target = c;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!target[keys[i]]) target[keys[i]] = {};
            target = target[keys[i]];
        }

        target[keys[keys.length - 1]] = value;

        if (
            componentName === "TextRenderer" &&
            ["fontSize", "value", "assetId", "lockRatio"].includes(path)
        ) {
            ApplyResizeToEntity(e, this.world, true);
            this.bus.emit("entity:modified", [e]);
        }
    }

    onUpdateLayerProp({ id, prop, value }) {
        let layer = this.world.layersWorld.find(l => l._id === id) || 
                    this.world.layersUI.find(l => l._id === id);
        if (layer) {
            layer[prop] = value;
        }
    }

    onUpdateEntityProp({ id, prop, value }) {
        const e = this._findEntityById(id);
        if (!e) return;

        e[prop] = value;

        if (prop === "visible") e.visible = value;
        if (prop === "active") e.active = value;

        if (prop === "zIndex" || prop === "orderIndex") {
            const container =
                (
                    this.world.layersWorld.find(l => l._id === e.layerId) ||
                    this.world.layersUI.find(l => l._id === e.layerId)
                )?.entities;

            if (container) this._sortContainer(container);
        }
    }

    onUpdateSceneSettings(payload) {
        if (!this.world.settings) return;

        if (payload.physics) {
            Object.assign(this.world.settings.physics, payload.physics);
        }

        if (payload.worldBounds) {
            Object.assign(this.world.settings.worldBounds, payload.worldBounds);
        }

        if (payload.backgroundColor !== undefined) {
            this.world.settings.backgroundColor = payload.backgroundColor;
        }

        if (payload.showRulers !== undefined) {
            this.world.settings.showRulers = payload.showRulers;
        }
    }

    onClearSelection() {
        if (this.game.selection) this.game.selection.clear();
    }

    onUpdateEditorStore(payload) {
        if (!payload) return;

        if (!this.world._editors) {
            this.world._editors = {
                activeTool: null,
                activeTabId: null,
                tilemapContext: {}
            };
        }

        const {
            tilemapContext,
            tileSelection,
            gridContext,
            showUIBorder,
            ...others
        } = payload;

        Object.assign(this.world._editors, others);

        if (tilemapContext) {
            if (!this.world._editors.tilemapContext) {
                this.world._editors.tilemapContext = {};
            }

            Object.assign(
                this.world._editors.tilemapContext,
                tilemapContext
            );
        }

        if (tileSelection !== undefined) {
            this.world._editors.tileSelection = tileSelection;
        }
    }

    onCreateLayer(layerData) {
        const newLayer = {
            _id: layerData._id,
            scriptId: layerData.scriptId,
            name: layerData.name,
            visible: true,
            locked: false,
            zIndex: layerData.zIndex ?? 0,
            orderIndex: layerData.orderIndex ?? 0,
            entities: []
        };

        const isUI =
            layerData.section === "ui" || 
            layerData.scriptId === "ui" ||
            (layerData.name && layerData.name.toLowerCase().includes("ui"));

        if (isUI) {
            this.world.layersUI.push(newLayer);
        } else {
            this.world.layersWorld.push(newLayer);
        }
    }

    onDeleteLayer(id) {
        this.world.layersWorld =
            this.world.layersWorld.filter(l => l._id !== id);

        this.world.layersUI =
            this.world.layersUI.filter(l => l._id !== id);
    }

    onUpdateLayerName({ id, name }) {
        let layer =
            this.world.layersWorld.find(l => l._id === id) ||
            this.world.layersUI.find(l => l._id === id);

        if (layer) layer.name = name;
    }

    onReorderLayer({ id, targetId, position }) {
        let layers = this.world.layersWorld;
        let oldIndex = layers.findIndex(l => l._id === id);

        if (oldIndex === -1) {
            layers = this.world.layersUI;
            oldIndex = layers.findIndex(l => l._id === id);
        }

        if (oldIndex === -1) return;

        const [movedLayer] = layers.splice(oldIndex, 1);

        let targetIndex = layers.findIndex(
            l => l._id === targetId
        );

        if (position === "bottom") targetIndex += 1;
        if (targetIndex < 0) targetIndex = 0;
        if (targetIndex > layers.length) targetIndex = layers.length;

        layers.splice(targetIndex, 0, movedLayer);

        layers.forEach((l, idx) => {
            l.orderIndex = idx;
        });
    }

    onCreateEntity(data) {
        if (Array.isArray(data)) {
            data.forEach(item => this._processSingleEntityCreation(item));
        } else {
            this._processSingleEntityCreation(data);
        }
    }

    _processSingleEntityCreation(entityData) {
        const safeData = { ...entityData, parentId: null };
        const entity = this._createEntityInstance(safeData);
        if (this._findEntityById(entityData._id)) return;

        const layer =
            this.world.layersWorld.find(l => l._id === entity.layerId) ||
            this.world.layersUI.find(l => l._id === entity.layerId);

        if (layer) {
            layer.entities.push(entity);
            
            layer.entities.sort(
                (a, b) =>
                    (a.zIndex - b.zIndex) ||
                    (a.orderIndex - b.orderIndex)
            );
        }
    }

    onDeleteEntity(id) {
        const allLayers = [
            ...this.world.layersWorld,
            ...this.world.layersUI
        ];

        for (const layer of allLayers) {
            if (!layer.entities) continue;

            const idx = layer.entities.findIndex(
                e => e._id === id || e.id === id
            );

            if (idx !== -1) {
                layer.entities.splice(idx, 1);
                return;
            }
        }
    }

    async onSceneReload(payload) {
        if (!payload) return;
        const { project, scene, prefabs, scripts, assets } = payload;

        this.isInternalUpdate = true; 

        try {
            // 1. DOWNLOAD ASSETS DULU! (Pre-load)
            // Lakukan proses async ini SEBELUM menghapus scene lama, 
            // sehingga layar tidak akan kosong / berkedip saat menunggu.
            if (assets && Array.isArray(assets) && this.assetLoader) {
                await this.assetLoader.loadAsset(this.world, assets, this.game.baseURL);
            }

            this.onClearSelection();
            
            // 2. Bersihkan HANYA data entitas dan layer scene
            if (this.world.layersWorld) this.world.layersWorld.length = 0;
            if (this.world.layersUI) this.world.layersUI.length = 0;
            if (this.world.entities) this.world.entities.length = 0;
            
            // Dihapus: `if (this.world.ui) this.world.ui.length = 0;` 
            // Alasannya: world.ui berisi fungsi render Rulers dari Editor. Biarkan saja!
            
            if (this.world.scriptIdMap) this.world.scriptIdMap.clear();

            // 3. Setup ulang Prefab & Scripts
            this.world.prefabs = {};
            if (prefabs && Array.isArray(prefabs)) {
                this.world.prefabs = Object.fromEntries(prefabs.map(p => [p._id, {
                    _id: p._id,
                    name: p.name,
                    data: p.data 
                }]));
            }

            this.world.scripts = {};
            if (scripts && Array.isArray(scripts)) {
                this.world.scripts = Object.fromEntries(scripts.map(s => [s._id, {
                    _id: s._id,
                    name: s.name,
                    type: s.type,
                    variables: s.exposedVariables || [],
                    nodes: s.nodes || [],
                    edges: s.edges || []
                }]));
                
                ScriptLoader.load(this.game, payload);
            }

            // 4. Load Scene Baru
            if (scene) {
                // Tetap gunakan JSON clone untuk keamanan seperti yang kita bahas sebelumnya
                const safeScene = JSON.parse(JSON.stringify(scene));
                const sceneLoader = new SceneLoader(this.world, "editor");
                sceneLoader.loadScene(safeScene);
            } else {
                console.warn("[SyncComponent] Scene data kosong/tidak ditemukan di payload saat reload.");
            }

            // Dihapus: Kode re-assign this.game.rulers dan this.game.grid di bawah sini.
            // Karena kita tidak menghapusnya di atas, kita tidak perlu membuatnya lagi!

            console.log("[SyncComponent] Hard Reset selesai. Scene telah dimuat ulang tanpa blink.");

        } catch (error) {
            console.error("[SyncComponent] Kritis: Gagal melakukan onSceneReload:", error);
        } finally {
            this.isInternalUpdate = false;
        }
    }
}