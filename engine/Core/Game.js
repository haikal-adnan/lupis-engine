import GameLoop from "../Loop/GameLoop.js";
import World from "./World.js";
import Camera from "../Util/Camera.js";
import { GenerateUUID } from "../Util/GenerateUUID.js";
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
            
            this.audioSystem.handleSceneTransition(this.world.entities);
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
        if (this._pendingSceneLoad !== null) {
            this.loadScene(this._pendingSceneLoad);
            this._pendingSceneLoad = null;
            return; 
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

// Tambahkan properti counter di constructor Game
// this._entityCounter = 0;

    spawnPrefab(prefabIdentifier, posX = 0, posY = 0, layerScriptId = "", zIndex = 0) {
        if (!this.world.prefabs) return null;

        // 1. Cari data prefab
        let prefabData = null;
        for (const key in this.world.prefabs) {
            const p = this.world.prefabs[key];
            if (p._id === prefabIdentifier || p.name === prefabIdentifier) {
                prefabData = p.data;
                break;
            }
        }
        
        if (!prefabData) {
            console.warn(`[LupisEngine] Spawn gagal: Prefab '${prefabIdentifier}' tidak ditemukan.`);
            return null;
        }

        // 2. Tentukan Target Layer
        let targetLayerId = "layer_w_root";
        if (layerScriptId && this.world.allLayers) {
            const foundLayer = this.world.allLayers.find(l => l.scriptId === layerScriptId);
            if (foundLayer) targetLayerId = foundLayer._id;
        }

        // 3. Deep Copy (PENTING: Mencegah bug kecepatan x4 karena shared reference)
        const instanceData = JSON.parse(JSON.stringify(prefabData));

        // 4. Gunakan Fungsi Utilitas Kamu untuk ID Unik
        const uniqueId = GenerateUUID(16);
        
        instanceData._id = 'ent_' + uniqueId;
        instanceData.scriptId = 'script_' + uniqueId;
        instanceData.layerId = targetLayerId;
        instanceData.zIndex = zIndex;

        // 5. Inisialisasi Instance
        const sceneLoader = new SceneLoader(this.world, Config.ENGINE_MODE);
        const entity = sceneLoader._createEntityInstance(instanceData);

        if (!entity) return null;

        // 6. Set Posisi
        if (entity.components.Transform) {
            entity.components.Transform.x = posX;
            entity.components.Transform.y = posY;
        }

        // 7. Registrasi ke World & Layer
        this.world.addEntity(entity);
        
        if (this.world.scriptIdMap) {
            this.world.scriptIdMap.set(entity.scriptId, entity);
        }

        if (this.world.allLayers) {
            const layer = this.world.allLayers.find(l => l._id === entity.layerId);
            if (layer) {
                layer.entities.push(entity);
                layer.entities.sort((a, b) => {
                    if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
                    return (a.orderIndex || 0) - (b.orderIndex || 0);
                });
            }
        }

        // 8. Jalankan Script di Runtime
        if (Config.ENGINE_MODE === "runtime") {
            this._initializeSingleEntityScript(entity);
        }

        return entity;
    }

    destroyEntity(entity) {
        if (!entity) return;

        // 1. Rekursif hapus semua children terlebih dahulu
        if (entity.children && entity.children.length > 0) {
            const childrenToDestroy = [...entity.children];
            childrenToDestroy.forEach(child => this.destroyEntity(child));
        }

        // 2. Hapus dari World
        const index = this.world.entities.findIndex(e => e.id === entity.id);
        if (index !== -1) {
            this.world.entities.splice(index, 1);
        }

        // Hapus dari map pencarian Script ID
        if (this.world.scriptIdMap && entity.scriptId) {
            this.world.scriptIdMap.delete(entity.scriptId);
        }

        // 3. Hapus dari Layer
        if (this.world.allLayers) {
            const layer = this.world.allLayers.find(l => l._id === entity.layerId);
            if (layer) {
                const layerIdx = layer.entities.findIndex(e => e.id === entity.id);
                if (layerIdx !== -1) {
                    layer.entities.splice(layerIdx, 1);
                }
            }
        }

        // 4. Hapus referensi dari Parent (jika punya parent)
        if (entity.parentId) {
            const parent = this.world.entities.find(e => e.id === entity.parentId);
            if (parent) parent.removeChild(entity.id);
        }

        // 5. Matikan dan bersihkan Script yang jalan di entity ini
        if (this.scriptSystem && this.scriptSystem.runners) {
            this.scriptSystem.runners = this.scriptSystem.runners.filter(runner => {
                if (runner.owner && runner.owner.id === entity.id) {
                    if (typeof runner.destroy === 'function') runner.destroy();
                    return false; // Buang dari array runners
                }
                return true;
            });
        }
        
        // Catatan: Jika kamu memakai Physics engine seperti Matter.js, 
        // pastikan untuk menghapus bodynya di sini:
        // if (this.physicsSystem) this.physicsSystem.removeBody(entity);
    }

    async cloneEntity(sourceEntity) {
        if (!sourceEntity) return null;

        // 1. Deep clone objek entity
        const clonedData = JSON.parse(JSON.stringify(sourceEntity));
        
        // 2. Buat ID baru
        const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
        const newId = 'ent_clone_' + generateId();
        const newScriptId = 'script_clone_' + generateId();
        
        clonedData._id = newId;
        clonedData.id = newId;
        clonedData.scriptId = newScriptId;
        
        // Secara default clone tidak menduplikat children untuk menghindari loop berlebih.
        // Jika ingin duplikat anak-anaknya, ini harus dibuat rekursif.
        clonedData.children = []; 

        // 3. Jadikan instance class Entity
        const sceneLoader = new SceneLoader(this.world, Config.ENGINE_MODE);
        const entity = sceneLoader._createEntityInstance(clonedData);

        if (!entity) return null;

        // 4. Masukkan ke World & Layer
        this.world.addEntity(entity);
        if (this.world.scriptIdMap) {
            this.world.scriptIdMap.set(entity.scriptId, entity);
        }

        if (this.world.allLayers) {
            const layer = this.world.allLayers.find(l => l._id === entity.layerId);
            if (layer) {
                layer.entities.push(entity);
                layer.entities.sort((a, b) => {
                    if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
                    return a.orderIndex - b.orderIndex;
                });
            }
        }

        // 5. Jika sumber memiliki parent, masukkan clone ini sebagai saudaranya (sibling)
        if (entity.parentId) {
            const parent = this.world.entities.find(e => e.id === entity.parentId);
            if (parent) parent.addChild(entity);
        }

        // 6. Jalankan Script-nya
        if (Config.ENGINE_MODE === "runtime") {
            this._initializeSingleEntityScript(entity);
        }

        return entity;
    }

    // Fungsi Helper untuk menginisialisasi script hanya untuk SATU entity saja.
    // (Agar saat spawn/clone, kita tidak me-restart semua script yang sudah jalan)
    _initializeSingleEntityScript(entity) {
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

                // Tambahkan runner baru ke scriptSystem
                const newScriptData = { ...asset, variables: mergedVars };
                this.scriptSystem.add(newScriptData, entity);
                
                // Cari runner yang baru ditambahkan (selalu di index terakhir)
                const newRunner = this.scriptSystem.runners[this.scriptSystem.runners.length - 1];
                newRunner.start();
            }
        });
    }

}