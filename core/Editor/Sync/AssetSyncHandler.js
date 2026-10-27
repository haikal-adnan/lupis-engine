import SceneLoader from "../../Loader/SceneLoader.js";
import ScriptLoader from "../../Loader/ScriptLoader.js";

export class AssetSyncHandler {
    constructor(syncContext) {
        this.ctx = syncContext;
    }

    async onAssetCreate(asset) {
        if (this.ctx.assetLoader) {
            try {
                await this.ctx.assetLoader.loadAsset(this.ctx.world, [asset], this.ctx.game.baseURL);
                this.ctx.bus.emit("engine:asset:loaded", asset.id);
            } catch (error) {
                console.error(`[AssetSync] Failed to load asset ${asset.scriptId || asset.id}:`, error);
            }
        }
    }

    onAssetDelete(id) {
        if (this.ctx.world.assets?.textures?.[id]) {
            delete this.ctx.world.assets.textures[id];
        }
    }

    onScriptCreate(s) {
        if (!this.ctx.world.scripts) this.ctx.world.scripts = {};
        this.ctx.world.scripts[s.id] = {
            id: s.id,
            scriptId: s.scriptId,
            type: s.type,
            variables: s.localVariables || [],
            nodes: s.nodes || [],
            edges: s.edges || []
        };
    }

    onScriptUpdate({ id, updates }) {
        if (this.ctx.world.scripts?.[id]) {
            Object.assign(this.ctx.world.scripts[id], updates);
        }
    }

    onScriptDelete(id) {
        if (this.ctx.world.scripts?.[id]) {
            delete this.ctx.world.scripts[id];
        }
    }

    async onSceneReload(payload) {
        if (!payload) return;
        const { project, scene, prefabs, scripts, assets } = payload;
        this.ctx.isInternalUpdate = true;

        try {
            if (assets && Array.isArray(assets) && this.ctx.assetLoader) {
                await this.ctx.assetLoader.loadAsset(this.ctx.world, assets, this.ctx.game.baseURL);
            }

            if (this.ctx.game.selection) this.ctx.game.selection.clear();

            if (this.ctx.world.layersWorld) this.ctx.world.layersWorld.length = 0;
            if (this.ctx.world.layersUI) this.ctx.world.layersUI.length = 0;
            if (this.ctx.world.entities) this.ctx.world.entities.length = 0;

            if (this.ctx.world.scriptIdMap) this.ctx.world.scriptIdMap.clear();

            this.ctx.world.prefabs = {};
            if (prefabs && Array.isArray(prefabs)) {
                this.ctx.world.prefabs = Object.fromEntries(prefabs.map(p => [p.id, {
                    id: p.id,
                    scriptId: p.scriptId,
                    data: p.data,
                    children: p.children || []
                }]));
            }

            this.ctx.world.scripts = {};
            if (scripts && Array.isArray(scripts)) {
                this.ctx.world.scripts = Object.fromEntries(scripts.map(s => [s.id, {
                    id: s.id,
                    scriptId: s.scriptId,
                    type: s.type,
                    variables: s.localVariables || [],
                    nodes: s.nodes || [],
                    edges: s.edges || []
                }]));

                ScriptLoader.load(this.ctx.game, payload);
            }

            if (scene) {
                const safeScene = JSON.parse(JSON.stringify(scene));
                const sceneLoader = new SceneLoader(this.ctx.world, "editor");
                sceneLoader.loadScene(safeScene);
            }
        } catch (error) {
            console.error("[AssetSync] Failed to execute onSceneReload:", error);
        } finally {
            this.ctx.isInternalUpdate = false;
        }
    }
}