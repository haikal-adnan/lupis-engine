import { EntitySyncHandler } from "./Sync/EntitySyncHandler.js";
import { LayerSyncHandler } from "./Sync/LayerSyncHandler.js";
import { AssetSyncHandler } from "./Sync/AssetSyncHandler.js";
import { PrefabSyncHandler } from "./Sync/PrefabSyncHandler.js";
import { SettingsSyncHandler } from "./Sync/SettingsSyncHandler.js";

export default class SyncComponent {
    constructor(world, bus, game) {
        this.world = world;
        this.bus = bus;
        this.game = game;
        this.assetLoader = game.assetLoader;
        this.isInternalUpdate = false;

        // Inisialisasi Handler Modules
        this.entitySync = new EntitySyncHandler(this);
        this.layerSync = new LayerSyncHandler(this);
        this.assetSync = new AssetSyncHandler(this);
        this.prefabSync = new PrefabSyncHandler(this);
        this.settingsSync = new SettingsSyncHandler(this);

        this.bindEvents();
    }

    bindEvents() {
        // Theme & Settings Events
        this.bus.on("editor:theme:update", p => this.settingsSync.onUpdateTheme(p));
        this.bus.on("editor:store:update", p => this.settingsSync.onUpdateEditorStore(p));
        this.bus.on("editor:project:settings-update", p => this.settingsSync.onUpdateProjectSettings(p));
        this.bus.on("editor:scene:settings-update", p => this.settingsSync.onUpdateSceneSettings(p));
        this.bus.on("editor:selection:clear", () => this.settingsSync.onClearSelection());
        this.bus.on("editor:selection:set", ids => this.game.selection?.onEditorSelect(ids));

        // Entity Events
        this.bus.on("editor:entity:create", d => this.entitySync.onCreateEntity(d));
        this.bus.on("editor:entity:delete", id => this.entitySync.onDeleteEntity(id));
        this.bus.on("editor:entity:update-script-id", p => this.entitySync.onUpdateEntityScriptId(p));
        this.bus.on("editor:entity:move", p => this.entitySync.onMoveEntity(p));
        this.bus.on("editor:entity:update-component", p => this.entitySync.onUpdateComponent(p));
        this.bus.on("editor:entity:update-prop", p => this.entitySync.onUpdateEntityProp(p));
        this.bus.on("editor:entity:patch-component", p => this.entitySync.onPatchComponent(p));
        this.bus.on("editor:entity:add-component", p => this.entitySync.onAddComponent(p));
        this.bus.on("editor:entity:remove-component", p => this.entitySync.onRemoveComponent(p));
        this.bus.on("editor:entity:replace", p => this.entitySync.onEntityReplace(p));

        // Layer Events
        this.bus.on("editor:layer:create", d => this.layerSync.onCreateLayer(d));
        this.bus.on("editor:layer:delete", id => this.layerSync.onDeleteLayer(id));
        this.bus.on("editor:layer:update-script-id", p => this.layerSync.onUpdateLayerScriptId(p));
        this.bus.on("editor:layer:update-prop", p => this.layerSync.onUpdateLayerProp(p));
        this.bus.on("editor:layer:reorder", p => this.layerSync.onReorderLayer(p));

        // Asset & Script Events
        this.bus.on("editor:asset:create", a => this.assetSync.onAssetCreate(a));
        this.bus.on("editor:asset:delete", id => this.assetSync.onAssetDelete(id));
        this.bus.on("editor:script:create", s => this.assetSync.onScriptCreate(s));
        this.bus.on("editor:script:update", p => this.assetSync.onScriptUpdate(p));
        this.bus.on("editor:script:delete", id => this.assetSync.onScriptDelete(id));
        this.bus.on("editor:scene:reload", payload => this.assetSync.onSceneReload(payload));

        // Prefab Events
        this.bus.on("editor:prefab:create", d => this.prefabSync.onCreatePrefab(d));
        this.bus.on("editor:prefab:update", p => this.prefabSync.onUpdatePrefab(p));
        this.bus.on("editor:prefab:delete", id => this.prefabSync.onDeletePrefab(id));
    }

    // Common Helper Utilities
    _findEntityById(id) {
        const allLayers = [...this.world.layersWorld, ...this.world.layersUI];
        for (const layer of allLayers) {
            if (!layer.entities) continue;
            for (const entity of layer.entities) {
                if (entity.id === id) return entity;
            }
        }
        return null;
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
}