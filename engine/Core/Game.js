import GameLoop from "../Loop/GameLoop.js";
import World from "./World.js";
import Camera from "../Util/Camera.js";
import Config from "./Config.js";
import VariableManager from "../Script/VariableManager.js";
import EventManager from "../Script/EventManager.js";
import ScriptSystem from "../Script/ScriptSystem.js";
import ColliderSystem from "../System/ColliderSystem.js";
import PhysicsSystem from "../System/PhysicsSystem.js";
import SceneLoader from "../Loader/SceneLoader.js"; 

export default class Game {
    constructor() {
        this.world = new World();
        this.camera = new Camera(0, 0);
        this.camera.scale = 1;
        this.renderer = null;
        this.colliderSystem = new ColliderSystem(this);
        this.variables = new VariableManager();
        this.scriptSystem = new ScriptSystem(this);
        this.physicsSystem = new PhysicsSystem(this);
        this.audio = null;
        this.cameraController = null;
        this.rulers = null;
        this.grid = null;
        this.selection = null;
        this.transform = null;
        this.pointerCoords = null;
        this.tilemapTool = null;
        this.history = null;
        this.syncSystem = null;
        this.isPaused = false;
        this.isRunning = false;
        this.loop = null;
        
        this._sceneDataCache = []; 
    }

    initLoop() {
        this.loop = new GameLoop(this);
    }

    start() {
        if (!this.loop) return;
        this.loop.start();
    }

    quitGame() { 
        if (this.loop) this.loop.stop(); 
    }

    destroy() {
        this.quitGame();
        
        if (this.renderer && typeof this.renderer.destroy === 'function') {
            this.renderer.destroy();
        }
        
        this.world = null;
        this.renderer = null;
        this.syncSystem = null;
    }

    setSceneCache(scenesArray) {
        if (Array.isArray(scenesArray)) {
            this._sceneDataCache = scenesArray;
        }
    }

    loadScene(sceneIdentifier) {
        if (!this._sceneDataCache || this._sceneDataCache.length === 0) {
            console.warn("[Game] Tidak dapat memuat scene: Cache scene kosong.");
            return;
        }

        const targetSceneData = this._sceneDataCache.find(
            s => s._id === sceneIdentifier || 
                 s.scriptId === sceneIdentifier || 
                 (s.name && s.name.toLowerCase() === String(sceneIdentifier).toLowerCase())
        );

        if (!targetSceneData) {
            console.error(`[Game] Gagal memuat: Scene '${sceneIdentifier}' tidak ditemukan.`);
            return;
        }

        this.pauseGame();

        if (this.camera) {
            this.camera.clearTarget();
        }

        if (this.cameraController) {
            this.cameraController.enabled = false;
        }

        this.world.entities = [];
        this.world.layersWorld = [];
        this.world.layersUI = [];
        if (this.world.scriptIdMap) this.world.scriptIdMap.clear();

        if (this.scriptSystem && typeof this.scriptSystem.clear === 'function') {
            this.scriptSystem.clear();
        }

        this.world.currentSceneScriptId = targetSceneData.scriptId || targetSceneData._id;

        const sceneLoader = new SceneLoader(this.world, Config.ENGINE_MODE);
        sceneLoader.loadScene(targetSceneData);

        let newX, newY, newScale;
        if (targetSceneData.camera && targetSceneData.camera.x !== undefined) {
            newX = targetSceneData.camera.x;
            newY = targetSceneData.camera.y;
            newScale = targetSceneData.camera.scale || 1;
        } else {
            const { width: rw, height: rh } = this.world.settings.ui;
            newX = rw / 2;
            newY = rh / 2;
            newScale = (Config.ENGINE_MODE === "editor") ? 0.5 : 1;
        }

        this.camera.snapTo(newX, newY);
        this.camera.scale = newScale;

        if (this.cameraController) {
            this.cameraController.enabled = true;
        }

        if (Config.ENGINE_MODE === "runtime") {
            this._initializeEntityScripts();
            this.scriptSystem.startAll();
        }

        this.resumeGame();
    }

    restartScene() {
        const currentId = this.world.currentSceneScriptId;
        if (currentId) {
            this.loadScene(currentId);
        } else {
            console.warn("[Game] Tidak dapat me-restart: ID Scene aktif tidak ditemukan di world.");
        }
    }

    _initializeEntityScripts() {
        this.world.entities.forEach(entity => {
            const controller = entity.components?.ScriptController;
            if (!Array.isArray(controller?.data)) return;

            controller.data.forEach(instance => {
                const asset = this.world.scripts[instance.assetId];
                if (asset) {
                    const instanceVars = instance.variables || {};

                    const mergedVars = asset.variables.map(v => ({
                        ...v,
                        defaultValue: instanceVars[v._id] !== undefined ? instanceVars[v._id] : v.defaultValue
                    }));

                    this.scriptSystem.add({
                        ...asset,
                        variables: mergedVars
                    }, entity);
                }
            });
        });
    }   

    update(dt) {
        if (Config.ENGINE_MODE === "runtime") {
            this.physicsSystem.update(dt);
            this.scriptSystem.update(dt);
            
            if (this.camera && this.renderer) {
                this.camera.update(dt, this.world, this.renderer.gl.canvas);
            }
        }
    }

    render(alpha) {
        const cam = this.camera; 
        
        if (this.cameraController) this.cameraController.update();

        if (Config.ENGINE_MODE === "editor") {
            if (this.history) this.history.update();
            if (this.tilemapTool) this.tilemapTool.update();
            if (this.selection) this.selection.update();
            if (this.transform) this.transform.update();
            if (this.pointerCoords) this.pointerCoords.update();
        }

        if (this.renderer) {
            this.renderer.render(this.world, cam, this, alpha);
        }
    }

    pauseGame() { this.isPaused = true; }
    resumeGame() { this.isPaused = false; }
    togglePause() { if (this.isPaused) this.resumeGame(); else this.pauseGame(); }
}