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
import AnimatorSystem from "../System/AnimatorSystem.js";
import TransitionSystem from "../System/TransitionSystem.js";
import AudioSystem from "../System/AudioSystem.js";

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
        this.animatorSystem = new AnimatorSystem(this);
        this.transitionSystem = new TransitionSystem(this);
        this.audioSystem = new AudioSystem(this);
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

        // [DITAMBAHKAN] Variabel untuk menampung antrean scene yang akan dimuat
        this._pendingSceneLoad = null; 
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

    // [DITAMBAHKAN] Fungsi untuk memasukkan pemuatan scene ke dalam antrean
    queueLoadScene(sceneIdentifier) {
        this._pendingSceneLoad = sceneIdentifier;
    }

    loadScene(sceneIdentifier) {
        if (!this._sceneDataCache || this._sceneDataCache.length === 0) {
            console.warn("[Game] Tidak dapat memuat scene: Cache scene kosong.");
            return;
        }

        const searchKey = String(sceneIdentifier).trim().toLowerCase();

        const rawSceneData = this._sceneDataCache.find(s => 
            (s.name && s.name.trim().toLowerCase() === searchKey) || 
            (s._id === sceneIdentifier)
        );

        if (!rawSceneData) {
            console.error(`[Game] Gagal memuat: Scene '${sceneIdentifier}' tidak ditemukan.`);
            return;
        }

        const targetSceneData = JSON.parse(JSON.stringify(rawSceneData));

        this.pauseGame();

        if (this.camera) {
            this.camera.clearTarget(); 
            this.camera.snapTo(0, 0); 
        }

        if (this.cameraController) {
            this.cameraController.enabled = false;
        }

        this.world.entities = [];
        this.world.layersWorld = [];
        this.world.layersUI = [];
        
        if (this.world.scriptIdMap) {
            this.world.scriptIdMap.clear();
        }

        if (this.scriptSystem && typeof this.scriptSystem.clear === 'function') {
            this.scriptSystem.clear();
        }

        this.world.currentSceneScriptId = targetSceneData.scriptId || targetSceneData._id || null;

        const sceneLoader = new SceneLoader(this.world, Config.ENGINE_MODE);
        sceneLoader.loadScene(targetSceneData);

        const rw = this.world.settings.ui?.width || 1920;
        const rh = this.world.settings.ui?.height || 1080;
        this.camera.snapTo(rw / 2, rh / 2);

        if (Config.ENGINE_MODE === "runtime") {
            this.camera.scale = 1;
        } else {
            this.camera.scale = 0.5;
        }

        if (this.cameraController) {
            this.cameraController.enabled = true;
        }

        if (Config.ENGINE_MODE === "runtime") {
            this._initializeEntityScripts();
            this.scriptSystem.startAll();
            this.audioSystem.startSceneAutoplay(this.world);
        }

        this.resumeGame();
    }

    restartScene() {
        const currentId = this.world.currentSceneScriptId;
        if (currentId) {
            this.queueLoadScene(currentId);
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
        // [DITAMBAHKAN] Cek apakah ada antrean pindah scene di awal frame
        if (this._pendingSceneLoad !== null) {
            this.loadScene(this._pendingSceneLoad);
            this._pendingSceneLoad = null;
            return; // Hentikan update frame ini agar script lama tidak tereksekusi di world baru
        }

        if (Config.ENGINE_MODE === "runtime") {
            this.transitionSystem.update(dt);
            this.animatorSystem.update(dt)
            this.physicsSystem.update(dt);
            this.scriptSystem.update(dt);
            this.audioSystem.update();
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