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

    destroyEntity(entity) {
        if (!entity || !this.world) return;

        const entityId = entity.id || entity._id;

        const children = this.world.entities.filter(e => e.parentId === entityId);
        for (const child of children) {
            this.destroyEntity(child); 
        }

        if (entity.parentId) {
            const parent = this.world.entities.find(e => (e.id === entity.parentId || e._id === entity.parentId));
            if (parent && Array.isArray(parent.children)) {
                parent.children = parent.children.filter(c => (c.id !== entityId && c._id !== entityId));
            }
        }

        if (this.world.scriptIdMap && entity.scriptId) {
            this.world.scriptIdMap.delete(entity.scriptId);
        }

        this.world.entities = this.world.entities.filter(e => (e.id !== entityId && e._id !== entityId));

        if (this.world.allLayers) {
            const layer = this.world.allLayers.find(l => l._id === entity.layerId);
            if (layer && Array.isArray(layer.entities)) {
                layer.entities = layer.entities.filter(e => (e.id !== entityId && e._id !== entityId));
            }
        }

        if (this.scriptSystem && typeof this.scriptSystem.removeEntityScripts === 'function') {
            this.scriptSystem.removeEntityScripts(entity);
        }
        if (this.physicsSystem && typeof this.physicsSystem.removeBody === 'function') {
            this.physicsSystem.removeBody(entity);
        }
        if (this.colliderSystem && typeof this.colliderSystem.removeCollider === 'function') {
            this.colliderSystem.removeCollider(entity);
        }
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

        this.world.currentSceneId = targetSceneData._id; 
        this.world.currentSceneScriptId = targetSceneData.scriptId || targetSceneData._id || null;
        this.world.currentSceneName = targetSceneData.name || ""; 

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
            if (this.loop) {
                this.loop.isFirstFrame = true;
            }
        }

        this.resumeGame();
    }

    restartScene() {
        const currentId = this.world.currentSceneId || this.world.currentSceneScriptId;
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
            this.animatorSystem.update(dt);
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

    spawnPrefab(prefabIdentifier, posX = 0, posY = 0, layerScriptId = "", zIndex = 0, customScriptId = "") {
        if (!this.world.prefabs) return null;

        let prefabData = null;
        let prefabChildren = [];

        for (const key in this.world.prefabs) {
            const p = this.world.prefabs[key];
            if (p._id === prefabIdentifier || p.name === prefabIdentifier) {
                prefabData = p.data;
                prefabChildren = p.children || [];
                break;
            }
        }

        if (!prefabData) return null;

        let targetLayerId = "layer_w_root";
        let targetLayer = null;
        if (this.world.allLayers) {
            if (layerScriptId) targetLayer = this.world.allLayers.find(l => l.scriptId === layerScriptId);
            if (!targetLayer) targetLayer = this.world.allLayers.find(l => l._id === targetLayerId);
            if (targetLayer) targetLayerId = targetLayer._id;
        }

        let baseOrderIndex = 0;
        if (targetLayer && targetLayer.entities) {
            baseOrderIndex = targetLayer.entities.reduce((max, e) => Math.max(max, e.orderIndex || 0), -1);
        }

        let finalRootScriptId = 'script_' + GenerateUUID(16); 

        if (typeof customScriptId === 'string' && customScriptId.trim() !== "") {
            let sanitizedId = customScriptId.toLowerCase().replace(/[^a-z0-9_]/g, '');

            if (sanitizedId !== '') {
                let isIdExist = false;
                if (this.world.scriptIdMap) {
                    isIdExist = this.world.scriptIdMap.has(sanitizedId);
                } else {
                    isIdExist = this.world.entities.some(e => e.scriptId === sanitizedId);
                }

                if (!isIdExist) {
                    finalRootScriptId = sanitizedId;
                } else {
                    console.warn(`[Spawn Prefab] Script ID '${sanitizedId}' sudah ada. Generate ID acak.`);
                }
            }
        }

        const idMap = {};
        const allNewData = [];
        const uniqueSuffix = GenerateUUID(16).substring(0, 8);

        const rootData = JSON.parse(JSON.stringify(prefabData));
        const newRootId = 'ent_' + GenerateUUID(16);
        idMap[rootData._id] = newRootId;

        baseOrderIndex++;

        rootData._id = newRootId;
        rootData.scriptId = finalRootScriptId; 
        rootData.layerId = targetLayerId;
        rootData.zIndex = zIndex;
        rootData.orderIndex = baseOrderIndex;
        rootData.parentId = null; 

        if (rootData.components?.Transform) {
            rootData.components.Transform.x = posX;
            rootData.components.Transform.y = posY;
        } else if (rootData.components?.UITransform) {
            rootData.components.UITransform.x = posX;
            rootData.components.UITransform.y = posY;
        }
        allNewData.push(rootData);

        if (prefabChildren && prefabChildren.length > 0) {
            const clonedChildren = prefabChildren.map(child => {
                const c = JSON.parse(JSON.stringify(child));
                const newChildId = 'ent_' + GenerateUUID(16);
                
                idMap[c._id] = newChildId;
                baseOrderIndex++; 

                c._id = newChildId;
                c.scriptId = `${c.scriptId}_${uniqueSuffix}`;
                c.layerId = targetLayerId; 
                c.zIndex = zIndex; 
                c.orderIndex = baseOrderIndex; 
                return c;
            });

            clonedChildren.forEach(c => {
                c.parentId = idMap[c.parentId] || newRootId;
            });
            allNewData.push(...clonedChildren);
        }

        const sceneLoader = new SceneLoader(this.world, Config.ENGINE_MODE);
        const createdEntities = new Map();
        let rootEntity = null;

        for (const data of allNewData) {
            const entity = sceneLoader._createEntityInstance(data);
            if (!entity) continue;
            
            if (data._id === newRootId) rootEntity = entity;
            createdEntities.set(entity.id || entity._id, entity);
            
            this.world.addEntity(entity);
            if (this.world.scriptIdMap && entity.scriptId) this.world.scriptIdMap.set(entity.scriptId, entity);
            if (targetLayer) targetLayer.entities.push(entity);
        }

        for (const entity of createdEntities.values()) {
            if (!entity.parentId) continue;
            let parent = createdEntities.get(entity.parentId) || this.world.entities.find(e => (e.id === entity.parentId || e._id === entity.parentId));
            
            if (parent) {
                if (typeof parent.addChild === 'function') parent.addChild(entity);
                else {
                    if (!parent.children) parent.children = [];
                    if (!parent.children.find(c => (c.id === entity.id || c._id === entity.id))) parent.children.push(entity);
                }
            }
        }

        if (targetLayer) {
            targetLayer.entities.sort((a, b) => {
                if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
                return (a.orderIndex || 0) - (b.orderIndex || 0);
            });
        }

        if (Config.ENGINE_MODE === "runtime") {
            for (const entity of createdEntities.values()) {
                this._initializeSingleEntityScript(entity);
            }
        }

        return rootEntity;
    }
    async cloneEntity(sourceEntity) {
        if (!sourceEntity) return null;

        const clonedData = JSON.parse(JSON.stringify(sourceEntity));
        
        const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
        const newId = 'ent_clone_' + generateId();
        const newScriptId = 'script_clone_' + generateId();
        
        clonedData._id = newId;
        clonedData.id = newId;
        clonedData.scriptId = newScriptId;
        clonedData.children = [];

        const sceneLoader = new SceneLoader(this.world, Config.ENGINE_MODE);
        const entity = sceneLoader._createEntityInstance(clonedData);

        if (!entity) return null;

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

        if (entity.parentId) {
            const parent = this.world.entities.find(e => e.id === entity.parentId);
            if (parent) parent.addChild(entity);
        }

        if (Config.ENGINE_MODE === "runtime") {
            this._initializeSingleEntityScript(entity);
        }

        return entity;
    }

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

                const newScriptData = { ...asset, variables: mergedVars };
                this.scriptSystem.add(newScriptData, entity);
                
                const newRunner = this.scriptSystem.runners[this.scriptSystem.runners.length - 1];
                newRunner.start();
            }
        });
    }
}