import SceneLoader from "../Loader/SceneLoader.js";
import Config from "../Core/Config.js";

export default class SceneSystem {
    constructor(game) {
        this.game = game;
        
        this._sceneDataCache = []; 
        this._currentSceneData = null; 
        this._pendingSceneLoad = null;
        this._initialSceneId = null;
    }

    setInitialSceneId(sceneId) {
        this._initialSceneId = sceneId;
    }

    setSceneCache(scenesArray, initialSceneId = null) {
        if (Array.isArray(scenesArray)) {
            this._sceneDataCache = scenesArray;
        }
        if (initialSceneId) {
            this._initialSceneId = initialSceneId;
        }
    }

    getAvailableScenes() {
        return this._sceneDataCache.map(s => ({
            id: s.id,
            scriptId: s.scriptId || s.id
        }));
    }

    getCurrentScene() {
        return this._currentSceneData;
    }

    getCurrentSceneScriptId() {
        return this._currentSceneData?.scriptId || this.game.world.currentSceneScriptId || "";
    }

    getCurrentSceneId() {
        return this._currentSceneData?.id || this.game.world.currentSceneId || null;
    }

    queueLoadScene(sceneIdentifier) {
        this._pendingSceneLoad = sceneIdentifier;
    }

    loadInitialScene() {
        if (!this._sceneDataCache || this._sceneDataCache.length === 0) {
            console.warn("[SceneSystem] Cannot restart: Scene cache is empty.");
            return;
        }

        // Prioritize _initialSceneId, fallback to first scene if not found
        const targetScene = this._sceneDataCache.find(s => s.id === this._initialSceneId) || this._sceneDataCache[0];

        if (targetScene) {
            this.queueLoadScene(targetScene.id);
        }
    }

    loadScene(sceneIdentifier) {
        if (!this._sceneDataCache || this._sceneDataCache.length === 0) {
            console.warn("[SceneSystem] Cannot load scene: Scene cache is empty.");
            return;
        }

        const searchKey = String(sceneIdentifier).trim().toLowerCase();

        const rawSceneData = this._sceneDataCache.find(s =>
            (s.scriptId && s.scriptId.trim().toLowerCase() === searchKey) ||
            (s.id === sceneIdentifier)
        );

        if (!rawSceneData) {
            console.error(`[SceneSystem] Failed to load: Scene '${sceneIdentifier}' not found.`);
            return;
        }

        const targetSceneData = JSON.parse(JSON.stringify(rawSceneData));
        this._currentSceneData = targetSceneData;

        this.game.pauseGame();

        if (this.game.camera) {
            this.game.camera.clearTarget();
            this.game.camera.snapTo(0, 0);
        }

        if (this.game.cameraController) {
            this.game.cameraController.enabled = false;
        }

        const world = this.game.world;
        world.entities = [];
        world.layersWorld = [];
        world.layersUI = [];

        if (world.scriptIdMap) {
            world.scriptIdMap.clear();
        }

        if (this.game.scriptSystem && typeof this.game.scriptSystem.clear === 'function') {
            this.game.scriptSystem.clear();
        }

        world.currentSceneId = targetSceneData.id;
        world.currentSceneScriptId = targetSceneData.scriptId || targetSceneData.id || null;

        const sceneLoader = new SceneLoader(world, Config.ENGINE_MODE);
        sceneLoader.loadScene(targetSceneData);

        const rw = world.settings.ui?.width || 1920;
        const rh = world.settings.ui?.height || 1080;
        this.game.camera.snapTo(rw / 2, rh / 2);

        if (Config.ENGINE_MODE === "runtime") {
            this.game.camera.scale = 1;
        } else {
            this.game.camera.scale = 0.5;
        }

        if (this.game.cameraController) {
            this.game.cameraController.enabled = true;
        }

        if (Config.ENGINE_MODE === "runtime") {
            this._initializeEntityScripts();
            this.game.scriptSystem.startAll();
            this.game.audioSystem.handleSceneTransition(world.entities);
            this.game.audioSystem.startSceneAutoplay(world);

            if (this.game.loop) {
                this.game.loop.isFirstFrame = true;
            }

            const activeSceneScriptId = this.getCurrentSceneScriptId();
            this.game.events.emit('scene:start', activeSceneScriptId);
        }

        this.game.resumeGame();
    }

    restartScene() {
        const currentId = this.getCurrentSceneId();
        if (currentId) {
            this.queueLoadScene(currentId);
        } else {
            console.warn("[SceneSystem] Cannot restart: Active scene ID not found.");
        }
    }

    update(dt) {
        if (this._pendingSceneLoad !== null) {
            const nextScene = this._pendingSceneLoad;
            this._pendingSceneLoad = null;
            this.loadScene(nextScene);
        }
    }

    _initializeEntityScripts() {
        this.game.world.entities.forEach(entity => {
            const controller = entity.components?.ScriptController;
            if (!Array.isArray(controller?.data)) return;

            controller.data.forEach(instance => {
                const asset = this.game.world.scripts[instance.assetId];
                if (asset) {
                    const instanceVars = instance.variables || {};
                    const mergedVars = asset.variables.map(v => ({
                        ...v,
                        defaultValue: instanceVars[v.id] !== undefined ? instanceVars[v.id] : v.defaultValue
                    }));

                    this.game.scriptSystem.add({
                        ...asset,
                        variables: mergedVars
                    }, entity);
                }
            });
        });
    }
}