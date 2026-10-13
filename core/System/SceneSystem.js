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
            name: s.name || s.id,
            scriptId: s.scriptId
        }));
    }

    getCurrentScene() {
        return this._currentSceneData;
    }

    getCurrentSceneName() {
        return this._currentSceneData?.name || this.game.world.currentSceneName || "";
    }

    getCurrentSceneId() {
        return this._currentSceneData?.id || this.game.world.currentSceneId || null;
    }

    queueLoadScene(sceneIdentifier) {
        this._pendingSceneLoad = sceneIdentifier;
    }

    loadInitialScene() {
        if (!this._sceneDataCache || this._sceneDataCache.length === 0) {
            console.warn("[SceneSystem] Tidak dapat restart: Cache scene kosong.");
            return;
        }

        // Memprioritaskan _initialSceneId, jika tidak ada fallback ke scene pertama
        const targetScene = this._sceneDataCache.find(s => s.id === this._initialSceneId) || this._sceneDataCache[0];

        if (targetScene) {
            this.queueLoadScene(targetScene.id);
        }
    }

    loadScene(sceneIdentifier) {
        if (!this._sceneDataCache || this._sceneDataCache.length === 0) {
            console.warn("[SceneSystem] Tidak dapat memuat scene: Cache scene kosong.");
            return;
        }

        const searchKey = String(sceneIdentifier).trim().toLowerCase();

        const rawSceneData = this._sceneDataCache.find(s =>
            (s.name && s.name.trim().toLowerCase() === searchKey) ||
            (s.id === sceneIdentifier)
        );

        if (!rawSceneData) {
            console.error(`[SceneSystem] Gagal memuat: Scene '${sceneIdentifier}' tidak ditemukan.`);
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
        world.currentSceneName = targetSceneData.name || "";

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

            const activeSceneName = this.getCurrentSceneName();
            this.game.events.emit('scene:start', activeSceneName);
        }

        this.game.resumeGame();
    }

    restartScene() {
        const currentId = this.getCurrentSceneId();
        if (currentId) {
            this.queueLoadScene(currentId);
        } else {
            console.warn("[SceneSystem] Tidak dapat me-restart: ID Scene aktif tidak ditemukan.");
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