(function() {
const __reg = globalThis.__LUPIS_REGISTRY__ = globalThis.__LUPIS_REGISTRY__ || { m: {}, c: {} };
// === Module: Core/Config.js ===
__reg.m["Core/Config.js"] = function(__require, __exports, __module) {
class Configs {
    constructor() {
        this.ENGINE_MODE = "runtime"; 

        this.EDITOR = {
            CAMERA_CONTROLLER: true,
            RULERS: true,
            SELECTION: true,
            POINTER: true,
            MOVE: true,
            TRANSFORM: true,
            GRID: true
        };
    }
}

const Config = new Configs();
__exports.default = Config;
};
// === Module: Core/Entity.js ===
__reg.m["Core/Entity.js"] = function(__require, __exports, __module) {
class Entity {
    constructor(id) {
        this.id = id;
        this.scriptId = null;
        
        this.active = true; 
        this.visible = true;
        this.locked = false;

        this.type = "entity";    
        this.tags = [];   
        this.layerId = "layer_root"; 
        this.prefabId = null;

        this.zIndex = 0;
        this.orderIndex = 0;

        this.parentId = null; 
        this.children = []; 

        this.components = {};

        this.isDirty = false;
        
        this._editor = {}; 
    }

    get tag() {
        return (this.tags && this.tags.length > 0) ? this.tags[0] : "untagged";
    }

    set tag(val) {
        if (!val || (typeof val === 'string' && val.toLowerCase() === "untagged")) {
            this.tags = [];
        } else if (Array.isArray(val)) {
            const list = [];
            for (const item of val) {
                const clean = String(item || '').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
                if (clean && !list.some(t => t.toLowerCase() === clean.toLowerCase())) {
                    list.push(clean);
                }
            }
            this.tags = list;
        } else {
            const clean = String(val).trim();
            if (clean) {
                this.tags = [clean];
            }
        }
    }

    hasTag(tag) {
        if (!tag || !Array.isArray(this.tags)) return false;
        const target = String(tag).trim().toLowerCase();
        return this.tags.some(t => String(t).trim().toLowerCase() === target);
    }

    hasAnyTag(tagList = []) {
        if (!Array.isArray(tagList)) return false;
        return tagList.some(t => this.hasTag(t));
    }

    hasAllTags(tagList = []) {
        if (!Array.isArray(tagList) || tagList.length === 0) return false;
        return tagList.every(t => this.hasTag(t));
    }

    addTag(tag) {
        const clean = String(tag || '').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        if (!clean) return false;
        if (!Array.isArray(this.tags)) this.tags = [];
        if (!this.hasTag(clean)) {
            this.tags.push(clean);
            return true;
        }
        return false;
    }

    removeTag(tag) {
        if (!tag || !Array.isArray(this.tags)) return false;
        const target = String(tag).trim().toLowerCase();
        const initialLen = this.tags.length;
        this.tags = this.tags.filter(t => String(t).trim().toLowerCase() !== target);
        return this.tags.length !== initialLen;
    }

    addComponent(name, data) {
        this.components[name] = data;
        if (name === 'Transform' || name === 'UITransform') this.isDirty = true;
    }

    getComponent(name) {
        return this.components[name];
    }
    
    addChild(entity) {
        if (this.children.some(c => c.id === entity.id)) return;
        if (entity.id === this.id) return;

        entity.parentId = this.id;
        this.children.push(entity);
    }

    removeChild(childId) {
        const index = this.children.findIndex(c => c.id === childId);
        
        if (index !== -1) {
            this.children.splice(index, 1);
        }
    }
}

__exports.default = Entity;
};
// === Module: Core/Game.js ===
__reg.m["Core/Game.js"] = function(__require, __exports, __module) {
const __imp_0 = __require("Loop/GameLoop.js"); const GameLoop = __imp_0.default !== undefined ? __imp_0.default : __imp_0;
const __imp_1 = __require("Core/World.js"); const World = __imp_1.default !== undefined ? __imp_1.default : __imp_1;
const __imp_2 = __require("Util/Camera.js"); const Camera = __imp_2.default !== undefined ? __imp_2.default : __imp_2;
const __imp_3 = __require("Core/Config.js"); const Config = __imp_3.default !== undefined ? __imp_3.default : __imp_3;
const __imp_4 = __require("Script/VariableManager.js"); const VariableManager = __imp_4.default !== undefined ? __imp_4.default : __imp_4;
const __imp_5 = __require("Script/ScriptSystem.js"); const ScriptSystem = __imp_5.default !== undefined ? __imp_5.default : __imp_5;
const __imp_6 = __require("System/ColliderSystem.js"); const ColliderSystem = __imp_6.default !== undefined ? __imp_6.default : __imp_6;
const __imp_7 = __require("System/PhysicsSystem.js"); const PhysicsSystem = __imp_7.default !== undefined ? __imp_7.default : __imp_7;
const __imp_8 = __require("System/AnimatorSystem.js"); const AnimatorSystem = __imp_8.default !== undefined ? __imp_8.default : __imp_8;
const __imp_9 = __require("System/TransitionSystem.js"); const TransitionSystem = __imp_9.default !== undefined ? __imp_9.default : __imp_9;
const __imp_10 = __require("System/AudioSystem.js"); const AudioSystem = __imp_10.default !== undefined ? __imp_10.default : __imp_10;
const __imp_11 = __require("System/PointerRaycast.js"); const PointerRaycast = __imp_11.default !== undefined ? __imp_11.default : __imp_11;
const __imp_12 = __require("System/SceneSystem.js"); const SceneSystem = __imp_12.default !== undefined ? __imp_12.default : __imp_12;
const __imp_13 = __require("System/PrefabSystem.js"); const PrefabSystem = __imp_13.default !== undefined ? __imp_13.default : __imp_13;
const __imp_14 = __require("System/EntitySystem.js"); const EntitySystem = __imp_14.default !== undefined ? __imp_14.default : __imp_14;
const __imp_15 = __require("System/LayerSystem.js"); const LayerSystem = __imp_15.default !== undefined ? __imp_15.default : __imp_15;
const __imp_16 = __require("System/TilemapSystem/TilemapSystem.js"); const TilemapSystem = __imp_16.default !== undefined ? __imp_16.default : __imp_16;
const __imp_17 = __require("Script/ContextSystem.js"); const ContextSystem = __imp_17.default !== undefined ? __imp_17.default : __imp_17;
const __imp_18 = __require("Script/EventManager.js"); const EventManager = __imp_18.default !== undefined ? __imp_18.default : __imp_18;
const __imp_19 = __require("Input/InputManager.js"); const InputManager = __imp_19.default !== undefined ? __imp_19.default : __imp_19;

class Game {
    constructor() {
        this.world = new World();
        this.camera = new Camera(0, 0);
        this.pointerRaycast = PointerRaycast;
        this.camera.scale = 1;
        this.renderer = null;
        this.deltaTime = 0;

        this.events = new EventManager();
        this.input = null; 

        this.colliderSystem = new ColliderSystem(this);
        this.variables = new VariableManager();
        this.scriptSystem = new ScriptSystem(this);
        this.physicsSystem = new PhysicsSystem(this);
        this.animatorSystem = new AnimatorSystem(this);
        this.transitionSystem = new TransitionSystem(this);
        this.audioSystem = new AudioSystem(this);
        this.sceneSystem = new SceneSystem(this);
        this.prefabSystem = new PrefabSystem(this);
        this.entitySystem = new EntitySystem(this);
        this.layerSystem = new LayerSystem(this);
        this.tilemapSystem = new TilemapSystem(this);
        this.contextSystem = new ContextSystem(this); 

        this.audio = null;
        this.cameraController = null;
        this.rulers = null;
        this.grid = null;
        this.selection = null;
        this.transform = null;
        this.pointerCoords = null;
        this.tilemapTool = null;
        this.shapeTool = null;
        this.history = null;
        this.syncSystem = null;
        this.isPaused = false;
        this.isRunning = false;
        this.hasStarted = false;
        this.loop = null;
    }

    setCanvas(canvasElement) {
        if (!canvasElement) return;
        if (this.input && typeof this.input.destroy === 'function') {
            this.input.destroy();
        }
        this.input = new InputManager(canvasElement, this.events, this);
    }

    initLoop() {
        this.loop = new GameLoop(this);
    }

    start() {
        this.hasStarted = true;
        if (this.loop) {
            this.loop.start();
        }
        this.events.emit('game:start');
    }

    restartGame() {
        this.isPaused = false;

        // Reset all global variables back to initial values
        if (this.variables && typeof this.variables.resetGlobals === 'function') {
            this.variables.resetGlobals();
        }

        // Queue loading of initial scene
        if (this.sceneSystem) {
            this.sceneSystem.loadInitialScene();
        }

        this.events.emit('game:restart');
    }

    quitGame(options = {}) {
        const closeWindow = typeof options === 'boolean'
            ? options
            : (options && typeof options === 'object' && 'closeWindow' in options ? options.closeWindow : true);

        this.events.emit('game:quit');

        if (this.loop && typeof this.loop.stop === 'function') {
            this.loop.stop();
        }

        if (!closeWindow) {
            return;
        }

        if (typeof window !== 'undefined') {
            // Never attempt to close the window if running within the editor
            if (Config.ENGINE_MODE === 'editor') {
                return;
            }

            // 1. Electron standalone build environment
            if (window.electronAPI && typeof window.electronAPI.quit === 'function') {
                window.electronAPI.quit();
                return;
            }
            if (window.electronAPI && typeof window.electronAPI.close === 'function') {
                window.electronAPI.close();
                return;
            }

            // 2. Preview mode / browser tab environment
            // Browsers allow window.close() only if opened via script (window.opener exists or test environment)
            const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
            const canClose = Boolean(window.opener || isTestEnv);

            if (canClose) {
                try {
                    window.close();
                } catch (e) {
                    console.warn('[Game] Unable to close window automatically:', e);
                }
            } else {
                console.info('[Game] quitGame executed (window was not opened by script; browser prevents closing tab directly).');
            }
        }
    }

    changeScreen(mode) {
        const isFullscreen = mode === 'fullscreen' || mode === 'Full Screen' || mode === 'full screen';
        const targetMode = isFullscreen ? 'fullscreen' : 'window';
        this.events.emit('screen:change', { mode: targetMode });

        if (typeof window !== 'undefined') {
            // 1. Electron standalone build environment
            if (window.electronAPI) {
                if (typeof window.electronAPI.changeScreen === 'function') {
                    window.electronAPI.changeScreen(targetMode);
                    return;
                }
                if (typeof window.electronAPI.setFullScreen === 'function') {
                    window.electronAPI.setFullScreen(isFullscreen);
                    return;
                }
            }

            // 2. Preview mode / browser web environment
            try {
                if (typeof document !== 'undefined') {
                    const docEl = document.documentElement;
                    if (isFullscreen) {
                        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                            const req = docEl?.requestFullscreen || docEl?.webkitRequestFullscreen || docEl?.msRequestFullscreen;
                            if (req) {
                                const p = req.call(docEl);
                                if (p && typeof p.catch === 'function') {
                                    p.catch((err) => {
                                        console.warn('[Game] Fullscreen request rejected:', err);
                                    });
                                }
                            }
                        }
                    } else {
                        if (document.fullscreenElement || document.webkitFullscreenElement) {
                            const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
                            if (exit) {
                                const p = exit.call(document);
                                if (p && typeof p.catch === 'function') {
                                    p.catch((err) => {
                                        console.warn('[Game] Exit fullscreen rejected:', err);
                                    });
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn('[Game] Screen change error:', e);
            }
        }
    }

    destroy() {
        this.quitGame({ closeWindow: false });

        if (this.input && typeof this.input.destroy === 'function') {
            this.input.destroy();
            this.input = null;
        }

        if (this.renderer && typeof this.renderer.destroy === 'function') {
            this.renderer.destroy();
            this.renderer = null;
        }

        if (this.events && typeof this.events.clearAll === 'function') {
            this.events.clearAll();
        }

        this.world = null; 
        this.syncSystem = null;
    }

    endFrame() {
        if (this.input) {
            if (this.input.keyboard && typeof this.input.keyboard.endFrame === 'function') {
                this.input.keyboard.endFrame();
            }
            if (this.input.mouse && typeof this.input.mouse.endFrame === 'function') {
                this.input.mouse.endFrame();
            }
        }
    }

    update(dt) {
        this.deltaTime = dt; 

        this.sceneSystem.update(dt);

        if (Config.ENGINE_MODE === "runtime") {
            this.transitionSystem.update(dt);
            
            this.audioSystem.update();

            this.animatorSystem.update(dt);
            this.scriptSystem.update(dt);
            
            this.physicsSystem.update(dt);

            if (this.camera && this.renderer && this.renderer.gl) {
                this.camera.update(this.isPaused ? 0 : dt, this.world, this.renderer.gl.canvas);
            }

            this.endFrame();
        }
    }

    render(alpha) {
        const cam = this.camera;

        if (this.cameraController) this.cameraController.update();

        if (Config.ENGINE_MODE === "editor") {
            if (this.history) this.history.update();
            if (this.tilemapTool) this.tilemapTool.update();
            if (this.shapeTool) this.shapeTool.update();
            if (this.selection) this.selection.update();
            if (this.transform) this.transform.update();
            if (this.pointerCoords) this.pointerCoords.update();

            this.endFrame();
        }

        if (this.renderer) {
            this.renderer.render(this.world, cam, this, alpha);
        }
    }

    pauseGame() { 
        this.isPaused = true; 
        this.events.emit('game:pause');
    }

    resumeGame() { 
        this.isPaused = false; 
        this.events.emit('game:resume');
    }
}
__exports.default = Game;
};
// === Module: Core/World.js ===
__reg.m["Core/World.js"] = function(__require, __exports, __module) {
class World {
    constructor() {
        this.entities = []; 
        
        this.layersWorld = []; 
        this.layersUI = []; 
        
        this.assets = { 
            textures: {}, 
            fonts: {} 
        };
        this.prefabs = {};

        this.settings = {
            tickRate: 60,
            backgroundColor: "#222222",
            worldBounds: { x: -1000, y: -1000, width: 2000, height: 2000, active: true },
            grid: {
                width: 32, height: 32, color: "#ffffff", opacity: 0.1, visible: true, snap: true
            },
            ui: {
                width: 1920, height: 1080, showUIBorder: true, active: true, smartGuides: true, visible: true
            },
            world: {
                active: true,
                visible: true
            },
            colliders: {
                solid: true,
                trigger: true,
                hitbox: true,
                hurtbox: true
            },
            showRulers: true
        };
        
        this._editors = {
            activeTool: 'select',
            activeTabId: null,
            tilemapContext: { showOthers: true, opacity: 0.3, showGrid: true },
            tabs: []
        };
    }

    get allLayers() {
        return [...this.layersWorld, ...this.layersUI];
    }

    addEntity(entity) {
        if (!this.entities.some(e => e === entity || e.id === entity.id)) {
            this.entities.push(entity);
        }
        
        let targetLayer = this.layersWorld.find(l => l.id === entity.layerId);
        
        if (!targetLayer) {
            targetLayer = this.layersUI.find(l => l.id === entity.layerId);
        }

        if (targetLayer) {
            if (!targetLayer.entities) targetLayer.entities = [];
            if (!targetLayer.entities.some(e => e === entity || e.id === entity.id)) {
                targetLayer.entities.push(entity);
            }
        } else {
            if (this.layersWorld.length > 0) {
                 if (!this.layersWorld[0].entities) this.layersWorld[0].entities = [];
                 if (!this.layersWorld[0].entities.some(e => e === entity || e.id === entity.id)) {
                     this.layersWorld[0].entities.push(entity);
                 }
            }
        }
    }

    removeEntity(entityId) {
        const entityIndex = this.entities.findIndex(e => e.id === entityId);
        if (entityIndex === -1) return;
        
        const entity = this.entities[entityIndex];
        
        if (entity.children) {
            [...entity.children].forEach(child => this.removeEntity(child.id));
        }

        this.entities.splice(entityIndex, 1);

        const all = this.allLayers;
        for (const layer of all) {
            if (layer.entities) {
                const idx = layer.entities.findIndex(e => e.id === entityId);
                if (idx !== -1) {
                    layer.entities.splice(idx, 1);
                    break;
                }
            }
        }
    }

    removeLayer(layerId) {
        this.layersWorld = this.layersWorld.filter(l => l.id !== layerId);
        this.layersUI = this.layersUI.filter(l => l.id !== layerId);
    }

    setupLayers(worldData, uiData) { 
        this.layersWorld = worldData || [];
        this.layersUI = uiData || [];
    }
    
    addTexture(id, data) { this.assets.textures[id] = data; }
    addFont(id, data) { this.assets.fonts[id] = data; }

    isAncestor(ancestorId, descendantId) {
        let current = this.entities.find(e => e.id === descendantId);
        while (current && current.parentId) {
            if (current.parentId === ancestorId) return true;
            current = this.entities.find(e => e.id === current.parentId);
        }
        return false;
    }

    setEntityParent(entityId, newParentId) {
        if (entityId === newParentId) return false;
        if (newParentId && this.isAncestor(entityId, newParentId)) {
            return false;
        }
        const entity = this.entities.find(e => e.id === entityId);
        if (!entity) return false;
        entity.parentId = newParentId || null;
        return true;
    }

    getAsset(idOrScriptId) {
        if (!idOrScriptId) return null;
        const search = String(idOrScriptId).trim();
        const searchLower = search.toLowerCase();
        const searchSlug = searchLower.replace(/\s+/g, '_');
        if (this.assetMap?.[search]) return this.assetMap[search];
        const list = this.assetList || [];
        return list.find(a => 
            a.id === search || 
            (a.scriptId && (a.scriptId.toLowerCase() === searchLower || a.scriptId.toLowerCase() === searchSlug))
        ) || null;
    }

    resolveAssetId(idOrScriptId) {
        if (!idOrScriptId) return null;
        const found = this.assetMap?.[idOrScriptId];
        if (found && found.id) return found.id;
        const matched = this.getAsset(idOrScriptId);
        return matched ? matched.id : idOrScriptId;
    }
}
__exports.default = World;
};
// === Module: Input/InputManager.js ===
__reg.m["Input/InputManager.js"] = function(__require, __exports, __module) {
const __imp_0 = __require("Input/Mouse.js"); const Mouse = __imp_0.default !== undefined ? __imp_0.default : __imp_0;
const __imp_1 = __require("Input/Touch.js"); const Touch = __imp_1.default !== undefined ? __imp_1.default : __imp_1;
const __imp_2 = __require("Input/Keyboard.js"); const Keyboard = __imp_2.default !== undefined ? __imp_2.default : __imp_2;
const __imp_3 = __require("System/PointerRaycast.js"); const PointerRaycast = __imp_3.default !== undefined ? __imp_3.default : __imp_3;

class InputManager {
    constructor(canvas, eventManager, game = null) {
        this.game = game;
        this.eventManager = eventManager;
        this.keyboard = new Keyboard(this.eventManager, this.game);
        this.mouse    = new Mouse(canvas, this.eventManager);
        this.touch    = new Touch(canvas);
    }

    destroy() {
        this.mouse.destroy();
        this.touch.destroy();
        this.keyboard.destroy();
    }

    isPointerOver(entity, useRaycast = true) {
        if (!entity) return false;
        if (this.game?.layerSystem?.isEntityInputFrozen(entity, 'pointer')) return false;
        const raycast = this.game?.pointerRaycast || PointerRaycast;
        return raycast && typeof raycast.isPointerOver === 'function'
            ? raycast.isPointerOver(this.game, entity, useRaycast)
            : false;
    }

    getPointer(contextEntity = null) {
        if (contextEntity) {
            if (contextEntity.active === false || contextEntity.visible === false) {
                return null;
            }
            if (this.game?.layerSystem?.isEntityInputFrozen(contextEntity, 'pointer')) {
                return null;
            }
        }

        if (this.touch.active && this.touch.touches.length === 1) {
            return {
                x: this.touch.touches[0].x,
                y: this.touch.touches[0].y,
                down: true,
                rightDown: false,
                isTouch: true
            };
        }
        return {
            x: this.mouse.x,
            y: this.mouse.y,
            down: this.mouse.isDown(0),      
            rightDown: this.mouse.isDown(2), 
            isTouch: false
        };
    }

    getMouse(contextEntity = null) {
        if (contextEntity) {
            if (contextEntity.active === false || contextEntity.visible === false) {
                return null;
            }
            if (this.game?.layerSystem?.isEntityInputFrozen(contextEntity, 'pointer')) {
                return null;
            }
        }
        return this.mouse;
    }

    isPinching() {
        return this.touch.active && this.touch.touches.length >= 2;
    }
}

__exports.default = InputManager;
};
// === Module: Input/Keyboard.js ===
__reg.m["Input/Keyboard.js"] = function(__require, __exports, __module) {
class Keyboard {
    constructor(eventManager, game = null) {
        this.eventManager = eventManager; 
        this.game = game;
        this.keys = new Set();
        this.pressed = new Set();
        this.released = new Set();

        this.shift = false;
        this.alt = false;
        this.ctrl = false;
        this.meta = false;

        this._onDown = e => this._down(e);
        this._onUp   = e => this._up(e);

        window.addEventListener("keydown", this._onDown);
        window.addEventListener("keyup", this._onUp);

        this._blockAltDown = e => {
            if (e.key === "Alt") e.preventDefault();
        };
        this._blockAltUp = e => {
            if (e.key === "Alt") e.preventDefault();
        };

        window.addEventListener("keydown", this._blockAltDown, { capture: true });
        window.addEventListener("keyup", this._blockAltUp, { capture: true });

        this._blur = () => {
            this.keys.clear();
            this.pressed.clear();
            this.released.clear();
            this.shift = false;
            this.alt = false;
            this.ctrl = false;
            this.meta = false;
        };
        window.addEventListener("blur", this._blur);
    }

    _isInputElement(target) {
        if (!target) return false;
        const tagName = target.tagName;
        if (tagName === 'INPUT' || tagName === 'TEXTAREA') return true;
        if (target.isContentEditable) return true;
        if (typeof target.closest === 'function') {
            return Boolean(target.closest('input, textarea, [contenteditable="true"]'));
        }
        return false;
    }

    _down(e) {
        if (this._isInputElement(e.target)) return;

        let k = e.key.toLowerCase();
        if (k === " ") k = "space";

        if (!this.keys.has(k)) {
            this.pressed.add(k);
        }

        this.keys.add(k);
        this.shift = e.shiftKey;
        this.alt = e.altKey;
        this.ctrl = e.ctrlKey;
        this.meta = e.metaKey;
    }

    _up(e) {
        let k = e.key.toLowerCase();
        if (k === " ") k = "space";

        this.keys.delete(k);
        this.released.add(k);

        this.shift = e.shiftKey;
        this.alt = e.altKey;
        this.ctrl = e.ctrlKey;
        this.meta = e.metaKey;
    }

    isDown(k, contextEntity = null) {
        if (!k) return false;
        if (contextEntity && (contextEntity.active === false || contextEntity.visible === false)) return false;
        if (this.game?.layerSystem?.isEntityInputFrozen(contextEntity, 'keyboard')) return false;
        return this.keys.has(String(k).toLowerCase());
    }

    isPressed(k, contextEntity = null) {
        if (!k) return false;
        if (contextEntity && (contextEntity.active === false || contextEntity.visible === false)) return false;
        if (this.game?.layerSystem?.isEntityInputFrozen(contextEntity, 'keyboard')) return false;
        return this.pressed.has(String(k).toLowerCase());
    }

    isReleased(k, contextEntity = null) {
        if (!k) return false;
        if (contextEntity && (contextEntity.active === false || contextEntity.visible === false)) return false;
        if (this.game?.layerSystem?.isEntityInputFrozen(contextEntity, 'keyboard')) return false;
        return this.released.has(String(k).toLowerCase());
    }

    getPressedKeys() {
        return Array.from(this.pressed);
    }

    endFrame() {
        this.pressed.clear();
        this.released.clear();
    }

    destroy() {
        window.removeEventListener("keydown", this._onDown);
        window.removeEventListener("keyup", this._onUp);
        window.removeEventListener("keydown", this._blockAltDown, { capture: true });
        window.removeEventListener("keyup", this._blockAltUp, { capture: true });
        window.removeEventListener("blur", this._blur);
    }
}

__exports.default = Keyboard;
};
// === Module: Input/Mouse.js ===
__reg.m["Input/Mouse.js"] = function(__require, __exports, __module) {
const { MapToCanvasPixels } = __require("Util/MapToCanvasPixels.js");

class Mouse {
    constructor(canvas, eventManager) {
        this.canvas = canvas;
        this.eventManager = eventManager; 
        this.x = 0;
        this.y = 0;
        this.buttons = new Set();
        this.pressedButtons = new Set();
        this.releasedButtons = new Set();
        this.wheel = 0;

        this._move = e => {
            if (!this.canvas || typeof this.canvas.getBoundingClientRect !== "function") return;

            const p = MapToCanvasPixels(e, this.canvas);
            this.x = p.px;
            this.y = p.py;
            
            if (this.eventManager) {
                this.eventManager.emit("input:pointermove", { x: this.x, y: this.y });
            }
        };

        this._down = e => {
            if (!this.buttons.has(e.button)) {
                this.pressedButtons.add(e.button);
            }
            this.buttons.add(e.button);

            let px = this.x;
            let py = this.y;
            if (this.canvas && typeof this.canvas.getBoundingClientRect === "function") {
                const p = MapToCanvasPixels(e, this.canvas);
                px = p.px;
                py = p.py;
            }
            
            if (this.eventManager) {
                const btnLabel = e.button === 0 ? 'left' : (e.button === 2 ? 'right' : 'middle');
                this.eventManager.emit("input:pointerdown", { 
                    button: btnLabel, 
                    x: px, 
                    y: py 
                });
            }
        };

        this._up = e => {
            if (this.buttons.has(e.button)) {
                this.buttons.delete(e.button);
                this.releasedButtons.add(e.button);

                let px = this.x;
                let py = this.y;
                if (this.canvas && typeof this.canvas.getBoundingClientRect === "function") {
                    const p = MapToCanvasPixels(e, this.canvas);
                    px = p.px;
                    py = p.py;
                }
                
                if (this.eventManager) {
                    this.eventManager.emit("input:pointerup", { 
                        button: e.button, 
                        x: px, 
                        y: py 
                    });
                }
            }
        };

        this._wheel = e => {
            e.preventDefault();
            this.wheel += e.deltaY;
        };

        this._contextMenu = e => e.preventDefault();

        this._blur = () => {
            this.buttons.clear();
            this.pressedButtons.clear();
            this.releasedButtons.clear();
        };
        window.addEventListener("blur", this._blur);

        if (this.canvas && typeof this.canvas.addEventListener === "function") {
            this.canvas.addEventListener("contextmenu", this._contextMenu);
            this.canvas.addEventListener("mousemove", this._move);
            this.canvas.addEventListener("mousedown", this._down);
            this.canvas.addEventListener("wheel", this._wheel, { passive: false });
            window.addEventListener("mouseup", this._up);
        }
    }

    isDown(btn) {
        const code = typeof btn === 'string' ? (btn === 'left' ? 0 : btn === 'right' ? 2 : 1) : btn;
        return this.buttons.has(code);
    }

    isPressed(btn) {
        const code = typeof btn === 'string' ? (btn === 'left' ? 0 : btn === 'right' ? 2 : 1) : btn;
        return this.pressedButtons.has(code);
    }

    isReleased(btn) {
        const code = typeof btn === 'string' ? (btn === 'left' ? 0 : btn === 'right' ? 2 : 1) : btn;
        return this.releasedButtons.has(code);
    }

    endFrame() {
        this.pressedButtons.clear();
        this.releasedButtons.clear();
    }

    consumeWheel() {
        const v = this.wheel;
        this.wheel = 0;
        return v;
    }

    destroy() {
        if (this.canvas && typeof this.canvas.removeEventListener === "function") {
            this.canvas.removeEventListener("mousemove", this._move);
            this.canvas.removeEventListener("mousedown", this._down);
            this.canvas.removeEventListener("wheel", this._wheel);
            this.canvas.removeEventListener("contextmenu", this._contextMenu);
        }
        window.removeEventListener("mouseup", this._up);
        window.removeEventListener("blur", this._blur);
    }
}
__exports.default = Mouse;
};
// === Module: Input/Touch.js ===
__reg.m["Input/Touch.js"] = function(__require, __exports, __module) {
const { MapToCanvasPixels } = __require("Util/MapToCanvasPixels.js");

class Touch {
    constructor(canvas) {
        this.canvas = canvas;

        this.touches = [];
        this.active = false;
        this.lockScroll = false;

        this._globalBlocker = e => {
            if (this.lockScroll) {
                e.preventDefault();
            }
        };
        document.addEventListener("touchmove", this._globalBlocker, { passive: false });

        this._start = e => {
            this.lockScroll = true;
            this.active = true;
            e.preventDefault();
            this._updateTouches(e);
        };

        this._move = e => {
            if (this.lockScroll) {
                e.preventDefault();
            }
            this._updateTouches(e);
        };

        this._end = e => {
            if (this.lockScroll) e.preventDefault();
            this._updateTouches(e);
            if (e.touches.length === 0) {
                this.active = false;
                this.lockScroll = false;
            }
        };

        this._blockPTR = e => {
            if (this.lockScroll && window.scrollY === 0) {
                e.preventDefault();
            }
        };
        window.addEventListener("touchmove", this._blockPTR, { passive: false });

        if (this.canvas && typeof this.canvas.addEventListener === "function") {
            this.canvas.addEventListener("touchstart",  this._start,  { passive: false });
            this.canvas.addEventListener("touchmove",   this._move,   { passive: false });
            this.canvas.addEventListener("touchend",    this._end,    { passive: false });
            this.canvas.addEventListener("touchcancel", this._end,    { passive: false });

            if (this.canvas.style) {
                this.canvas.style.touchAction = "none";
            }
        }
    }

    _updateTouches(e) {
        this.touches = [];
        if (!this.canvas || typeof this.canvas.getBoundingClientRect !== "function") return;

        for (let t of e.touches) {
            const p = MapToCanvasPixels(
                { clientX: t.clientX, clientY: t.clientY },
                this.canvas
            );
            this.touches.push({ x: p.px, y: p.py });
        }
    }

    destroy() {
        document.removeEventListener("touchmove", this._globalBlocker, { passive: false });
        window.removeEventListener("touchmove", this._blockPTR, { passive: false });
        if (this.canvas && typeof this.canvas.removeEventListener === "function") {
            this.canvas.removeEventListener("touchstart",  this._start);
            this.canvas.removeEventListener("touchmove",   this._move);
            this.canvas.removeEventListener("touchend",    this._end);
            this.canvas.removeEventListener("touchcancel", this._end);
        }
    }
}
__exports.default = Touch;
};
// === Module: Loop/GameLoop.js ===
__reg.m["Loop/GameLoop.js"] = function(__require, __exports, __module) {
const __imp_0 = __require("Core/Config.js"); const Config = __imp_0.default !== undefined ? __imp_0.default : __imp_0;

class GameLoop {
    constructor(game) {
        this.game = game;
        
        this.fps = Math.max(1, this.game.world.settings.tickRate || 60);
        this.interval = 1000 / this.fps;
        
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.rafId = null;
        
        this.isFirstFrame = true; 
    }

    loop(now) {
        const currentTickRate = Math.max(1, this.game.world.settings.tickRate || 60);
        if (this.fps !== currentTickRate) {
            this.fps = currentTickRate;
            this.interval = 1000 / this.fps;
        }

        let delta = now - this.lastTime;
        this.lastTime = now;

        if (delta > 100) delta = this.interval;

        if (Config.ENGINE_MODE === "editor") {
            this.game.update(delta / 1000);
            this.game.render(1);
        } else {
            // Continuous update step
            this.accumulator += delta;
            while (this.accumulator >= this.interval) {
                this.game.update(this.interval / 1000);
                this.accumulator -= this.interval;
            }

            const alpha = this.interval > 0 ? this.accumulator / this.interval : 1;
            this.game.render(alpha); 
        }

        if (this.game.isRunning) {
            this.rafId = requestAnimationFrame(t => this.loop(t));
        }
    }

    start() {
        if (this.game.isRunning) return;
        this.game.isRunning = true;
        
        this.isFirstFrame = true;
        
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.rafId = requestAnimationFrame(t => this.loop(t));
    }

    stop() {
        this.game.isRunning = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
}
__exports.default = GameLoop;
};
// === Module: Schema/defaultAsset.js ===
__reg.m["Schema/defaultAsset.js"] = function(__require, __exports, __module) {
const { sanitizeScriptId } = __require("Util/identifier.js");

// Core runtime asset schema factory
const assetSchema = (data = {}) => {
  const meta = data.meta || {};
  const type = data.type || "texture";
  const isTexture = type === "texture";
  const isAudio = type === "audio";
  const isFont = type === "font";

  const scriptId = sanitizeScriptId(
    data.scriptId || "Asset",
    "Asset"
  );

  const asset = {
    id: data.id,
    projectId: data.projectId || null,
    folderId: data.folderId || null,
    scriptId: scriptId,
    type: type,
    fileKey: data.fileKey || "",
    fileUrl: data.fileUrl || "",
    meta: {
      extension: meta.extension || "",
      size: meta.size || 0,
      ...(isTexture && {
        dimensions: {
          w: meta.dimensions?.w || 0,
          h: meta.dimensions?.h || 0
        }
      }),
      ...(isAudio && {
        duration: meta.duration || 0
      }),
      ...(isFont && {
        textureUrl: meta.textureUrl || ""
      }),
      ...meta
    }
  };

  return asset;
};

// Creates a default asset instance populated with type-specific fallback metadata
const createDefaultAsset = (overrideData = {}) => {
  const type = overrideData.type || "texture";
  const meta = overrideData.meta || {};

  let defaultMeta = {
    extension: meta.extension || "",
    size: meta.size || 0,
    ...meta
  };

  if (type === "texture") {
    defaultMeta.dimensions = {
      w: meta.dimensions?.w || 0,
      h: meta.dimensions?.h || 0
    };
  } else if (type === "audio") {
    defaultMeta.duration = meta.duration || 0;
  } else if (type === "font") {
    defaultMeta.textureUrl = meta.textureUrl || "";
  }

  const baseData = {
    id: overrideData.id || `asset_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    projectId: overrideData.projectId || null,
    folderId: overrideData.folderId || null,
    scriptId: overrideData.scriptId || `Asset_${type}`,
    type: type,
    fileKey: overrideData.fileKey || "",
    fileUrl: overrideData.fileUrl || "",
    meta: defaultMeta
  };

  return assetSchema(baseData);
};

// Built-in default MSDF font asset definition used across all text rendering fallbacks
const DEFAULT_SYSTEM_FONT_ASSET = assetSchema({
  id: "system_default",
  scriptId: "system_default_font",
  type: "font",
  fileKey: "system_default",
  fileUrl: "",
  meta: {
    extension: ".fnt",
    size: 0,
    textureUrl: ""
  }
});

// Standard asset template factories for quick asset prototyping
const DEFAULT_ASSET_TEMPLATES = {
  TEXTURE: () => createDefaultAsset({ type: "texture", scriptId: "default_texture" }),
  AUDIO: () => createDefaultAsset({ type: "audio", scriptId: "default_audio" }),
  FONT: () => createDefaultAsset({ type: "font", scriptId: "default_font" })
};

__exports.default = createDefaultAsset;

__exports.assetSchema = assetSchema;
__exports.createDefaultAsset = createDefaultAsset;
__exports.DEFAULT_SYSTEM_FONT_ASSET = DEFAULT_SYSTEM_FONT_ASSET;
__exports.DEFAULT_ASSET_TEMPLATES = DEFAULT_ASSET_TEMPLATES;
};
// === Module: Schema/defaultProject.js ===
__reg.m["Schema/defaultProject.js"] = function(__require, __exports, __module) {
// Fallback engine project initialization payload with default configuration, layers, and scene definitions
const DEFAULT_PROJECT_PAYLOAD = {
  project: {
    id: "default_runtime_project",
    name: "Default Project",
    description: "Fallback runtime engine project",
    status: "PUBLISHED",
    createdAt: new Date().toISOString(),
    thumbnailUrl: null,
    settings: {
      tickRate: 60,
      debug: {
        active: false,
        position: "top-right",
        width: 360,
        height: 220,
        maxLogs: 50
      },
      ui: {
        width: 1920,
        height: 1080,
        showUIBorder: false,
        active: true,
        smartGuides: true
      },
      camera: {
        x: 960,
        y: 540,
        zoom: 1,
        lerp: 0.1
      },
      grid: {
        width: 32,
        height: 32,
        color: "#ffffff",
        opacity: 0.1,
        visible: false,
        snap: false
      }
    },
    globalVariables: [],
    tags: ["Untagged", "Player", "Enemy"]
  },
  scenes: [
    {
      id: "default_main_scene",
      scriptId: "default_main_scene",
      settings: {
        backgroundColor: "#1a1a1a",
        showRulers: false,
        worldBounds: {
          x1: -1920,
          x2: 1920,
          y1: -1080,
          y2: 1080,
          active: true
        },
        physics: {
          gravity: 1200,
          drag: 5
        }
      },
      layersWorld: [
        { id: "layer_world_default", scriptId: "world_root", zIndex: 0, orderIndex: 0, active: true, visible: true, locked: false, opacity: 1.0, freezeInput: false, freezeInputType: "all" }
      ],
      layersUI: [
        { id: "layer_ui_default", scriptId: "ui_root", zIndex: 0, orderIndex: 0, active: true, visible: true, locked: false, opacity: 1.0, freezeInput: false, freezeInputType: "all" }
      ],
      entities: []
    }
  ],
  prefabs: [],
  assets: [],
  scripts: []
};

__exports.DEFAULT_PROJECT_PAYLOAD = DEFAULT_PROJECT_PAYLOAD;
};
// === Module: System/AnimatorSystem.js ===
__reg.m["System/AnimatorSystem.js"] = function(__require, __exports, __module) {
const __imp_0 = __require("Core/Config.js"); const Config = __imp_0.default !== undefined ? __imp_0.default : __imp_0;

class AnimatorSystem {
    constructor(game) {
        this.game = game;
    }

    update(dt) {
        if (Config.ENGINE_MODE !== "runtime") return;

        const world = this.game.world;
        const isPaused = this.game.isPaused;

        // Only process UI layers during pause
        const layers = isPaused 
            ? (world.layersUI || [])
            : [...(world.layersWorld || []), ...(world.layersUI || [])];

        const processedEntities = new Set();

        for (const layer of layers) {
            if (layer.active === false || layer.visible === false || !layer.entities) continue;
            
            for (const entity of layer.entities) {
                if (!entity || processedEntities.has(entity)) continue;
                processedEntities.add(entity);
                this._processAnimator(entity, dt);
            }
        }
    }

    _processAnimator(entity, dt) {
        if (entity.active === false || entity.visible === false) return;
        
        const animator = entity.components?.SpriteAnimator;
        
        if (!animator || !animator.active || !animator.isPlaying || !animator.currentClip || !Array.isArray(animator.clips)) {
            if (animator) animator._runtimeData = null; 
            return;
        }
        const clip = animator.clips.find(c => c.id === animator.currentClip && c.type === 'clip');
        
        if (!clip || !clip.frames || clip.frames.length === 0 || !clip.assetId) {
            animator._runtimeData = null; 
            return;
        }

        if (animator._activeClipId !== clip.id) {
            animator._activeClipId = clip.id;
            animator._elapsedTime = 0;
        }

        const fps = clip.fps || 12;
        const frameDuration = 1 / fps;
        
        animator._elapsedTime += dt;

        if (typeof clip.frameIndex !== 'number' || isNaN(clip.frameIndex)) {
            clip.frameIndex = 0;
        }

        while (animator._elapsedTime >= frameDuration) {
            animator._elapsedTime -= frameDuration;
            clip.frameIndex++; 

            if (clip.frameIndex >= clip.frames.length) {
                if (clip.isLooping) {
                    clip.frameIndex = 0;
                } else {
                    clip.frameIndex = clip.frames.length - 1; 
                    animator.isPlaying = false; 
                    
                    if (animator._onCompleteCallback) animator._onCompleteCallback();
                    animator._onCompleteCallback = null;

                    break; 
                }
            }
        }

        if (animator.isPlaying) {
            const safeIndex = Math.max(0, Math.min(clip.frameIndex, clip.frames.length - 1));
            const sourceId = clip.frames[safeIndex];
            const sourceRect = clip.sources?.[sourceId];

            if (sourceRect) {
                animator._runtimeData = {
                    assetId: clip.assetId,
                    x: sourceRect.x,
                    y: sourceRect.y,
                    w: sourceRect.w,
                    h: sourceRect.h,
                    flipX: !!clip.flipX 
                };
            } else {
                animator._runtimeData = null;
            }
        } else {
            animator._runtimeData = null;
        }
    }
}
__exports.default = AnimatorSystem;
};
// === Module: System/AudioSystem.js ===
__reg.m["System/AudioSystem.js"] = function(__require, __exports, __module) {
class AudioSystem {
    constructor(game) {
        this.game = game;
        
        const AudioContextClass = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
        if (AudioContextClass) {
            this.context = new AudioContextClass();
        } else {
            this.context = this._createFallbackContext();
        }
        
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);

        this.backgroundGain = this.context.createGain();
        this.backgroundGain.connect(this.masterGain);

        this.sfxGain = this.context.createGain();
        this.sfxGain.connect(this.masterGain);

        this.voiceGain = this.context.createGain();
        this.voiceGain.connect(this.masterGain);

        this.buses = {
            master: { gain: this.masterGain, volume: 100, isMute: false },
            background: { gain: this.backgroundGain, volume: 100, isMute: false },
            sfx: { gain: this.sfxGain, volume: 100, isMute: false },
            voice: { gain: this.voiceGain, volume: 100, isMute: false }
        };

        this.activeNodes = new Map();
        this.pendingAutoplayAudio = [];
        this.isUnlocked = this.context.state === 'running';

        this._canvas = null;
        this._unlockHandler = null;
    }

    _createFallbackContext() {
        const createDummyGain = () => {
            const gainObj = {
                value: 1.0,
                setValueAtTime(val) { this.value = val; },
                linearRampToValueAtTime(val) { this.value = val; }
            };
            return {
                gain: gainObj,
                connect() {}
            };
        };

        return {
            state: 'running',
            currentTime: 0,
            destination: {},
            createGain: createDummyGain,
            createBufferSource: () => ({
                buffer: null,
                playbackRate: { value: 1.0 },
                loop: false,
                connect() {},
                start() {},
                stop() {}
            }),
            createPanner: () => ({
                panningModel: 'HRTF',
                distanceModel: 'inverse',
                refDistance: 100,
                maxDistance: 1000,
                rolloffFactor: 1,
                positionX: { value: 0 },
                positionY: { value: 0 },
                positionZ: { value: 0 },
                connect() {}
            }),
            listener: {
                positionX: { value: 0 },
                positionY: { value: 0 },
                positionZ: { value: 0 }
            },
            resume: async () => {}
        };
    }

    getBusGainNode(type) {
        if (type === 'background') return this.backgroundGain;
        if (type === 'voice') return this.voiceGain;
        if (type === 'master') return this.masterGain;
        return this.sfxGain;
    }

    setVolume(type, volume) {
        const bus = this.buses[type];
        if (!bus) {
            console.warn(`[AudioSystem] Unknown audio bus '${type}'`);
            return;
        }
        const safeVol = Math.max(0, Math.min(100, Number(volume)));
        bus.volume = safeVol;
        if (!bus.isMute) {
            bus.gain.gain.value = safeVol / 100;
        }
    }

    getVolume(type) {
        const bus = this.buses[type];
        return bus ? bus.volume : 100;
    }

    setMute(type, isMute) {
        const bus = this.buses[type];
        if (!bus) return;
        bus.isMute = Boolean(isMute);
        bus.gain.gain.value = bus.isMute ? 0 : (bus.volume / 100);
    }

    isMuted(type) {
        const bus = this.buses[type];
        return bus ? bus.isMute : false;
    }

    setMasterVolume(val) { this.setVolume('master', val); }
    getMasterVolume() { return this.getVolume('master'); }

    setBackgroundVolume(val) { this.setVolume('background', val); }
    getBackgroundVolume() { return this.getVolume('background'); }

    setSfxVolume(val) { this.setVolume('sfx', val); }
    getSfxVolume() { return this.getVolume('sfx'); }

    setVoiceVolume(val) { this.setVolume('voice', val); }
    getVoiceVolume() { return this.getVolume('voice'); }

    attachCanvas(canvas) {
        this._canvas = canvas;

        if (this.context.state === 'running') {
            this.isUnlocked = true;
        }
    }

    _attachUnlockListenersIfNeeded() {
        if (this.isUnlocked || !this._canvas || this._unlockHandler) return;

        this._unlockHandler = async () => {
            await this.unlockAudio();
        };

        this._canvas.addEventListener('pointerdown', this._unlockHandler);
        this._canvas.addEventListener('keydown', this._unlockHandler);
    }

    _detachUnlockListeners() {
        if (this._canvas && this._unlockHandler) {
            this._canvas.removeEventListener('pointerdown', this._unlockHandler);
            this._canvas.removeEventListener('keydown', this._unlockHandler);
            this._unlockHandler = null;
        }
    }

    async unlockAudio() {
        try {
            if (this.context.state === 'suspended') {
                await this.context.resume();
            }

            if (this.context.state === 'running') {
                this.isUnlocked = true;
                
                this._detachUnlockListeners();

                this._flushPendingAutoplay();
            }
        } catch (err) {
            console.error("[AudioSystem] Failed to resume AudioContext:", err);
        }
    }

    _flushPendingAutoplay() {
        while (this.pendingAutoplayAudio.length > 0) {
            const { entity, audioData } = this.pendingAutoplayAudio.shift();
            this.play(entity, audioData);
        }
    }

    // Plays audio based on entity Audio component data or explicit override configuration
    play(entity, overrideAudioData = null) {
        if (this.context.state === 'suspended') {
            this.context.resume().then(() => {
                if (this.context.state === 'running') {
                    this.isUnlocked = true;
                }
            }).catch(() => {});
        }

        const audioData = overrideAudioData || entity.components?.Audio;
        if (!audioData || !audioData.assetId) return null;

        if (this.context.state === 'suspended' && !this.isUnlocked) {
            const isAlreadyPending = this.pendingAutoplayAudio.some(
                item => item.entity.id === entity.id && item.audioData.assetId === audioData.assetId
            );
            if (!isAlreadyPending) {
                this.pendingAutoplayAudio.push({ entity, audioData });
            }

            this._attachUnlockListenersIfNeeded();
            return null;
        }

        const audioBuffer = this.game.world.audios?.[audioData.assetId];
        if (!audioBuffer) return null;

        const source = this.context.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = audioData.pitch ?? 1.0;
        source.loop = audioData.loop ?? false;

        const gainNode = this.context.createGain();
        const rawVol = audioData.volume ?? 100;
        const safeVol = Math.max(0, Math.min(100, Number(rawVol)));
        const targetVolume = audioData.isMute ? 0 : (safeVol / 100);
        const fadeInDuration = audioData.fadeIn || 0;

        if (fadeInDuration > 0) {
            gainNode.gain.setValueAtTime(0, this.context.currentTime);
            gainNode.gain.linearRampToValueAtTime(targetVolume, this.context.currentTime + fadeInDuration);
        } else {
            gainNode.gain.value = targetVolume;
        }

        source.connect(gainNode);

        let finalNode = gainNode;
        let pannerNode = null;

        if (audioData.spatial && !audioData.persist) {
            pannerNode = this.context.createPanner();
            pannerNode.panningModel = 'HRTF';
            pannerNode.distanceModel = 'inverse';
            pannerNode.refDistance = audioData.refDistance ?? 100;
            pannerNode.maxDistance = audioData.maxDistance ?? 1000;
            pannerNode.rolloffFactor = 1;

            const transform = entity.components?.Transform;
            if (transform) {
                pannerNode.positionX.value = transform.x;
                pannerNode.positionY.value = transform.y;
                pannerNode.positionZ.value = 0;
            }

            gainNode.connect(pannerNode);
            finalNode = pannerNode;
        }

        const rawType = audioData.audioType || audioData.type || 'sfx';
        const channelType = (rawType === 'background' || rawType === 'voice') ? rawType : 'sfx';
        const targetBus = this.buses[channelType] || this.buses.sfx;

        finalNode.connect(targetBus.gain);
        source.start();

        const nodeId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : ('audio_' + Math.random().toString(36).slice(2));
        this.activeNodes.set(nodeId, { entity, source, gainNode, pannerNode, targetVolume, audioData, channel: channelType });

        source.onended = () => this.activeNodes.delete(nodeId);
        return nodeId;
    }

    // Plays a sound asset directly without an entity binding
    playSound(assetIdOrBuffer, options = {}) {
        if (!assetIdOrBuffer) return null;
        if (this.context.state === 'suspended') {
            this.context.resume().catch(() => {});
        }

        let audioBuffer = null;
        if (typeof assetIdOrBuffer === 'string') {
            audioBuffer = this.game.world?.audios?.[assetIdOrBuffer];
        } else if (typeof assetIdOrBuffer === 'object') {
            audioBuffer = assetIdOrBuffer;
        }
        if (!audioBuffer) return null;

        const source = this.context.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = options.pitch ?? 1.0;
        source.loop = options.loop ?? false;

        const gainNode = this.context.createGain();
        const rawVol = options.volume ?? 100;
        const safeVol = Math.max(0, Math.min(100, Number(rawVol)));
        const targetVolume = options.isMute ? 0 : (safeVol / 100);
        gainNode.gain.value = targetVolume;
        source.connect(gainNode);

        const rawType = options.audioType || options.type || 'sfx';
        const channelType = (rawType === 'background' || rawType === 'voice') ? rawType : 'sfx';
        const targetBus = this.buses[channelType] || this.buses.sfx;

        gainNode.connect(targetBus.gain);
        source.start();

        const nodeId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : ('audio_' + Math.random().toString(36).slice(2));
        this.activeNodes.set(nodeId, { entity: null, source, gainNode, targetVolume, audioData: options, channel: channelType });

        source.onended = () => this.activeNodes.delete(nodeId);
        return nodeId;
    }

    // Stops all active audio nodes across all channels
    stopAll() {
        for (const [nodeId, nodeData] of this.activeNodes.entries()) {
            try { nodeData.source.stop(); } catch(e) {}
            this.activeNodes.delete(nodeId);
        }
    }

    // Stops active audio playback for a specific entity
    stop(entityOrId) {
        const targetId = typeof entityOrId === 'string' ? entityOrId : entityOrId?.id;
        if (!targetId) return;

        const now = this.context.currentTime;

        for (const [nodeId, nodeData] of this.activeNodes.entries()) {
            if (nodeData.entity?.id === targetId) {
                const { source, gainNode, audioData } = nodeData;
                const fadeOutDuration = audioData.fadeOut || 0;

                if (fadeOutDuration > 0) {
                    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
                    gainNode.gain.linearRampToValueAtTime(0, now + fadeOutDuration);
                    
                    setTimeout(() => {
                        try { source.stop(); } catch(e) {}
                    }, fadeOutDuration * 1000);
                } else {
                    try { source.stop(); } catch(e) {}
                }

                this.activeNodes.delete(nodeId);
            }
        }
    }

    handleSceneTransition(newEntities) {
        const upcomingPersistentAssets = new Set();
        
        newEntities.forEach(entity => {
            const audioComp = entity.components?.Audio;
            if (audioComp && audioComp.persist && audioComp.autoplay && audioComp.assetId) {
                upcomingPersistentAssets.add(audioComp.assetId);
            }
        });

        const now = this.context.currentTime;

        for (const [nodeId, nodeData] of this.activeNodes.entries()) {
            const { source, gainNode, audioData } = nodeData;

            if (audioData.persist) {
                if (upcomingPersistentAssets.has(audioData.assetId)) {
                    nodeData.keptAlive = true; 
                }
            } else {
                const fadeOutDuration = audioData.fadeOut || 0;
                
                if (fadeOutDuration > 0) {
                    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
                    gainNode.gain.linearRampToValueAtTime(0, now + fadeOutDuration);
                    
                    setTimeout(() => {
                        try { source.stop(); } catch(e) {}
                    }, fadeOutDuration * 1000);
                } else {
                    try { source.stop(); } catch(e) {}
                }
                
                this.activeNodes.delete(nodeId);
            }
        }
    }

    startSceneAutoplay(world) {
        world.entities.forEach(entity => {
            const audioComp = entity.components?.Audio;
            if (audioComp && audioComp.autoplay && audioComp.assetId) {
                let isAlreadyPlaying = false;

                for (const nodeData of this.activeNodes.values()) {
                    if (nodeData.audioData.assetId === audioComp.assetId && nodeData.keptAlive) {
                        isAlreadyPlaying = true;
                        nodeData.keptAlive = false; 
                        nodeData.entity = entity;   
                        break;
                    }
                }

                if (!isAlreadyPlaying) {
                    this.play(entity, audioComp);
                }
            }
        });
    }

    update() {
        if (!this.game.camera || this.context.state === 'suspended') return;

        const listener = this.context.listener;
        listener.positionX.value = this.game.camera.x;
        listener.positionY.value = this.game.camera.y;
        listener.positionZ.value = 300; 

        for (const [nodeId, nodeData] of this.activeNodes.entries()) {
            const { entity, pannerNode, audioData } = nodeData;

            if (audioData.persist || !entity || !entity.components?.Transform) {
                continue; 
            }

            if (pannerNode) {
                const transform = entity.components.Transform;
                pannerNode.positionX.value = transform.x;
                pannerNode.positionY.value = transform.y;
            }
        }
    }
}

__exports.default = AudioSystem;
};
// === Module: System/ColliderSystem.js ===
__reg.m["System/ColliderSystem.js"] = function(__require, __exports, __module) {
const __imp_0 = __require("Renderer/Scene/RenderUtils.js"); const RenderUtils = __imp_0.default !== undefined ? __imp_0.default : __imp_0;

class ColliderSystem {
    constructor(game) {
        this.game = game;
    }

    isOneWayPlatform(other, oneWayTag) {
        if (!other) return false;
        if (other.components?.Tilemap?.isOneWay || other.components?.Tilemap?.oneWay) return true;
        if (other.components?.Collider?.isOneWay || other.components?.Collider?.oneWay) return true;
        if (!oneWayTag) return false;

        const targets = String(oneWayTag).split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        if (targets.length === 0) return false;

        if (typeof other.hasTag === 'function') {
            if (targets.some(target => other.hasTag(target))) return true;
        }

        const rawTags = Array.isArray(other.tags) 
            ? other.tags 
            : String(other.tag || other.components?.Tags?.value || other.components?.Tilemap?.tag || '').split(',');
        const tags = rawTags.map(t => String(t).trim().toLowerCase()).filter(Boolean);
        return targets.some(target => tags.includes(target));
    }

    moveAndSlide(entity, dx, dy) {
        if (entity.active === false) return null;
        if (!entity.components.Transform) return null;
        
        dx = Number(dx) || 0;
        dy = Number(dy) || 0;

        const boundsList = this.getBounds(entity).filter(b => b.type === 'solid');
        if (boundsList.length === 0) {
            entity.components.Transform.x += dx;
            entity.components.Transform.y += dy;
            return null;
        }

        const MAX_STEP_SIZE = 8;
        const distance = Math.sqrt(dx*dx + dy*dy);
        if (distance < 0.001) return null;

        const steps = Math.ceil(distance / MAX_STEP_SIZE);
        const stepX = dx / steps;
        const stepY = dy / steps;
        
        let finalHits = { x: null, y: null, normals: [] };
        let hasCollision = false;

        for (let i = 0; i < steps; i++) {
            const hit = this._moveSingleStep(entity, stepX, stepY);
            if (hit) {
                if (hit.x) finalHits.x = hit.x;
                if (hit.y) finalHits.y = hit.y;
                if (hit.normals) finalHits.normals.push(...hit.normals);
                hasCollision = true;
            }
        }
        return hasCollision ? finalHits : null;
    }

    _normalizeStuck(entity) {
        if (!this._findCollision(entity, 'solid')) return false;

        const t = entity.components.Transform;
        const maxNudge = 12; 
        const origX = t.x;
        const origY = t.y;

        const directions = [
            { dx: 0, dy: -1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 }
        ];

        for (let step = 1; step <= maxNudge; step++) {
            for (let dir of directions) {
                t.x = origX + (dir.dx * step);
                t.y = origY + (dir.dy * step);
                
                if (!this._findCollision(entity, 'solid')) return true;
            }
        }

        t.x = origX;
        t.y = origY;
        return false;
    }

    _moveSingleStep(entity, dx, dy) {
        const transform = entity.components.Transform;
        const startX = transform.x;
        const startY = transform.y;

        this._currentStepDx = dx;
        this._currentStepDy = dy;

        let hits = { x: null, y: null, normals: [] };
        
        transform.x += dx;
        transform.y += dy;

        let iter = 0;
        let maxIters = 4;
        let hasCollision = false;

        while (iter < maxIters) {
            const collision = this._findCollision(entity, 'solid');
            if (!collision) break;

            hasCollision = true;
            const mtv = this._resolveOverlap(entity, collision);

            if (mtv && mtv.axis) {
                hits.normals.push(mtv.axis);
                // Any surface with upward-pointing normal (ny < -0.25, up to ~75 deg slope) is a floor (hits.y), NOT a wall!
                if (mtv.axis.y < -0.25) {
                    hits.y = collision;
                } else if (mtv.axis.y > 0.25) {
                    hits.y = collision; // Ceiling
                } else {
                    hits.x = collision; // True wall
                }
            } else {
                break;
            }
            iter++;
        }

        // Auto Step-Climb for small lips, seams, and rough segment joints (<= 8px)
        if (hits.x && Math.abs(dx) > 0.001) {
            const stepUpHeight = 8;
            const blockedX = transform.x;
            const blockedY = transform.y;

            // Test if we can step up over this obstacle
            transform.x = startX;
            transform.y = startY - stepUpHeight;

            // Only attempt if headspace is clear (no ceiling immediately above)
            if (!this._findCollision(entity, 'solid')) {
                // Move forward at the elevated height
                transform.x += dx;
                
                let wallBlocked = false;
                const colHigh = this._findCollision(entity, 'solid');
                if (colHigh) {
                    const mtvHigh = this._resolveOverlap(entity, colHigh);
                    if (mtvHigh && Math.abs(mtvHigh.axis?.x || 0) > 0.6) {
                        wallBlocked = true; // True wall, not a small step
                    }
                }

                if (!wallBlocked) {
                    // Step back down to ground
                    transform.y += stepUpHeight;
                    let groundHit = null;
                    let it = 0;
                    while (it < 4) {
                        const colDown = this._findCollision(entity, 'solid');
                        if (!colDown) break;
                        groundHit = colDown;
                        this._resolveOverlap(entity, colDown);
                        it++;
                    }

                    // Stepped over successfully!
                    hits.x = null;
                    if (groundHit) hits.y = groundHit;
                } else {
                    // Restore blocked state
                    transform.x = blockedX;
                    transform.y = blockedY;
                }
            } else {
                // Restore blocked state
                transform.x = blockedX;
                transform.y = blockedY;
            }
        }

        this._currentStepDx = 0;
        this._currentStepDy = 0;

        return hasCollision ? hits : null;
    }

    checkSolid(entity) {
        return this._findCollision(entity, 'solid');
    }

    checkOverlap(entity, targetTag = null) {
        if (entity.active === false) return null;

        const overlaps = this._findAllCollisions(entity, null, targetTag);
        if (overlaps.length === 0) return null;

        const dynamicEntity = overlaps.find(e => !e.components.Tilemap);
        if (dynamicEntity) return dynamicEntity; 

        return overlaps[0];
    }

    getColliderShape(entity, scriptId) {
        if (!entity || !entity.components || !entity.components.Collider) return null;
        const shapes = entity.components.Collider.data;
        if (!Array.isArray(shapes)) return null;
        const idLower = String(scriptId).trim().toLowerCase();
        return shapes.find(s => 
            s.scriptId === scriptId ||
            s.id === scriptId ||
            String(s.scriptId || '').toLowerCase() === idLower ||
            String(s.id || '').toLowerCase() === idLower
        ) || null;
    }

    setColliderEnabled(entity, scriptId, enabled = true) {
        const shape = this.getColliderShape(entity, scriptId);
        if (shape) {
            shape.enabled = Boolean(enabled);
            return true;
        }
        return false;
    }

    checkHitbox(attackerEntity, hitboxIdentifier, targetTag = null, targetTypes = null) {
        if (!attackerEntity || attackerEntity.active === false) return [];
        const attackerBounds = this.getBounds(attackerEntity);
        if (attackerBounds.length === 0) return [];

        let hbBound = null;
        if (typeof hitboxIdentifier === 'string') {
            const idLower = String(hitboxIdentifier).trim().toLowerCase();
            hbBound = attackerBounds.find(b =>
                b.scriptId === hitboxIdentifier ||
                b.id === hitboxIdentifier ||
                String(b.scriptId || '').toLowerCase() === idLower ||
                String(b.id || '').toLowerCase() === idLower
            );
        } else if (hitboxIdentifier && typeof hitboxIdentifier === 'object') {
            hbBound = hitboxIdentifier;
        }

        if (!hbBound) {
            hbBound = attackerBounds.find(b => b.type === 'hitbox') || attackerBounds[0];
        }
        if (!hbBound) return [];

        const validTargetTypes = Array.isArray(targetTypes) 
            ? targetTypes 
            : (targetTypes ? [targetTypes] : ['hurtbox', 'solid', 'trigger']);

        const results = [];
        const attackerId = attackerEntity.id || attackerEntity._id;
        const entities = this.game.world?.entities || [];
        const inactiveLayers = this._getInactiveLayers();

        for (let i = 0; i < entities.length; i++) {
            const other = entities[i];
            const otherId = other.id || other._id;
            if (otherId === attackerId || other.active === false) continue;
            if (other.layerId && inactiveLayers.has(other.layerId)) continue;

            if (targetTag && targetTag.trim() !== '') {
                const targetLower = targetTag.trim().toLowerCase();
                const match = typeof other.hasTag === 'function'
                    ? other.hasTag(targetLower)
                    : (Array.isArray(other.tags)
                        ? other.tags.some(t => String(t).trim().toLowerCase() === targetLower)
                        : String(other.tag || other.components?.Tags?.value || '').trim().toLowerCase() === targetLower);
                if (!match) continue;
            }

            const otherBounds = this.getBounds(other);
            if (otherBounds.length === 0) {
                const oT = other.components && (other.components.Transform || other.components.UITransform);
                if (oT) {
                    const fallbackBound = {
                        x: oT.x,
                        y: oT.y,
                        w: (oT.width || 32) * Math.abs(oT.scaleX ?? 1),
                        h: (oT.height || 32) * Math.abs(oT.scaleY ?? 1),
                        rotation: (oT.rotation || 0) * (Math.PI / 180),
                        pivotX: oT.pivotX ?? 0.5,
                        pivotY: oT.pivotY ?? 0.5,
                        cornerRadius: 0,
                        type: 'hurtbox'
                    };
                    if (this._obbIntersect(hbBound, fallbackBound)) {
                        results.push({ entity: other, targetBound: fallbackBound, attackerBound: hbBound });
                    }
                }
                continue;
            }

            for (const bB of otherBounds) {
                if (validTargetTypes.length > 0 && !validTargetTypes.includes(bB.type)) {
                    continue;
                }
                if (this._obbIntersect(hbBound, bB)) {
                    results.push({ entity: other, targetBound: bB, attackerBound: hbBound });
                    break;
                }
            }
        }

        return results;
    }

    _getInactiveLayers() {
        const worldLayers = this.game.world.layersWorld || [];
        const uiLayers = this.game.world.layersUI || [];
        const allLayers = [...worldLayers, ...uiLayers];
        
        return new Set(
            allLayers
                .filter(l => l.visible === false || l.active === false)
                .map(l => l._id)
        );
    }

    _getTilemapHitBounds(boundsA, tilemapEntity) {
        const tm = tilemapEntity?.components?.Tilemap;
        if (!tm || !tm.data) return null;

        const tileW = Number(tm.width || tm.tileWidth) || 32;
        const tileH = Number(tm.height || tm.tileHeight) || 32;
        if (tileW <= 0 || tileH <= 0) return null;

        const tf = RenderUtils ? RenderUtils.getGlobalTransform(tilemapEntity, this.game?.world) : (tilemapEntity.components?.Transform || { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 });
        const scaleX = (tf.flipX ? -1 : 1) * (tf.scaleX ?? 1);
        const scaleY = (tf.flipY ? -1 : 1) * (tf.scaleY ?? 1);
        if (scaleX === 0 || scaleY === 0) return null;

        const rotRad = (tf.rotation || 0) * (Math.PI / 180);
        const cosR = Math.cos(rotRad);
        const sinR = Math.sin(rotRad);

        const scaledTileW = tileW * scaleX;
        const scaledTileH = tileH * scaleY;
        const absTileW = Math.abs(scaledTileW);
        const absTileH = Math.abs(scaledTileH);

        const corners = this._getObbCorners(boundsA);
        if (!corners || corners.length === 0) return null;

        let minLocalX = Infinity;
        let maxLocalX = -Infinity;
        let minLocalY = Infinity;
        let maxLocalY = -Infinity;

        for (let i = 0; i < corners.length; i++) {
            const c = corners[i];
            const dx = c.x - tf.x;
            const dy = c.y - tf.y;
            const lx = (dx * cosR) + (dy * sinR);
            const ly = (-dx * sinR) + (dy * cosR);

            if (lx < minLocalX) minLocalX = lx;
            if (lx > maxLocalX) maxLocalX = lx;
            if (ly < minLocalY) minLocalY = ly;
            if (ly > maxLocalY) maxLocalY = ly;
        }

        let minGx, maxGx, minGy, maxGy;
        if (scaledTileW > 0) {
            minGx = Math.floor(minLocalX / scaledTileW);
            maxGx = Math.floor(maxLocalX / scaledTileW);
        } else {
            minGx = Math.floor(maxLocalX / scaledTileW);
            maxGx = Math.floor(minLocalX / scaledTileW);
        }

        if (scaledTileH > 0) {
            minGy = Math.floor(minLocalY / scaledTileH);
            maxGy = Math.floor(maxLocalY / scaledTileH);
        } else {
            minGy = Math.floor(maxLocalY / scaledTileH);
            maxGy = Math.floor(minLocalY / scaledTileH);
        }

        let bestHit = null;
        let maxOverlap = -1;

        for (let gy = minGy; gy <= maxGy; gy++) {
            for (let gx = minGx; gx <= maxGx; gx++) {
                const key = `${gx},${gy}`;
                let tileId = 0;
                if (Array.isArray(tm.data)) {
                    const cols = Number(tm.cols || tm.columns) || 0;
                    if (cols > 0 && gx >= 0 && gx < cols && gy >= 0) {
                        tileId = tm.data[gy * cols + gx] || 0;
                    }
                } else if (tm.data && typeof tm.data === 'object') {
                    tileId = tm.data[key] || 0;
                }

                if (!tileId || tileId <= 0) continue;

                const x1 = gx * scaledTileW;
                const x2 = (gx + 1) * scaledTileW;
                const y1 = gy * scaledTileH;
                const y2 = (gy + 1) * scaledTileH;

                const lxMin = Math.min(x1, x2);
                const lyMin = Math.min(y1, y2);

                const dstX = tf.x + (lxMin * cosR - lyMin * sinR);
                const dstY = tf.y + (lxMin * sinR + lyMin * cosR);

                const tileBounds = {
                    x: dstX,
                    y: dstY,
                    w: absTileW,
                    h: absTileH,
                    rotation: rotRad,
                    pivotX: 0,
                    pivotY: 0,
                    type: 'solid'
                };

                const hit = this._obbIntersect(boundsA, tileBounds);
                if (hit) {
                    if (hit.overlap > maxOverlap) {
                        maxOverlap = hit.overlap;
                        bestHit = tileBounds;
                    }
                }
            }
        }

        return bestHit;
    }

    _findCollision(entity, requiredType = null, targetTag = null) {
        const boundsAList = this.getBounds(entity);
        if (boundsAList.length === 0) return null;

        const currentId = entity.id || entity._id;
        const currentName = entity.scriptId || currentId;
        const entities = this.game.world.entities;
        const inactiveLayers = this._getInactiveLayers();

        const oneWayTag = entity._oneWayTag || entity.components?.Physics?._oneWayTag;
        const isDropping = Boolean((entity._dropThroughTimer > 0) || (entity.components?.Physics?._dropThroughTimer > 0));
        const phys = entity.components?.Physics;
        const isMovingUp = Boolean((phys && phys.velocityY < -0.01) || (this._currentStepDy !== undefined && this._currentStepDy < -0.001));

        let currFeetY = -Infinity;
        const solidBoundsA = boundsAList.filter(b => b.type === 'solid');
        if (solidBoundsA.length > 0) {
            for (let b of solidBoundsA) {
                const c = this._getObbCorners(b);
                const maxCy = Math.max(...c.map(pt => pt.y));
                if (maxCy > currFeetY) currFeetY = maxCy;
            }
        }
        const stepDy = this._currentStepDy || 0;
        const prevFeetY = currFeetY - stepDy;

        for (let i = 0; i < entities.length; i++) {
            const other = entities[i];
            const otherId = other.id || other._id;
            const otherName = other.scriptId || otherId;
            
            if (otherId === currentId) continue;
            if (other.active === false) continue;
            if (other.layerId && inactiveLayers.has(other.layerId)) continue;
            
            if (targetTag && targetTag.trim() !== "") {
                const targetLower = targetTag.trim().toLowerCase();
                const match = typeof other.hasTag === 'function'
                    ? other.hasTag(targetLower)
                    : (Array.isArray(other.tags)
                        ? other.tags.some(t => String(t).trim().toLowerCase() === targetLower)
                        : String(other.tag || other.components?.Tags?.value || '').trim().toLowerCase() === targetLower);
                if (!match) continue; 
            }

            const isOneWay = Boolean(oneWayTag && this.isOneWayPlatform(other, oneWayTag));

            if (isOneWay) {
                if (isDropping || isMovingUp) {
                    continue;
                }
            }

            if (other.components.Tilemap && other.components.Tilemap.isSolid) {
                if (requiredType !== null && requiredType !== 'solid') continue;
                
                for (let bA of boundsAList) {
                    if (requiredType !== null && bA.type !== requiredType) continue;
                    const hitBounds = this._getTilemapHitBounds(bA, other);
                    if (hitBounds) {
                        if (isOneWay) {
                            const tbCorners = this._getObbCorners(hitBounds);
                            const platformTopY = Math.min(...tbCorners.map(c => c.y));
                            const tolerance = Math.max(6, Math.abs(stepDy) + 2);
                            if (prevFeetY > platformTopY + tolerance) {
                                continue;
                            }
                            const intersect = this._obbIntersect(bA, hitBounds);
                            if (!intersect || (intersect.axis && intersect.axis.y >= -0.25)) {
                                continue;
                            }
                        }
                        console.log(`[ColliderSystem] Collision (Tilemap${isOneWay ? ' One-Way' : ''}): '${currentName}' collided with '${otherName}'`);
                        return other;
                    }
                }
            } else {
                const boundsBList = this.getBounds(other);
                if (boundsBList.length === 0) continue;

                for (let bA of boundsAList) {
                    if (requiredType !== null && bA.type !== requiredType) continue;
                    for (let bB of boundsBList) {
                        if (requiredType !== null && bB.type !== requiredType) continue;
                        if (this._obbIntersect(bA, bB)) {
                            if (isOneWay) {
                                const bBCorners = this._getObbCorners(bB);
                                const platformTopY = Math.min(...bBCorners.map(c => c.y));
                                const tolerance = Math.max(6, Math.abs(stepDy) + 2);
                                if (prevFeetY > platformTopY + tolerance) {
                                    continue;
                                }
                                const intersect = this._obbIntersect(bA, bB);
                                if (!intersect || (intersect.axis && intersect.axis.y >= -0.25)) {
                                    continue;
                                }
                            }
                            console.log(`[ColliderSystem] Collision detected${isOneWay ? ' (One-Way)' : ''}: '${currentName}' (${currentId}) <---> '${otherName}' (${otherId})`);
                            return other;
                        }
                    }
                }
            }
        }
        return null;
    }

    _findAllCollisions(entity, requiredType = null, targetTag = null) {
        const results = [];
        const boundsAList = this.getBounds(entity);
        if (boundsAList.length === 0) return results;

        const currentId = entity.id || entity._id;
        const currentName = entity.scriptId || currentId;
        const entities = this.game.world.entities;
        const inactiveLayers = this._getInactiveLayers();

        for (let i = 0; i < entities.length; i++) {
            const other = entities[i];
            const otherId = other.id || other._id;
            const otherName = other.scriptId || otherId;

            if (otherId === currentId) continue;
            if (other.active === false) continue;
            if (other.layerId && inactiveLayers.has(other.layerId)) continue;

            if (targetTag && targetTag.trim() !== "") {
                const targetLower = targetTag.trim().toLowerCase();
                const match = typeof other.hasTag === 'function'
                    ? other.hasTag(targetLower)
                    : (Array.isArray(other.tags)
                        ? other.tags.some(t => String(t).trim().toLowerCase() === targetLower)
                        : String(other.tag || other.components?.Tags?.value || '').trim().toLowerCase() === targetLower);
                if (!match) continue; 
            }

            let collided = false;

            if (other.components.Tilemap && other.components.Tilemap.isSolid) {
                if (requiredType !== null && requiredType !== 'solid') continue;
                
                for (let bA of boundsAList) {
                    if (requiredType !== null && bA.type !== requiredType) continue;
                    if (this._getTilemapHitBounds(bA, other)) {
                        collided = true;
                        break;
                    }
                }
            } else {
                const boundsBList = this.getBounds(other);
                for (let bA of boundsAList) {
                    if (requiredType !== null && bA.type !== requiredType) continue;
                    for (let bB of boundsBList) {
                        if (requiredType !== null && bB.type !== requiredType) continue;
                        if (this._obbIntersect(bA, bB)) {
                            collided = true;
                            break;
                        }
                    }
                    if (collided) break;
                }
            }

            if (collided) {
                console.log(`[ColliderSystem] Overlap/Collision Found: '${currentName}' collided with '${otherName}'`);
                results.push(other);
            }
        }
        return results;
    }

    getBounds(entity) {
        const t = entity.components.Transform;
        if (!t) return [];

        const boundsList = [];
        const isFlippedX = Boolean(t.flipX || (entity.components?.Physics?.facingDirection === 'left'));
        const scaleX = (t.scaleX ?? 1) * (t.flipX ? -1 : 1);
        const scaleY = (t.scaleY ?? 1) * (t.flipY ? -1 : 1);
        const tRotRad = (t.rotation || 0) * (Math.PI / 180) * (isFlippedX ? -1 : 1);
        const cosT = Math.cos(tRotRad);
        const sinT = Math.sin(tRotRad);

        const entityW = t.width || 32;
        const entityH = t.height || 32;

        const colliderComp = entity.components.Collider;
        if (colliderComp && Array.isArray(colliderComp.data)) {
            for (let i = 0; i < colliderComp.data.length; i++) {
                const c = colliderComp.data[i];
                if (!c.enabled) continue; 

                const cW = (c.autoFit ? entityW : c.width) * Math.abs(scaleX);
                const cH = (c.autoFit ? entityH : c.height) * Math.abs(scaleY);
                let pX = c.pivotX ?? 0.5;
                let pY = c.pivotY ?? 0.5;

                const localTlX = -entityW * Math.abs(scaleX) * (t.pivotX ?? 0.5) + (c.offsetX || 0) * Math.abs(scaleX);
                const localTlY = -entityH * Math.abs(scaleY) * (t.pivotY ?? 0.5) + (c.offsetY || 0) * Math.abs(scaleY);

                let localPx = localTlX + cW * pX;
                let localPy = localTlY + cH * pY;

                const shouldFlipX = isFlippedX && (c.autoFlipX !== false);
                if (shouldFlipX) {
                    localPx = -localPx;
                    pX = 1 - pX;
                }

                const isLockRot = Boolean(c.lockWorldRotation);
                const worldPx = isLockRot ? (t.x + localPx) : (t.x + localPx * cosT - localPy * sinT);
                const worldPy = isLockRot ? (t.y + localPy) : (t.y + localPx * sinT + localPy * cosT);

                let totalRot = isLockRot 
                    ? ((c.rotation || 0) * (Math.PI / 180) * (shouldFlipX ? -1 : 1)) 
                    : (c.autoFit ? tRotRad : tRotRad + (((c.rotation || 0) * (Math.PI / 180)) * (shouldFlipX ? -1 : 1)));

                const cRadius = Math.max(0, Math.min(
                    (Number(c.cornerRadius) || 0) * Math.min(Math.abs(scaleX), Math.abs(scaleY)),
                    cW * 0.5,
                    cH * 0.5
                ));

                boundsList.push({
                    x: worldPx, 
                    y: worldPy, 
                    w: cW, 
                    h: cH,
                    rotation: totalRot,
                    pivotX: pX,
                    pivotY: pY,
                    cornerRadius: cRadius,
                    type: c.type || 'solid',
                    id: c.id,
                    scriptId: c.scriptId,
                    shape: c
                });
            }
        }

        const shapeComp = entity.components.ShapeRenderer;
        if (shapeComp && shapeComp.elements) {
            const enablePoly = Boolean(shapeComp.enablePolygonCollision);
            const enableSeg = Boolean(shapeComp.enableSegmentCollision);
            const enableCircle = Boolean(shapeComp.enableCircleCollision);

            if (enablePoly || enableSeg || enableCircle) {
                const pointMap = new Map();
                for (const el of shapeComp.elements) {
                    if (el.type === 'point') pointMap.set(el.id, el);
                }

                const absScaleX = (entityW / 100) * scaleX;
                const absScaleY = (entityH / 100) * scaleY;

                const toWorld = (lx, ly) => {
                    const dx = lx * absScaleX;
                    const dy = ly * absScaleY;
                    return {
                        x: t.x + (dx * cosT - dy * sinT),
                        y: t.y + (dx * sinT + dy * cosT)
                    };
                };

                for (const el of shapeComp.elements) {
                    if (el.enabled === false) continue;

                    if (enablePoly && el.type === 'polygon') {
                        const pts = (el.points || []).map(id => pointMap.get(id)).filter(Boolean);
                        if (pts.length >= 3) {
                            boundsList.push({ 
                                type: 'solid', 
                                vertices: pts.map(p => toWorld(p.x, p.y)) 
                            });
                        }
                    }

                    if (enableSeg) {
                        if (el.type === 'segment') {
                            const pts = (el.points || []).map(id => pointMap.get(id)).filter(Boolean);
                            for (let k = 0; k < pts.length - 1; k++) {
                                boundsList.push({
                                    type: 'solid',
                                    vertices: [toWorld(pts[k].x, pts[k].y), toWorld(pts[k+1].x, pts[k+1].y)]
                                });
                            }
                        } else if (el.type === 'line') {
                            const p1 = pointMap.get(el.p1);
                            const p2 = pointMap.get(el.p2);
                            if (p1 && p2) {
                                boundsList.push({ 
                                    type: 'solid', 
                                    vertices: [toWorld(p1.x, p1.y), toWorld(p2.x, p2.y)] 
                                });
                            }
                        }
                    }

                    if (enableCircle && el.type === 'circle') {
                        const centerPt = pointMap.get(el.pCenter);
                        const edgePt = pointMap.get(el.pEdge);
                        if (centerPt && edgePt) {
                            const worldCenter = toWorld(centerPt.x, centerPt.y);
                            const worldEdge = toWorld(edgePt.x, edgePt.y);
                            const radius = Math.hypot(worldEdge.x - worldCenter.x, worldEdge.y - worldCenter.y);
                            
                            boundsList.push({
                                type: 'solid',
                                shapeType: 'circle',
                                x: worldCenter.x,
                                y: worldCenter.y,
                                radius: radius 
                            });
                        }
                    }
                }
            }
        }

        return boundsList;
    }

    _obbIntersect(a, b) {
        const isCircleA = a.shapeType === 'circle';
        const isCircleB = b.shapeType === 'circle';

        if (isCircleA && isCircleB) {
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy);
            const overlap = (a.radius + b.radius) - dist;
            
            if (overlap > 0) {
                const axis = dist > 0 ? { x: dx / dist, y: dy / dist } : { x: 1, y: 0 };
                return { overlap, axis };
            }
            return false;
        }

        const cornersA = isCircleA ? [] : (a.cornerRadius > 0 ? this._getInnerCorners(a) : this._getObbCorners(a));
        const cornersB = isCircleB ? [] : (b.cornerRadius > 0 ? this._getInnerCorners(b) : this._getObbCorners(b));

        const isSegmentA = cornersA.length === 2;
        const isSegmentB = cornersB.length === 2;
        const segmentCorners = isSegmentB ? cornersB : (isSegmentA ? cornersA : null);
        let segmentFloorNormal = null;

        if (segmentCorners) {
            const p1 = segmentCorners[0];
            const p2 = segmentCorners[1];
            const sx = p2.x - p1.x;
            const sy = p2.y - p1.y;
            const slen = Math.hypot(sx, sy) || 1;
            let nx = -sy / slen;
            let ny = sx / slen;
            if (ny > 0) { nx = -nx; ny = -ny; }
            if (ny < -0.2) {
                segmentFloorNormal = { x: nx, y: ny };
            }
        }
        
        const axes = [...this._getObbAxes(cornersA), ...this._getObbAxes(cornersB)];
        
        if (isCircleA && cornersB.length > 0) {
            const axis = this._getCircleToPolygonAxis(a, cornersB);
            if (axis) axes.push(axis);
        }
        if (isCircleB && cornersA.length > 0) {
            const axis = this._getCircleToPolygonAxis(b, cornersA);
            if (axis) axes.push(axis);
        }

        if (a.cornerRadius > 0 && cornersB.length > 0) {
            for (let i = 0; i < cornersA.length; i++) {
                const axis = this._getCircleToPolygonAxis(cornersA[i], cornersB);
                if (axis) axes.push(axis);
            }
        }
        if (b.cornerRadius > 0 && cornersA.length > 0) {
            for (let i = 0; i < cornersB.length; i++) {
                const axis = this._getCircleToPolygonAxis(cornersB[i], cornersA);
                if (axis) axes.push(axis);
            }
        }

        let minOverlap = Infinity;
        let smallestAxis = null;

        for (let i = 0; i < axes.length; i++) {
            const axis = axes[i];
            const pA = this._projectShape(a, cornersA, axis);
            const pB = this._projectShape(b, cornersB, axis);
            
            if (pA.max <= pB.min || pB.max <= pA.min) return false;
            
            // Ghost collision prevention: Floor segments must never select horizontal wall axes (|axis.y| < 0.2)
            if (segmentFloorNormal && Math.abs(axis.y) < 0.2) {
                continue;
            }

            const overlap = Math.min(pA.max - pB.min, pB.max - pA.min);
            if (overlap < minOverlap) {
                minOverlap = overlap;
                smallestAxis = axis;
            }
        }

        // For floor segments, always prioritize pushing along the segment's upward floor normal
        if (segmentFloorNormal) {
            smallestAxis = segmentFloorNormal;
            const pA = this._projectShape(a, cornersA, smallestAxis);
            const pB = this._projectShape(b, cornersB, smallestAxis);
            minOverlap = Math.min(pA.max - pB.min, pB.max - pA.min);
        }

        if (!smallestAxis) return false;

        if (segmentFloorNormal) {
            // A floor segment must always push the colliding entity upwards out of the ground
            if (isSegmentB) {
                if (smallestAxis.y > 0) {
                    smallestAxis = { x: -smallestAxis.x, y: -smallestAxis.y };
                }
            } else {
                if (smallestAxis.y < 0) {
                    smallestAxis = { x: -smallestAxis.x, y: -smallestAxis.y };
                }
            }
        } else {
            const cxA = isCircleA ? a.x : cornersA.reduce((sum, c) => sum + c.x, 0) / (cornersA.length || 1);
            const cyA = isCircleA ? a.y : cornersA.reduce((sum, c) => sum + c.y, 0) / (cornersA.length || 1);
            
            const cxB = isCircleB ? b.x : cornersB.reduce((sum, c) => sum + c.x, 0) / (cornersB.length || 1);
            const cyB = isCircleB ? b.y : cornersB.reduce((sum, c) => sum + c.y, 0) / (cornersB.length || 1);

            const dx = cxA - cxB;
            const dy = cyA - cyB;

            if (smallestAxis && (dx * smallestAxis.x + dy * smallestAxis.y < 0)) {
                smallestAxis.x *= -1;
                smallestAxis.y *= -1;
            }
        }

        return { overlap: minOverlap, axis: smallestAxis };
    }

    _projectShape(shape, corners, axis) {
        if (shape.shapeType === 'circle') {
            const centerProj = shape.x * axis.x + shape.y * axis.y;
            return { 
                min: centerProj - shape.radius, 
                max: centerProj + shape.radius 
            };
        }
        
        let min = Infinity, max = -Infinity;
        for (let i = 0; i < corners.length; i++) {
            const dot = corners[i].x * axis.x + corners[i].y * axis.y;
            if (dot < min) min = dot;
            if (dot > max) max = dot;
        }

        if (shape.cornerRadius > 0) {
            return { 
                min: min - shape.cornerRadius, 
                max: max + shape.cornerRadius 
            };
        }

        return { min, max };
    }

    _getInnerCorners(b) {
        const r = b.cornerRadius || 0;
        if (r <= 0) return this._getObbCorners(b);

        const cx = b.x; 
        const cy = b.y;
        const cos = Math.cos(b.rotation || 0);
        const sin = Math.sin(b.rotation || 0);
        
        const left = -b.w * (b.pivotX ?? 0.5) + r;
        const right = b.w * (1 - (b.pivotX ?? 0.5)) - r;
        const top = -b.h * (b.pivotY ?? 0.5) + r;
        const bottom = b.h * (1 - (b.pivotY ?? 0.5)) - r;
        
        return [
            { x: cx + left*cos - top*sin, y: cy + left*sin + top*cos },      
            { x: cx + right*cos - top*sin, y: cy + right*sin + top*cos },   
            { x: cx + right*cos - bottom*sin, y: cy + right*sin + bottom*cos }, 
            { x: cx + left*cos - bottom*sin, y: cy + left*sin + bottom*cos }
        ];
    }

    _getCircleToPolygonAxis(circle, corners) {
        let closestDistSq = Infinity;
        let closestPt = null;

        for (let i = 0; i < corners.length; i++) {
            const dx = corners[i].x - circle.x;
            const dy = corners[i].y - circle.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < closestDistSq) {
                closestDistSq = distSq;
                closestPt = corners[i];
            }
        }

        if (!closestPt) return null;

        const dx = closestPt.x - circle.x;
        const dy = closestPt.y - circle.y;
        const len = Math.hypot(dx, dy);
        
        if (len > 0) return { x: dx / len, y: dy / len };
        return { x: 1, y: 0 }; 
    }

    _getObbCorners(b) {
        if (b.vertices) return b.vertices; 
        if (b.shapeType === 'circle') {
            const r = b.radius;
            return [
                { x: b.x - r, y: b.y - r }, 
                { x: b.x + r, y: b.y - r },
                { x: b.x + r, y: b.y + r },
                { x: b.x - r, y: b.y + r } 
            ];
        }

        const cx = b.x; 
        const cy = b.y;
        const cos = Math.cos(b.rotation || 0);
        const sin = Math.sin(b.rotation || 0);
        
        const left = -b.w * (b.pivotX ?? 0.5);
        const right = b.w * (1 - (b.pivotX ?? 0.5));
        const top = -b.h * (b.pivotY ?? 0.5);
        const bottom = b.h * (1 - (b.pivotY ?? 0.5));
        
        return [
            { x: cx + left*cos - top*sin, y: cy + left*sin + top*cos },      
            { x: cx + right*cos - top*sin, y: cy + right*sin + top*cos },   
            { x: cx + right*cos - bottom*sin, y: cy + right*sin + bottom*cos }, 
            { x: cx + left*cos - bottom*sin, y: cy + left*sin + bottom*cos }
        ];
    }

    _getObbAxes(c) {
        const axes = [];
        for (let i = 0; i < c.length; i++) {
            const p1 = c[i];
            const p2 = c[(i + 1) % c.length];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.hypot(dx, dy);
            if (len > 0) {
                axes.push({ x: -dy / len, y: dx / len }); 
            }
        }
        return axes;
    }

    _resolveOverlap(entity, other) {
        const t = entity.components.Transform;
        const boundsAList = this.getBounds(entity).filter(b => b.type === 'solid');
        
        let mtv = null;

        for (let bA of boundsAList) {
            if (other.components.Tilemap && Boolean(other.components.Tilemap.isSolid)) {
                let hitBounds = this._getTilemapHitBounds(bA, other);
                if (hitBounds) {
                    mtv = this._obbIntersect(bA, hitBounds);
                }
            } else {
                const boundsBList = this.getBounds(other).filter(b => b.type === 'solid');
                for (let bB of boundsBList) {
                    let res = this._obbIntersect(bA, bB);
                    if (res) {
                        mtv = res;
                        break;
                    }
                }
            }
            if (mtv) break;
        }

        if (!mtv || !mtv.axis || !Number.isFinite(mtv.overlap)) return null;

        const oneWayTag = entity._oneWayTag || entity.components?.Physics?._oneWayTag;
        const isOneWay = Boolean(oneWayTag && this.isOneWayPlatform(other, oneWayTag));

        if (isOneWay) {
            const isDropping = Boolean((entity._dropThroughTimer > 0) || (entity.components?.Physics?._dropThroughTimer > 0));
            const isMovingUp = Boolean((entity.components?.Physics?.velocityY < -0.01) || (this._currentStepDy !== undefined && this._currentStepDy < -0.001));
            if (isDropping || isMovingUp) {
                return null;
            }
            // One-way platforms only act as floors (pushing up), never walls or ceilings
            if (mtv.axis.y >= -0.25) {
                return null;
            }
        }

        // Walkable floor or slope: normal points upward (axis.y < -0.25, up to ~75 deg)
        // Resolve purely vertically so horizontal walking velocity is never pushed backwards uphill!
        if (mtv.axis.y < -0.25) {
            const verticalPush = -(mtv.overlap + 0.005) / Math.abs(mtv.axis.y);
            const clampedPushY = Math.max(-24, Math.min(0, verticalPush));
            if (Number.isFinite(clampedPushY)) t.y += clampedPushY;
        } else {
            const pushX = (Number(mtv.axis.x) || 0) * (mtv.overlap + 0.005);
            const pushY = (Number(mtv.axis.y) || 0) * (mtv.overlap + 0.005);
            if (Number.isFinite(pushX)) t.x += pushX;
            if (Number.isFinite(pushY)) t.y += pushY;
        }
        
        return mtv;
    }
}
__exports.default = ColliderSystem;
};
// === Module: System/EntitySystem.js ===
__reg.m["System/EntitySystem.js"] = function(__require, __exports, __module) {
const __imp_0 = __require("Loader/SceneLoader.js"); const SceneLoader = __imp_0.default !== undefined ? __imp_0.default : __imp_0;
const __imp_1 = __require("Core/Config.js"); const Config = __imp_1.default !== undefined ? __imp_1.default : __imp_1;

class EntitySystem {
    constructor(game) {
        this.game = game;
    }

    getEntity(targetId, ownerEntity = null) {
        if (!targetId) return ownerEntity;
        if (typeof targetId === 'object') {
            return targetId;
        }
        if (typeof targetId !== 'string' || targetId.trim().toLowerCase() === 'self') {
            return ownerEntity;
        }

        const searchKey = targetId.trim();
        const searchLower = searchKey.toLowerCase();
        const searchSlug = searchLower.replace(/\s+/g, '_');
        const entities = this.game?.world?.entities || [];

        const found = entities.find(e => 
            e.id === searchKey || 
            (e.scriptId && (e.scriptId.toLowerCase() === searchLower || e.scriptId.toLowerCase() === searchSlug))
        );

        return found || null;
    }
    
    destroyEntity(target) {
        const world = this.game?.world;
        if (!target || !world) return;

        let entity = target;
        if (typeof target === 'string') {
            entity = this.getEntity(target) || (world.entities ? world.entities.find(e => e.id === target) : null);
        }
        if (!entity || !entity.id) return;

        // Mark as destroyed so script runners, cameras, and external systems immediately stop
        entity._isDestroyed = true;

        const entityId = entity.id;

        // Cascade destroy children from world.entities
        const children = (world.entities || []).filter(e => e.parentId === entityId);
        for (const child of children) {
            if (!child._isDestroyed) {
                this.destroyEntity(child);
            }
        }

        // Also cascade destroy from entity.children if any
        if (Array.isArray(entity.children)) {
            for (const child of [...entity.children]) {
                if (child && !child._isDestroyed) {
                    this.destroyEntity(child);
                }
            }
        }

        // Unlink from parent children array if it has one
        if (entity.parentId) {
            const parent = (world.entities || []).find(e => e.id === entity.parentId);
            if (parent && Array.isArray(parent.children)) {
                parent.children = parent.children.filter(c => c.id !== entityId);
            }
        }

        // Clean up from scriptIdMap
        if (world.scriptIdMap && entity.scriptId) {
            world.scriptIdMap.delete(entity.scriptId);
        }

        // Remove from world.entities
        if (Array.isArray(world.entities)) {
            world.entities = world.entities.filter(e => e.id !== entityId);
        }

        // Remove from all layers (both world and UI layers)
        const allLayers = world.allLayers || [];
        for (const layer of allLayers) {
            if (layer && Array.isArray(layer.entities)) {
                layer.entities = layer.entities.filter(e => e.id !== entityId);
            }
        }

        // Clean up entity scripts, physics bodies, and colliders
        if (this.game.scriptSystem && typeof this.game.scriptSystem.removeEntityScripts === 'function') {
            this.game.scriptSystem.removeEntityScripts(entity);
        }
        if (this.game.physicsSystem && typeof this.game.physicsSystem.removeBody === 'function') {
            this.game.physicsSystem.removeBody(entity);
        }
        if (this.game.colliderSystem && typeof this.game.colliderSystem.removeCollider === 'function') {
            this.game.colliderSystem.removeCollider(entity);
        }
    }

    destroyEntitiesByTag(tag) {
        const world = this.game?.world;
        if (!tag || !world || !Array.isArray(world.entities)) return 0;

        const targetTag = String(tag).trim().toLowerCase();
        const matches = world.entities.filter(e => {
            if (typeof e.hasTag === 'function') return e.hasTag(targetTag);
            if (Array.isArray(e.tags)) return e.tags.some(t => String(t).trim().toLowerCase() === targetTag);
            return String(e.tag || '').trim().toLowerCase() === targetTag;
        });
        let count = 0;

        for (const entity of matches) {
            if (!entity._isDestroyed) {
                this.destroyEntity(entity);
                count++;
            }
        }

        return count;
    }

    destroyByTag(tag) {
        return this.destroyEntitiesByTag(tag);
    }

    async cloneEntity(sourceEntity) {
        if (!sourceEntity) return null;

        const world = this.game.world;
        const clonedData = JSON.parse(JSON.stringify(sourceEntity));

        const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
        const newId = 'ent_clone_' + generateId();
        const newScriptId = 'script_clone_' + generateId();

        clonedData.id = newId;
        clonedData.scriptId = newScriptId;
        clonedData.children = [];

        const sceneLoader = new SceneLoader(world, Config.ENGINE_MODE);
        const entity = sceneLoader._createEntityInstance(clonedData);

        if (!entity) return null;

        world.addEntity(entity);
        if (world.scriptIdMap) {
            world.scriptIdMap.set(entity.scriptId, entity);
        }

        if (world.allLayers) {
            const layer = world.allLayers.find(l => l.id === entity.layerId);
            if (layer) {
                layer.entities.push(entity);
                layer.entities.sort((a, b) => {
                    if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
                    return a.orderIndex - b.orderIndex;
                });
            }
        }

        if (entity.parentId) {
            const parent = world.entities.find(e => e.id === entity.parentId);
            if (parent) parent.addChild(entity);
        }

        if (Config.ENGINE_MODE === "runtime") {
            this.initializeSingleEntityScript(entity);
        }

        return entity;
    }

    initializeSingleEntityScript(entity) {
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

                const newScriptData = { ...asset, variables: mergedVars };
                this.game.scriptSystem.add(newScriptData, entity);

                const newRunner = this.game.scriptSystem.runners[this.game.scriptSystem.runners.length - 1];
                if (newRunner) {
                    newRunner.start();
                }
            }
        });
    }

    getParent(entity) {
        if (!entity || !entity.parentId) return null;
        const entities = this.game?.world?.entities || [];
        return entities.find(e => e.id === entity.parentId) || null;
    }

    getChildren(entity) {
        if (!entity) return [];
        const entities = this.game?.world?.entities || [];
        return entities.filter(e => e.parentId === entity.id);
    }

    getRoot(entity) {
        if (!entity) return null;
        let current = entity;
        const entities = this.game?.world?.entities || [];
        while (current && current.parentId) {
            const parent = entities.find(e => e.id === current.parentId);
            if (!parent) break;
            current = parent;
        }
        return current;
    }

    findClosestByTag(tag, fromXOrEntity, optFromY) {
        const entities = this.game?.world?.entities || [];
        let originX = 0;
        let originY = 0;
        let excludeId = null;

        if (typeof fromXOrEntity === 'object' && fromXOrEntity !== null) {
            excludeId = fromXOrEntity.id;
            const t = fromXOrEntity.components?.Transform || fromXOrEntity.components?.UITransform;
            originX = t ? (t.x || 0) : 0;
            originY = t ? (t.y || 0) : 0;
        } else {
            originX = Number(fromXOrEntity) || 0;
            originY = Number(optFromY) || 0;
        }

        let closest = null;
        let minDistanceSq = Infinity;
        const targetTag = String(tag || '').trim().toLowerCase();
        if (!targetTag) return null;

        for (const other of entities) {
            if (other.active === false) continue;
            if (excludeId && other.id === excludeId) continue;
            const match = typeof other.hasTag === 'function'
                ? other.hasTag(targetTag)
                : (Array.isArray(other.tags)
                    ? other.tags.some(t => String(t).trim().toLowerCase() === targetTag)
                    : String(other.tag || other.components?.Tags?.value || '').trim().toLowerCase() === targetTag);
            if (match) {
                const t = other.components?.Transform || other.components?.UITransform;
                const ox = t ? (t.x || 0) : 0;
                const oy = t ? (t.y || 0) : 0;
                const dx = ox - originX;
                const dy = oy - originY;
                const distSq = dx * dx + dy * dy;
                if (distSq < minDistanceSq) {
                    minDistanceSq = distSq;
                    closest = other;
                }
            }
        }
        return closest;
    }

    getAllByTag(tag) {
        const entities = this.game?.world?.entities || [];
        const targetTag = String(tag || '').trim().toLowerCase();
        if (!targetTag) return [];

        return entities.filter(e => {
            if (e.active === false) return false;
            if (typeof e.hasTag === 'function') return e.hasTag(targetTag);
            if (Array.isArray(e.tags)) return e.tags.some(t => String(t).trim().toLowerCase() === targetTag);
            const otherTag = e.tag || e.components?.Tags?.value;
            return String(otherTag || '').trim().toLowerCase() === targetTag;
        });
    }

    getEntitiesByTag(tag) {
        return this.getAllByTag(tag);
    }

    getEntitiesByAnyTag(tags = []) {
        if (!Array.isArray(tags) || tags.length === 0) return [];
        const targetTags = tags.map(t => String(t).trim().toLowerCase()).filter(Boolean);
        const entities = this.game?.world?.entities || [];
        return entities.filter(e => {
            if (e.active === false) return false;
            return targetTags.some(t => {
                if (typeof e.hasTag === 'function') return e.hasTag(t);
                if (Array.isArray(e.tags)) return e.tags.some(tagItem => String(tagItem).trim().toLowerCase() === t);
                const otherTag = e.tag || e.components?.Tags?.value;
                return String(otherTag || '').trim().toLowerCase() === t;
            });
        });
    }

    getEntitiesByAllTags(tags = []) {
        if (!Array.isArray(tags) || tags.length === 0) return [];
        const targetTags = tags.map(t => String(t).trim().toLowerCase()).filter(Boolean);
        const entities = this.game?.world?.entities || [];
        return entities.filter(e => {
            if (e.active === false) return false;
            return targetTags.every(t => {
                if (typeof e.hasTag === 'function') return e.hasTag(t);
                if (Array.isArray(e.tags)) return e.tags.some(tagItem => String(tagItem).trim().toLowerCase() === t);
                const otherTag = e.tag || e.components?.Tags?.value;
                return String(otherTag || '').trim().toLowerCase() === t;
            });
        });
    }

    findByName(name) {
        const searchLower = String(name).trim().toLowerCase();
        const searchSlug = searchLower.replace(/\s+/g, '_');
        const entities = this.game?.world?.entities || [];
        return entities.find(e => 
            (e.scriptId && (e.scriptId.toLowerCase() === searchLower || e.scriptId.toLowerCase() === searchSlug)) || 
            e.id === name
        ) || null;
    }

    findByScriptId(scriptId) {
        const searchLower = String(scriptId).trim().toLowerCase();
        const searchSlug = searchLower.replace(/\s+/g, '_');
        const entities = this.game?.world?.entities || [];
        return entities.find(e => 
            (e.scriptId && (e.scriptId.toLowerCase() === searchLower || e.scriptId.toLowerCase() === searchSlug))
        ) || null;
    }
}
__exports.default = EntitySystem;
};
// === Module: System/LayerSystem.js ===
__reg.m["System/LayerSystem.js"] = function(__require, __exports, __module) {
class LayerSystem {
    constructor(game) {
        this.game = game;
    }

    getLayer(layerId, contextEntity = null) {
        const allLayers = this.game?.world?.allLayers || [];
        let targetId = layerId;
        if (!targetId || targetId === 'self') {
            targetId = contextEntity?.layerId;
            if (!targetId) {
                return allLayers[0] || null;
            }
        }
        const search = String(targetId).trim().toLowerCase();
        const slug = search.replace(/\s+/g, '_');
        return allLayers.find(l => 
            l.id === targetId || 
            (l.scriptId && (l.scriptId.toLowerCase() === search || l.scriptId.toLowerCase() === slug))
        ) || null;
    }

    _isEntityAndParentsActive(entity) {
        if (!entity || entity.active === false || entity.visible === false) return false;
        const world = this.game?.world;
        if (!world) return true;
        let current = entity;
        while (current && current.parentId) {
            const parentId = current.parentId;
            current = world.entities ? world.entities.find(e => e.id === parentId || (e.scriptId && e.scriptId === parentId)) : null;
            if (!current) break;
            if (current.active === false || current.visible === false) return false;
        }
        return true;
    }

    isInputFrozen(layerId, inputType = 'all', contextEntity = null) {
        const layer = this.getLayer(layerId, contextEntity);
        if (!layer) return false;
        if (layer.active === false || layer.visible === false) return true;
        if (!layer.freezeInput) return false;
        const layerType = (layer.freezeInputType || 'all').toLowerCase();
        const requestedType = (inputType || 'all').toLowerCase();
        if (layerType === 'all' || requestedType === 'all') return true;
        return layerType === requestedType;
    }

    freezeInput(layerId, active = true, inputType = 'all', contextEntity = null) {
        const layer = this.getLayer(layerId, contextEntity);
        if (!layer) return false;
        layer.freezeInput = Boolean(active);
        layer.freezeInputType = (inputType || 'all').toLowerCase();
        return true;
    }

    isEntityInputFrozen(entity, inputType = 'all') {
        if (!entity) return false;
        if (!this._isEntityAndParentsActive(entity)) return true;
        const layer = this.getLayer(entity.layerId, entity);
        if (layer && (layer.active === false || layer.visible === false)) return true;
        if (entity.layerId) {
            return this.isInputFrozen(entity.layerId, inputType, entity);
        }
        return false;
    }

    destroyLayer(layerTarget, destroyEntities = true, contextEntity = null) {
        const layer = this.getLayer(layerTarget, contextEntity);
        if (!layer) return false;

        const layerId = layer.id;
        const world = this.game?.world;
        if (!world) return false;

        if (destroyEntities && this.game.entitySystem) {
            const allEntities = [...(world.entities || [])];
            const entitiesToDestroy = allEntities.filter(e => e.layerId === layerId);
            if (Array.isArray(layer.entities)) {
                for (const e of layer.entities) {
                    if (!entitiesToDestroy.includes(e)) {
                        entitiesToDestroy.push(e);
                    }
                }
            }
            for (const ent of entitiesToDestroy) {
                if (!ent._isDestroyed) {
                    this.game.entitySystem.destroyEntity(ent);
                }
            }
        }

        if (Array.isArray(world.layersWorld)) {
            world.layersWorld = world.layersWorld.filter(l => l.id !== layerId);
        }
        if (Array.isArray(world.layersUI)) {
            world.layersUI = world.layersUI.filter(l => l.id !== layerId);
        }

        return true;
    }
}
__exports.default = LayerSystem;
};
// === Module: System/PhysicsSystem.js ===
__reg.m["System/PhysicsSystem.js"] = function(__require, __exports, __module) {
class PhysicsSystem {
    constructor(game) {
        this.game = game;
        this.MAX_VELOCITY = 2500;
        this.MIN_MOVE_DISTANCE = 0.001;
    }

    update(dt) {
        if (this.game.isPaused) return;

        const sceneSettings = this.game.world?.settings?.physics || {};
        const GLOBAL_GRAVITY = typeof sceneSettings.gravity === 'number' ? sceneSettings.gravity : 1200;
        const GLOBAL_DRAG = typeof sceneSettings.drag === 'number' ? sceneSettings.drag : 5;

        const entities = this.game.world.entities;
        const inactiveLayers = this.game.colliderSystem._getInactiveLayers();

        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];

            if (entity.active === false) continue;
            if (entity.layerId && inactiveLayers.has(entity.layerId)) continue;
            if (!entity.components.Physics || !entity.components.Physics.enabled) continue;
            if (!entity.components.Transform) continue;

            const phys = entity.components.Physics;

            if (phys.isFrozen) continue;

            if (typeof phys._dropThroughTimer === 'number' && phys._dropThroughTimer > 0) {
                phys._dropThroughTimer = Math.max(0, phys._dropThroughTimer - dt);
                entity._dropThroughTimer = phys._dropThroughTimer;
            } else if (typeof entity._dropThroughTimer === 'number' && entity._dropThroughTimer > 0) {
                entity._dropThroughTimer = Math.max(0, entity._dropThroughTimer - dt);
            }

            if (entity._dropThroughEntity && (entity._dropThroughTimer > 0 || phys._dropThroughTimer > 0)) {
                const dropEnt = entity._dropThroughEntity;
                const colSys = this.game.colliderSystem;
                let dropBottomY = -Infinity;
                if (dropEnt.components?.Tilemap) {
                    const sensorTemp = { x: entity.components.Transform.x, y: entity.components.Transform.y, w: 2, h: 2, rotation: 0, pivotX: 0.5, pivotY: 0.5 };
                    const tb = colSys._getTilemapHitBounds(sensorTemp, dropEnt);
                    if (tb) {
                        const c = colSys._getObbCorners(tb);
                        dropBottomY = Math.max(...c.map(pt => pt.y));
                    }
                } else if (dropEnt.components?.Collider || dropEnt.components?.ShapeRenderer) {
                    const bList = colSys.getBounds(dropEnt).filter(b => b.type === 'solid');
                    for (let b of bList) {
                        const c = colSys._getObbCorners(b);
                        const bY = Math.max(...c.map(pt => pt.y));
                        if (bY > dropBottomY) dropBottomY = bY;
                    }
                }
                const playerBounds = colSys.getBounds(entity).filter(b => b.type === 'solid');
                let playerTopY = Infinity;
                for (let pb of playerBounds) {
                    const c = colSys._getObbCorners(pb);
                    const minY = Math.min(...c.map(pt => pt.y));
                    if (minY < playerTopY) playerTopY = minY;
                }
                if (dropBottomY > -Infinity && playerTopY > dropBottomY + 2) {
                    entity._dropThroughTimer = 0;
                    phys._dropThroughTimer = 0;
                    entity._dropThroughEntity = null;
                    phys._dropThroughEntity = null;
                }
            }

            phys.collisionInfo = { hitSolid: null, hitSolidX: null, hitSolidY: null, hitTrigger: null };

            const isTopDown = phys.motionMode === 'topdown' || (phys.gravityScale === 0 && phys.motionMode !== 'platformer');
            const preDragVelocityX = phys.velocityX;

            if (!isTopDown && phys.gravityScale !== 0) {
                phys.velocityY += GLOBAL_GRAVITY * phys.gravityScale * dt;
            }

            if (phys.drag > 0) {
                const effectiveDrag = GLOBAL_DRAG * phys.drag;
                const damping = Math.max(0, 1 - (effectiveDrag * dt));
                phys.velocityX *= damping;
                if (isTopDown || phys.gravityScale === 0) {
                    phys.velocityY *= damping;
                }
            }

            if (phys._isIntentionalMove === undefined) {
                phys._isIntentionalMove = Math.abs(preDragVelocityX) > 10;
            }

            phys.velocityX = Math.max(-this.MAX_VELOCITY, Math.min(this.MAX_VELOCITY, phys.velocityX));
            phys.velocityY = Math.max(-this.MAX_VELOCITY, Math.min(this.MAX_VELOCITY, phys.velocityY));

            const wasGrounded = Boolean(phys.isGrounded);
            phys._wasGrounded = wasGrounded;

            // Rest on slope/floor (Godot floor_stop_on_slope pattern):
            // When already grounded and at rest, zero vertical velocity so gravity doesn't push down into ground every frame
            if (wasGrounded && phys.isGrounded && phys.velocityY >= 0 && Math.abs(phys.velocityX) < 5) {
                phys.velocityY = 0;
            }

            const baseDx = phys.velocityX * dt;
            let dx = baseDx;
            let dy = phys.velocityY * dt;

            // Constant speed along slope: project horizontal velocity along slope tangent
            const maxAngle = typeof phys.maxSlopeAngle === 'number' && phys.maxSlopeAngle > 0 ? phys.maxSlopeAngle : 60;
            if (wasGrounded && phys.alignToSlope && phys.groundAngle && phys.velocityY >= 0 && Math.abs(phys.groundAngle) <= maxAngle && Math.abs(phys.velocityX) > 5) {
                const angleRad = (phys.groundAngle * Math.PI) / 180;
                const cos = Math.cos(angleRad);
                const sin = Math.sin(angleRad);
                
                // Total speed along slope surface is kept constant: sqrt(dx^2 + dy^2) = |baseDx|
                dx = baseDx * cos;
                dy = baseDx * sin;
            }

            if (Math.abs(dx) > this.MIN_MOVE_DISTANCE || Math.abs(dy) > this.MIN_MOVE_DISTANCE) {
                const hitResult = this.game.colliderSystem.moveAndSlide(entity, dx, dy);
                if (hitResult) {
                    phys.collisionInfo.hitSolidX = hitResult.x;
                    phys.collisionInfo.hitSolidY = hitResult.y;
                    phys.collisionInfo.hitSolid = hitResult.x || hitResult.y;
                    
                    if (hitResult.normals && hitResult.normals.length > 0) {
                        for (let j = 0; j < hitResult.normals.length; j++) {
                            const n = hitResult.normals[j];
                            const isWalkableFloor = n.y < -0.25; // slope normal pointing mostly up (< ~75 deg)

                            if (isWalkableFloor) {
                                // For floors and walkable slopes, only cancel downward velocity
                                if (phys.velocityY > 0) {
                                    phys.velocityY = 0;
                                }
                                phys._lastSlideNormal = { x: n.x, y: n.y };
                            } else {
                                // For walls and ceilings, cancel velocity into the obstacle
                                const dot = phys.velocityX * n.x + phys.velocityY * n.y;
                                if (dot < 0) {
                                    phys.velocityX -= dot * n.x;
                                    phys.velocityY -= dot * n.y;
                                }
                            }
                        }
                    }
                }
            }

            if (!isTopDown && phys.gravityScale !== 0) {
                this._checkGrounded(entity, phys, inactiveLayers);
            } else {
                phys.isGrounded = true;
            }

            this._checkTriggers(entity, phys);

            if (!isTopDown && phys.gravityScale !== 0) {
                if (phys.isGrounded && phys.velocityY > 0) {
                    phys.velocityY = 0;
                }
            }

            if (!isTopDown && phys.alignToSlope) {
                this._updateSlopeAlignment(entity, phys, dt);
            }

            this._updateMovementState(phys, dt);
        }
    }

    _updateMovementState(phys, dt) {
        const isTopDown = phys.motionMode === 'topdown' || (phys.gravityScale === 0 && phys.motionMode !== 'platformer');

        if (isTopDown) {
            if (phys._isIntentionalMove || Math.abs(phys.velocityX) > 50 || Math.abs(phys.velocityY) > 50) {
                phys.movementState = "running";
            } else {
                phys.movementState = "idle";
            }
            phys.isGrounded = true;
        } else {
            if (phys.isGrounded) {
                phys._groundedGraceTimer = 0.12; // 120ms coyote grace window
                if (phys._isIntentionalMove || Math.abs(phys.velocityX) > 50) {
                    phys.movementState = "running";
                } else {
                    phys.movementState = "idle";
                }
            } else {
                // If recently grounded and moving downward (e.g. running down a slope), prevent flickering to falling
                if (phys._groundedGraceTimer > 0 && phys.velocityY >= 0) {
                    phys._groundedGraceTimer -= dt;
                    if (phys._isIntentionalMove || Math.abs(phys.velocityX) > 50) {
                        phys.movementState = "running";
                    } else {
                        phys.movementState = "idle";
                    }
                } else {
                    if (phys.velocityY < 0) {
                        phys.movementState = "jumping";
                    } else {
                        phys.movementState = "falling";
                    }
                }
            }
        }
    }

    _checkGrounded(entity, physComponent, inactiveLayers) {
        const colliderSys = this.game.colliderSystem;
        const boundsList = colliderSys.getBounds(entity).filter(b => b.type === 'solid');

        if (boundsList.length === 0) {
            physComponent.isGrounded = false;
            physComponent.groundAngle = 0;
            physComponent.groundNormal = { x: 0, y: -1 };
            physComponent.isGroundedOnOneWay = false;
            physComponent.groundEntity = null;
            physComponent.groundType = null;
            return;
        }

        let isGrounded = false;
        let groundAngle = 0;
        let groundNormal = { x: 0, y: -1 };
        let dominant = null;
        const entities = this.game.world.entities;

        if (!inactiveLayers) {
            inactiveLayers = colliderSys._getInactiveLayers();
        }

        const oneWayTag = physComponent._oneWayTag || entity._oneWayTag;
        const isDropping = Boolean((entity._dropThroughTimer > 0) || (physComponent._dropThroughTimer > 0));
        const isMovingUp = physComponent.velocityY < -10;

        for (let bA of boundsList) {
            const corners = colliderSys._getObbCorners(bA);
            const bottomY = Math.max(...corners.map(c => c.y));
            const minX = Math.min(...corners.map(c => c.x));
            const maxX = Math.max(...corners.map(c => c.x));
            const w = maxX - minX;

            const inset = bA.cornerRadius > 0 ? Math.min(bA.cornerRadius * 0.8, w * 0.4) : 2;
            const reach = physComponent.alignToSlope ? 10 : 3;
            const sensor = {
                x: minX + inset,
                y: bottomY,
                w: Math.max(1, w - (inset * 2)),
                h: reach,
                rotation: 0,
                pivotX: 0,
                pivotY: 0
            };

            const footCenterX = (minX + maxX) / 2;
            const sensorLeft = minX + inset;
            const sensorRight = maxX - inset;
            const candidates = [];

            for (let i = 0; i < entities.length; i++) {
                const other = entities[i];
                if (other === entity || other.active === false) continue;
                if (other.layerId && inactiveLayers.has(other.layerId)) continue;

                const isOneWay = Boolean(oneWayTag && colliderSys.isOneWayPlatform(other, oneWayTag));
                if (isOneWay && (isDropping || isMovingUp)) continue;

                const col = other.components.Collider;
                const shape = other.components.ShapeRenderer;
                const hasCollider = col && col.data && col.data.some(c => c.enabled);
                const hasShape = shape && (shape.enablePolygonCollision || shape.enableSegmentCollision || shape.enableCircleCollision);

                if (other.components.Tilemap && other.components.Tilemap.isSolid) {
                    const hitBounds = colliderSys._getTilemapHitBounds(sensor, other);
                    if (hitBounds) {
                        const tbCorners = colliderSys._getObbCorners(hitBounds);
                        const platformTopY = Math.min(...tbCorners.map(c => c.y));
                        if (isOneWay && bottomY > platformTopY + 4) {
                            continue;
                        }
                        const rotRad = hitBounds.rotation || 0;
                        const candAngle = rotRad * (180 / Math.PI);
                        const candNormal = { x: Math.sin(rotRad), y: -Math.cos(rotRad) };

                        const tmLeft = Math.min(...tbCorners.map(c => c.x));
                        const tmRight = Math.max(...tbCorners.map(c => c.x));

                        const distToCenter = (footCenterX >= tmLeft && footCenterX <= tmRight)
                            ? 0
                            : Math.min(Math.abs(footCenterX - tmLeft), Math.abs(footCenterX - tmRight));
                        const overlapWidth = Math.max(0, Math.min(sensorRight, tmRight) - Math.max(sensorLeft, tmLeft));

                        candidates.push({
                            angle: candAngle,
                            normal: candNormal,
                            distToCenter,
                            overlapWidth,
                            isOneWay,
                            entity: other,
                            groundType: 'tilemap'
                        });
                    }
                } else if (hasCollider || hasShape) {
                    const otherBounds = colliderSys.getBounds(other).filter(b => b.type === 'solid');
                    for (let bB of otherBounds) {
                        if (isOneWay) {
                            const bBCorners = colliderSys._getObbCorners(bB);
                            const platformTopY = Math.min(...bBCorners.map(c => c.y));
                            if (bottomY > platformTopY + 4) {
                                continue;
                            }
                        }
                        const intersectRes = colliderSys._obbIntersect(sensor, bB);
                        if (intersectRes) {
                            let candAngle = 0;
                            let candNormal = { x: 0, y: -1 };
                            let bMinX = -Infinity;
                            let bMaxX = Infinity;

                            if (bB.vertices && bB.vertices.length === 2) {
                                let p1 = bB.vertices[0];
                                let p2 = bB.vertices[1];
                                if (p1.x > p2.x) {
                                    const tmp = p1; p1 = p2; p2 = tmp;
                                }
                                const dx = p2.x - p1.x;
                                const dy = p2.y - p1.y;
                                candAngle = Math.atan2(dy, dx) * (180 / Math.PI);
                                const len = Math.hypot(dx, dy) || 1;
                                let nx = -dy / len;
                                let ny = dx / len;
                                if (ny > 0) { nx = -nx; ny = -ny; }
                                candNormal = { x: nx, y: ny };
                                bMinX = p1.x;
                                bMaxX = p2.x;
                            } else if (typeof bB.rotation === 'number' && Math.abs(bB.rotation) > 0.0001) {
                                candAngle = bB.rotation * (180 / Math.PI);
                                candNormal = { x: Math.sin(bB.rotation), y: -Math.cos(bB.rotation) };
                                const bCorners = colliderSys._getObbCorners(bB);
                                bMinX = Math.min(...bCorners.map(c => c.x));
                                bMaxX = Math.max(...bCorners.map(c => c.x));
                            } else if (intersectRes.axis) {
                                let ax = intersectRes.axis.x;
                                let ay = intersectRes.axis.y;
                                if (ay > 0) { ax = -ax; ay = -ay; }
                                candNormal = { x: ax, y: ay };
                                candAngle = Math.atan2(ax, -ay) * (180 / Math.PI);
                                const bCorners = colliderSys._getObbCorners(bB);
                                bMinX = Math.min(...bCorners.map(c => c.x));
                                bMaxX = Math.max(...bCorners.map(c => c.x));
                            }

                            // Only consider upward floor surfaces (candNormal.y < -0.25, up to ~75 deg)
                            if (candNormal.y < -0.25) {
                                const distToCenter = (footCenterX >= bMinX && footCenterX <= bMaxX)
                                    ? 0
                                    : Math.min(Math.abs(footCenterX - bMinX), Math.abs(footCenterX - bMaxX));
                                const overlapWidth = Math.max(0, Math.min(sensorRight, bMaxX) - Math.max(sensorLeft, bMinX));

                                candidates.push({
                                    angle: candAngle,
                                    normal: candNormal,
                                    distToCenter,
                                    overlapWidth,
                                    isOneWay,
                                    entity: other,
                                    groundType: 'entity'
                                });
                            }
                        }
                    }
                }
            }

            if (candidates.length > 0) {
                isGrounded = true;

                // Sort candidates to find dominant ground support:
                // 1. Spanning foot center (distToCenter === 0)
                // 2. Closest distance to foot center
                // 3. Largest overlap width
                // 4. Hysteresis: tie-breaker prefers current ground angle to avoid rapid alternating
                candidates.sort((a, b) => {
                    const spanA = a.distToCenter === 0 ? 1 : 0;
                    const spanB = b.distToCenter === 0 ? 1 : 0;
                    if (spanA !== spanB) return spanB - spanA;

                    if (Math.abs(a.distToCenter - b.distToCenter) > 0.5) {
                        return a.distToCenter - b.distToCenter;
                    }

                    if (Math.abs(a.overlapWidth - b.overlapWidth) > 1) {
                        return b.overlapWidth - a.overlapWidth;
                    }

                    const prevAngle = physComponent.groundAngle || 0;
                    const diffA = Math.abs(a.angle - prevAngle);
                    const diffB = Math.abs(b.angle - prevAngle);
                    return diffA - diffB;
                });

                dominant = candidates[0];
                groundAngle = dominant.angle;
                groundNormal = dominant.normal;

                // Downhill snap assistance (Godot apply_floor_snap pattern):
                const isMovingDownhill = (groundAngle * physComponent.velocityX) > 0;
                if (physComponent._wasGrounded && physComponent.alignToSlope && isMovingDownhill && Math.abs(physComponent.velocityX) > 10) {
                    if (!colliderSys.checkSolid(entity)) {
                        colliderSys.moveAndSlide(entity, 0, reach);
                    }
                }
                break;
            }
        }

        if (!isGrounded) {
            physComponent._lastSlideNormal = null;
            physComponent.groundAngle = 0;
            physComponent.groundNormal = { x: 0, y: -1 };
            physComponent.isGroundedOnOneWay = false;
            physComponent.groundEntity = null;
            physComponent.groundType = null;
        } else {
            physComponent.groundAngle = groundAngle;
            physComponent.groundNormal = groundNormal;
            physComponent.isGroundedOnOneWay = Boolean(dominant && dominant.isOneWay);
            physComponent.groundEntity = dominant ? dominant.entity : null;
            physComponent.groundType = dominant ? dominant.groundType : null;
        }

        physComponent.isGrounded = isGrounded;
    }

    _updateSlopeAlignment(entity, phys, dt) {
        const transform = entity.components.Transform;
        if (!transform) return;

        let targetAngle = 0;
        const maxAngle = typeof phys.maxSlopeAngle === 'number' && phys.maxSlopeAngle > 0 ? phys.maxSlopeAngle : 60;

        if (phys.isGrounded) {
            const angle = Number(phys.groundAngle) || 0;
            if (Math.abs(angle) <= maxAngle) {
                targetAngle = angle;
            }
        }

        // Deadzone: if target angle is near 0, snap to 0
        if (Math.abs(targetAngle) < 0.5) {
            targetAngle = 0;
        }

        const speed = typeof phys.slopeAdaptSpeed === 'number' && phys.slopeAdaptSpeed > 0 
            ? phys.slopeAdaptSpeed 
            : 12;

        const currentRot = transform.rotation || 0;
        
        // Deadzone: if already very close to target, snap directly to avoid micro-jitter
        let diff = (targetAngle - currentRot) % 360;
        if (diff < -180) diff += 360;
        if (diff > 180) diff -= 360;

        if (Math.abs(diff) < 0.2) {
            transform.rotation = targetAngle;
        } else {
            transform.rotation = this._lerpAngle(currentRot, targetAngle, speed * dt);
        }

        if (phys.keepColliderUpright && entity.components.Collider?.data) {
            for (let i = 0; i < entity.components.Collider.data.length; i++) {
                const col = entity.components.Collider.data[i];
                col.lockWorldRotation = true;
            }
        }
    }

    _lerpAngle(current, target, factor) {
        factor = Math.max(0, Math.min(1, factor));
        let diff = (target - current) % 360;
        if (diff < -180) diff += 360;
        if (diff > 180) diff -= 360;
        return current + diff * factor;
    }

    _checkTriggers(entity, physComponent) {
        const overlaps = this.game.colliderSystem._findAllCollisions(entity);
        if (overlaps && overlaps.length > 0) {
            const triggerHit = overlaps.find(e => {
                const c = e.components.Collider;
                return c && c.data && c.data.some(col => col.enabled && col.type === 'trigger');
            });
            if (triggerHit) physComponent.collisionInfo.hitTrigger = triggerHit;
        }
    }
}
__exports.default = PhysicsSystem;
};
// === Module: System/PointerRaycast.js ===
__reg.m["System/PointerRaycast.js"] = function(__require, __exports, __module) {
const __imp_0 = __require("Renderer/Scene/RenderUtils.js"); const RenderUtils = __imp_0.default !== undefined ? __imp_0.default : __imp_0;

class PointerRaycast {
    static _isEntityAndParentsActive(entity, world) {
        if (!entity || entity.active === false || entity.visible === false) return false;
        if (!world) return true;
        let current = entity;
        while (current && current.parentId) {
            const parentId = current.parentId;
            current = world.entities ? world.entities.find(e => e.id === parentId || (e.scriptId && e.scriptId === parentId)) : null;
            if (!current) break;
            if (current.active === false || current.visible === false) return false;
        }
        return true;
    }

    static _isEntityInUILayer(world, entity) {
        if (!world || !entity) return false;
        const uiLayers = world.layersUI || [];
        for (const layer of uiLayers) {
            if (!layer) continue;
            if (entity.layerId && (layer.id === entity.layerId || layer.scriptId === entity.layerId)) {
                return true;
            }
            if (layer.entities && layer.entities.some(e => e === entity || (e && entity && (e.id === entity.id || (e.scriptId && e.scriptId === entity.scriptId))))) {
                return true;
            }
        }
        if (entity.layerId && String(entity.layerId).toLowerCase().includes('ui')) {
            return true;
        }
        return false;
    }

    static _findEntityLayer(world, entity) {
        if (!world || !entity) return null;
        const allLayers = [...(world.layersUI || []), ...(world.layersWorld || [])];
        if (entity.layerId) {
            const found = allLayers.find(l => l.id === entity.layerId || l.scriptId === entity.layerId);
            if (found) return found;
        }
        return allLayers.find(l => l.entities && l.entities.some(e => e === entity || (e && entity && (e.id === entity.id || (e.scriptId && e.scriptId === entity.scriptId))))) || null;
    }

    static _getEntityChildren(world, entity) {
        if (!world || !entity) return [];
        const allEntities = world.entities || [];
        const children = [];
        const targetId = entity.id;
        const targetScriptId = entity.scriptId;
        for (const e of allEntities) {
            if (!e || e === entity) continue;
            if ((targetId && e.parentId === targetId) || (targetScriptId && e.parentId === targetScriptId)) {
                children.push(e);
            }
        }
        if (Array.isArray(entity.children)) {
            for (const child of entity.children) {
                if (child && !children.includes(child)) {
                    children.push(child);
                }
            }
        }
        return children;
    }

    static _checkEntityHit(game, ent, uiPointer, worldPointer) {
        if (!ent || ent.active === false || ent.visible === false) return false;
        const comps = ent.components;
        if (!comps || (!comps.UITransform && !comps.Transform)) return false;
        const isEntityUI = Boolean(comps.UITransform) || this._isEntityInUILayer(game.world, ent);
        const targetPointer = isEntityUI ? uiPointer : worldPointer;
        const absT = this._getGlobalTransform(ent, game.world);
        return this._checkIntersection(ent, absT, absT.x, absT.y, targetPointer.x, targetPointer.y);
    }

    static _checkEntityAndDescendantsHit(game, entity, uiPointer, worldPointer) {
        if (this._checkEntityHit(game, entity, uiPointer, worldPointer)) {
            return true;
        }
        const children = this._getEntityChildren(game.world, entity);
        for (const child of children) {
            if (child.active === false || child.visible === false) continue;
            if (this._checkEntityAndDescendantsHit(game, child, uiPointer, worldPointer)) {
                return true;
            }
        }
        return false;
    }

    static getTopEntityUnderPointer(game) {
        const world = game.world;
        if (!world) return null;
        const camera = game.camera || { x: 0, y: 0, scale: 1 };
        const pointer = game.input?.getPointer ? game.input.getPointer() : null;
        if (!pointer) return null;

        const canvas = game.renderer?.canvas || game.renderer?.gl?.canvas || game.input?.mouse?.canvas || { width: 1920, height: 1080 };
        const canvasW = canvas.width || 1920;
        const canvasH = canvas.height || 1080;

        const uiSettings = world.settings?.ui || { width: 1920, height: 1080 };
        const uiPointer = {
            x: (pointer.x / canvasW) * (uiSettings.width || 1920),
            y: (pointer.y / canvasH) * (uiSettings.height || 1080)
        };

        const halfW = canvasW / 2;
        const halfH = canvasH / 2;
        const worldPointer = {
            x: camera.x + (pointer.x - halfW) / (camera.scale || 1),
            y: camera.y + (pointer.y - halfH) / (camera.scale || 1)
        };

        const sortLayersDescending = (a, b) => {
            const zA = Number(a.zIndex ?? 0);
            const zB = Number(b.zIndex ?? 0);
            if (zA !== zB) return zB - zA;
            
            const oA = Number(a.orderIndex ?? 0);
            const oB = Number(b.orderIndex ?? 0);
            return oB - oA;
        };

        const sortedUILayers = [...(world.layersUI || [])].sort(sortLayersDescending);
        const sortedWorldLayers = [...(world.layersWorld || [])].sort(sortLayersDescending);

        const allLayers = [...sortedUILayers, ...sortedWorldLayers];

        for (const layer of allLayers) {
            if (layer.active === false || layer.visible === false || !layer.entities) continue;
            if (game.layerSystem ? game.layerSystem.isInputFrozen(layer.id, 'pointer') : (layer.freezeInput && (layer.freezeInputType === 'all' || layer.freezeInputType === 'pointer'))) continue;
            
            const isUILayer = (world.layersUI && world.layersUI.includes(layer)) || layer.scriptId === 'ui' || layer.scriptId?.toLowerCase().includes('ui') || layer.id?.toLowerCase().includes('ui');

            const sortedEntities = RenderUtils.getHierarchicalOrder(layer.entities).reverse();

            for (const entity of sortedEntities) {
                if (!this._isEntityAndParentsActive(entity, world)) continue;

                const comps = entity.components;
                if (!comps) continue;

                const hasUITransform = !!comps.UITransform;
                const hasTransform = !!comps.Transform;
                
                if (!hasUITransform && !hasTransform) continue;

                const isEntityUI = isUILayer || hasUITransform;
                const targetPointer = isEntityUI ? uiPointer : worldPointer;

                const absT = RenderUtils.calculateAbsoluteTransform(entity, world);
                const drawX = absT.x;
                const drawY = absT.y;

                const isHit = this._checkIntersection(entity, absT, drawX, drawY, targetPointer.x, targetPointer.y);
                
                if (isHit) {
                    return entity; 
                }
            }
        }

        return null;
    }

    static isPointerOver(game, entity, useRaycast = true) {
        if (!game || !entity) return false;
        if (!this._isEntityAndParentsActive(entity, game.world)) return false;
        if (game.layerSystem?.isEntityInputFrozen(entity, 'pointer')) return false;

        const entityLayer = this._findEntityLayer(game.world, entity);
        if (entityLayer) {
            if (entityLayer.active === false || entityLayer.visible === false) return false;
            if (game.layerSystem ? game.layerSystem.isInputFrozen(entityLayer.id, 'pointer') : (entityLayer.freezeInput && (entityLayer.freezeInputType === 'all' || entityLayer.freezeInputType === 'pointer'))) return false;
        }

        const shouldRaycast = useRaycast === undefined ? true : (typeof useRaycast === 'string' ? (useRaycast.toLowerCase() === 'true' || useRaycast === '1') : Boolean(useRaycast));

        if (shouldRaycast) {
            if (!game.world || typeof this.getTopEntityUnderPointer !== 'function') return false;
            const topEntity = this.getTopEntityUnderPointer(game);
            if (!topEntity) return false;
            if (!this._isEntityAndParentsActive(topEntity, game.world)) return false;

            const matchesEntity = (cand) => {
                if (!cand) return false;
                if (cand.active === false || cand.visible === false) return false;
                if (cand === entity) return true;
                if (entity.id && cand.id === entity.id) return true;
                if (entity.scriptId && cand.scriptId === entity.scriptId) return true;
                return false;
            };

            if (matchesEntity(topEntity)) return true;
            let currentParentId = topEntity.parentId;
            while (currentParentId) {
                const p = game.world?.entities?.find(e => e.id === currentParentId || (e.scriptId && e.scriptId === currentParentId));
                if (p && (!this._isEntityAndParentsActive(p, game.world))) return false;
                if (matchesEntity(p)) return true;
                currentParentId = p ? p.parentId : null;
            }
            return false;
        } else {
            if (!game.input || typeof game.input.getPointer !== 'function') return false;
            const pointer = game.input.getPointer(entity);
            if (!pointer) return false;

            const canvas = game.renderer?.canvas || game.renderer?.gl?.canvas || game.input?.mouse?.canvas || { width: 1920, height: 1080 };
            const canvasW = canvas.width || 1920;
            const canvasH = canvas.height || 1080;
            const uiSettings = game.world?.settings?.ui || { width: 1920, height: 1080 };
            const camera = game.camera || { x: 0, y: 0, scale: 1 };

            const uiPointer = {
                x: (pointer.x / canvasW) * (uiSettings.width || 1920),
                y: (pointer.y / canvasH) * (uiSettings.height || 1080)
            };
            const halfW = canvasW / 2;
            const halfH = canvasH / 2;
            const worldPointer = {
                x: camera.x + (pointer.x - halfW) / (camera.scale || 1),
                y: camera.y + (pointer.y - halfH) / (camera.scale || 1)
            };

            return this._checkEntityAndDescendantsHit(game, entity, uiPointer, worldPointer);
        }
    }

    static _getEntityDepth(entity, world) {
        let depth = 0;
        let current = entity;
        while (current.parentId) {
            depth++;
            current = world.entities.find(e => e.id === current.parentId);
            if (!current) break;
        }
        return depth;
    }

    static _getGlobalTransform(e, world) {
        return RenderUtils.calculateAbsoluteTransform(e, world);
    }

    static _checkIntersection(entity, t, drawX, drawY, pointerX, pointerY) {
        const tRotRad = (t.rotation || 0) * (Math.PI / 180);
        const hasColliderData = entity.components?.Collider?.data && Array.isArray(entity.components.Collider.data);

        if (hasColliderData) {
            const colData = entity.components.Collider.data;
            const cosT = Math.cos(tRotRad);
            const sinT = Math.sin(tRotRad);

            for (let i = 0; i < colData.length; i++) {
                const c = colData[i];
                if (!c.enabled) continue;

                const cW = (c.autoFit ? t.width : c.width) * Math.abs(t.scaleX ?? 1);
                const cH = (c.autoFit ? t.height : c.height) * Math.abs(t.scaleY ?? 1);
                const pX = c.pivotX ?? 0.5;
                const pY = c.pivotY ?? 0.5;

                const localTlX = -t.width * Math.abs(t.scaleX ?? 1) * (t.pivotX ?? 0.5) + (c.offsetX || 0) * Math.abs(t.scaleX ?? 1);
                const localTlY = -t.height * Math.abs(t.scaleY ?? 1) * (t.pivotY ?? 0.5) + (c.offsetY || 0) * Math.abs(t.scaleY ?? 1);

                const localPx = localTlX + cW * pX;
                const localPy = localTlY + cH * pY;

                const worldPx = drawX + localPx * cosT - localPy * sinT;
                const worldPy = drawY + localPx * sinT + localPy * cosT;

                const totalRot = c.autoFit ? tRotRad : tRotRad + ((c.rotation || 0) * (Math.PI / 180));

                const relX = pointerX - worldPx;
                const relY = pointerY - worldPy;
                const rotMouseX = relX * Math.cos(-totalRot) - relY * Math.sin(-totalRot);
                const rotMouseY = relX * Math.sin(-totalRot) + relY * Math.cos(-totalRot);

                const left = -cW * pX;
                const right = cW * (1 - pX);
                const top = -cH * pY;
                const bottom = cH * (1 - pY);

                if (rotMouseX >= left && rotMouseX <= right && rotMouseY >= top && rotMouseY <= bottom) {
                    return true;
                }
            }
            return false;
        } else {
            const boxW = t.width * Math.abs(t.scaleX ?? 1);
            const boxH = t.height * Math.abs(t.scaleY ?? 1);
            const pivotOffsetX = boxW * (t.pivotX ?? 0.5);
            const pivotOffsetY = boxH * (t.pivotY ?? 0.5);
            
            const centerX = drawX - pivotOffsetX + (boxW / 2);
            const centerY = drawY - pivotOffsetY + (boxH / 2);

            const relX = pointerX - centerX;
            const relY = pointerY - centerY;
            
            const rotMouseX = relX * Math.cos(-tRotRad) - relY * Math.sin(-tRotRad);
            const rotMouseY = relX * Math.sin(-tRotRad) + relY * Math.cos(-tRotRad);

            return Math.abs(rotMouseX) <= boxW / 2 && Math.abs(rotMouseY) <= boxH / 2;
        }
    }
}
__exports.default = PointerRaycast;
};
// === Module: System/PrefabSystem.js ===
__reg.m["System/PrefabSystem.js"] = function(__require, __exports, __module) {
const __imp_0 = __require("Loader/SceneLoader.js"); const SceneLoader = __imp_0.default !== undefined ? __imp_0.default : __imp_0;
const __imp_1 = __require("Core/Config.js"); const Config = __imp_1.default !== undefined ? __imp_1.default : __imp_1;
const { GenerateUUID } = __require("Util/GenerateUUID.js");

class PrefabSystem {
    constructor(game) {
        this.game = game;
    }

    initLibrary(prefabs) {
        if (!Array.isArray(prefabs)) return;
        this.game.world.prefabs = Object.fromEntries(prefabs.map(p => [p.id, {
            id: p.id,
            scriptId: p.scriptId,
            data: p.data,
            children: p.children || []
        }]));
    }

    spawnPrefab(prefabIdentifier, posX = 0, posY = 0, layerScriptId = "", zIndex = 0, customScriptId = "") {
        const world = this.game.world;
        if (!world.prefabs) return null;

        let prefabData = null;
        let prefabChildren = [];

        const searchLower = String(prefabIdentifier).toLowerCase();
        for (const key in world.prefabs) {
            const p = world.prefabs[key];
            if (p.id === prefabIdentifier || (p.scriptId && p.scriptId.toLowerCase() === searchLower)) {
                prefabData = p.data;
                prefabChildren = p.children || [];
                break;
            }
        }

        if (!prefabData) return null;

        let targetLayerId = "layer_w_root";
        let targetLayer = null;
        if (world.allLayers) {
            if (layerScriptId) targetLayer = world.allLayers.find(l => l.scriptId === layerScriptId);
            if (!targetLayer) targetLayer = world.allLayers.find(l => l.id === targetLayerId);
            if (targetLayer) targetLayerId = targetLayer.id;
        }

        let baseOrderIndex = 0;
        if (targetLayer && targetLayer.entities) {
            baseOrderIndex = targetLayer.entities.reduce((max, e) => Math.max(max, e.orderIndex || 0), -1);
        }

        const uniqueSuffix = GenerateUUID(16).substring(0, 8);
        const baseRootName = (prefabData && (prefabData.scriptId || prefabData.name)) || (prefabIdentifier || 'entity');
        let finalRootScriptId = `${baseRootName}_${uniqueSuffix}`;

        if (typeof customScriptId === 'string' && customScriptId.trim() !== "") {
            let sanitizedId = customScriptId.toLowerCase().replace(/[^a-z0-9_]/g, '');

            if (sanitizedId !== '') {
                let isIdExist = false;
                if (world.scriptIdMap) {
                    isIdExist = world.scriptIdMap.has(sanitizedId);
                } else {
                    isIdExist = world.entities.some(e => e.scriptId === sanitizedId);
                }

                if (!isIdExist) {
                    finalRootScriptId = sanitizedId;
                } else {
                    console.warn(`[PrefabSystem] Script ID '${sanitizedId}' already exists. Generating random ID.`);
                }
            }
        }

        const idMap = {};
        const allNewData = [];

        const rootData = JSON.parse(JSON.stringify(prefabData));
        const newRootId = 'ent_' + GenerateUUID(16);
        idMap[rootData.id] = newRootId;

        baseOrderIndex++;

        rootData.id = newRootId;
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

                idMap[c.id] = newChildId;
                baseOrderIndex++;

                c.id = newChildId;
                const rawBase = c.scriptId || c.name || c.type || 'child';
                const childBase = (rawBase === 'undefined' || rawBase === 'null' || !rawBase) ? (c.name || c.type || 'child') : rawBase;
                c.scriptId = `${childBase}_${uniqueSuffix}`;
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

        const sceneLoader = new SceneLoader(world, Config.ENGINE_MODE);
        const createdEntities = new Map();
        let rootEntity = null;

        for (const data of allNewData) {
            const entity = sceneLoader._createEntityInstance(data);
            if (!entity) continue;

            if (data.id === newRootId) rootEntity = entity;
            createdEntities.set(entity.id, entity);

            world.addEntity(entity);
            if (world.scriptIdMap && entity.scriptId) world.scriptIdMap.set(entity.scriptId, entity);
            if (targetLayer) targetLayer.entities.push(entity);
        }

        for (const entity of createdEntities.values()) {
            if (!entity.parentId) continue;
            let parent = createdEntities.get(entity.parentId) || world.entities.find(e => e.id === entity.parentId);

            if (parent) {
                if (typeof parent.addChild === 'function') parent.addChild(entity);
                else {
                    if (!parent.children) parent.children = [];
                    if (!parent.children.find(c => c.id === entity.id)) parent.children.push(entity);
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
                this.game.entitySystem.initializeSingleEntityScript(entity);
            }
        }

        return rootEntity;
    }
}
__exports.default = PrefabSystem;
};
// === Module: System/SceneSystem.js ===
__reg.m["System/SceneSystem.js"] = function(__require, __exports, __module) {
const __imp_0 = __require("Loader/SceneLoader.js"); const SceneLoader = __imp_0.default !== undefined ? __imp_0.default : __imp_0;
const __imp_1 = __require("Core/Config.js"); const Config = __imp_1.default !== undefined ? __imp_1.default : __imp_1;

class SceneSystem {
    constructor(game) {
        this.game = game;
        
        this._sceneDataCache = []; 
        this._currentSceneData = null; 
        this._pendingSceneLoad = null;
        this._initialSceneId = null;
        this._persistentLayers = new Map();
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

    getCurrentSceneName() {
        return this.getCurrentSceneScriptId();
    }

    getCurrentSceneId() {
        return this._currentSceneData?.id || this.game.world.currentSceneId || null;
    }

    queueLoadScene(sceneIdentifier) {
        this._pendingSceneLoad = sceneIdentifier;
    }

    loadInitialScene() {
        if (this._persistentLayers) {
            this._persistentLayers.clear();
        }

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

        this._syncPersistentLayersFromWorld();

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

        if (this.game.camera) {
            if (Config.ENGINE_MODE === "runtime") {
                const camSettings = world.settings?.camera;
                const camX = (camSettings?.x !== undefined && camSettings?.x !== null && !isNaN(camSettings.x))
                    ? Number(camSettings.x)
                    : rw / 2;
                const camY = (camSettings?.y !== undefined && camSettings?.y !== null && !isNaN(camSettings.y))
                    ? Number(camSettings.y)
                    : rh / 2;
                this.game.camera.snapTo(camX, camY);

                const camZoom = camSettings?.zoom;
                this.game.camera.scale = (typeof camZoom === 'number' && !isNaN(camZoom) && camZoom > 0)
                    ? Number(camZoom)
                    : 1;

                const camLerp = camSettings?.lerp;
                if (typeof camLerp === 'number' && !isNaN(camLerp)) {
                    const clampedLerp = Math.max(0, Math.min(1, Number(camLerp)));
                    this.game.camera.lerp = clampedLerp;
                    this.game.camera.defaultLerp = clampedLerp;
                }
            } else {
                this.game.camera.snapTo(rw / 2, rh / 2);
                this.game.camera.scale = 0.5;
            }
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

    injectLayer(sourceSceneIdentifier, layerIdentifier = null, inheritState = true, targetLayerIdentifier = "self", targetSceneIdentifier = "self") {
        if (!this._sceneDataCache || this._sceneDataCache.length === 0) {
            console.warn("[SceneSystem] Cannot inject layer: Scene cache is empty.");
            return { success: false, isFirstLoad: false };
        }

        const world = this.game.world;
        if (!world) {
            return { success: false, isFirstLoad: false };
        }

        const searchSceneKey = String(sourceSceneIdentifier || '').trim().toLowerCase();
        let sourceScene = this._sceneDataCache.find(s => 
            (s.scriptId && s.scriptId.trim().toLowerCase() === searchSceneKey) ||
            (s.id === sourceSceneIdentifier)
        );

        const isLayerIdProvided = layerIdentifier !== null && layerIdentifier !== undefined && String(layerIdentifier).trim() !== '' && String(layerIdentifier).trim() !== 'null';
        const searchLayerKey = isLayerIdProvided ? String(layerIdentifier).trim().toLowerCase() : null;

        let sourceLayer = null;
        if (sourceScene) {
            const allSourceLayers = [...(sourceScene.layersUI || []), ...(sourceScene.layersWorld || [])];
            if (searchLayerKey) {
                sourceLayer = allSourceLayers.find(l => 
                    (l.scriptId && l.scriptId.trim().toLowerCase() === searchLayerKey) ||
                    (l.id === layerIdentifier)
                );
            } else {
                if (targetLayerIdentifier && targetLayerIdentifier !== 'self' && targetLayerIdentifier !== '') {
                    const targetKey = String(targetLayerIdentifier).trim().toLowerCase();
                    sourceLayer = allSourceLayers.find(l =>
                        (l.scriptId && l.scriptId.trim().toLowerCase() === targetKey) ||
                        (l.id === targetLayerIdentifier)
                    );
                }
                if (!sourceLayer && allSourceLayers.length > 0) {
                    sourceLayer = allSourceLayers[0];
                }
            }
        }

        let targetLayer = null;
        let entitiesToMount = [];
        let isFirstLoad = false;
        let cached = null;

        if (inheritState && this._persistentLayers) {
            // 1. Try exact composite keys
            if (sourceScene) {
                const sId = sourceScene.id || sourceScene.scriptId;
                const lId = sourceLayer ? (sourceLayer.id || sourceLayer.scriptId) : (searchLayerKey || layerIdentifier || 'default');
                const candidateKeys = [
                    `${sId}_${lId}`,
                    searchLayerKey ? `${sourceScene.scriptId || ''}_${searchLayerKey}`.toLowerCase() : null,
                    searchLayerKey ? `${sourceScene.id || ''}_${searchLayerKey}`.toLowerCase() : null,
                    sourceLayer?.scriptId ? `${sourceScene.scriptId || ''}_${sourceLayer.scriptId}`.toLowerCase() : null,
                    sourceLayer?.id ? `${sourceScene.id || ''}_${sourceLayer.id}`.toLowerCase() : null
                ].filter(Boolean);
                for (const k of candidateKeys) {
                    if (this._persistentLayers.has(k)) {
                        cached = this._persistentLayers.get(k);
                        break;
                    }
                }
            }

            // 2. Try layer-specific key
            const lKey = searchLayerKey || (sourceLayer?.scriptId ? sourceLayer.scriptId.toLowerCase() : null);
            if (!cached && lKey && this._persistentLayers.has(`layer_${lKey}`)) {
                cached = this._persistentLayers.get(`layer_${lKey}`);
            }

            // 3. Fallback: Search all persistent layers for a match by layer scriptId or ID
            if (!cached) {
                for (const p of this._persistentLayers.values()) {
                    if (p && p.layer) {
                        const pScriptId = (p.layer.scriptId || '').toLowerCase();
                        if ((searchLayerKey && pScriptId === searchLayerKey) || (layerIdentifier && p.layer.id === layerIdentifier) || (sourceLayer && (pScriptId === (sourceLayer.scriptId || '').toLowerCase() || p.layer.id === sourceLayer.id))) {
                            cached = p;
                            break;
                        }
                    }
                }
            }
        }

        if (cached && inheritState) {
            targetLayer = cached.layer;
            entitiesToMount = cached.entities || [];
            isFirstLoad = false;
        } else {
            // Need sourceScene & sourceLayer to instantiate fresh from template
            if (!sourceScene) {
                console.warn(`[SceneSystem] Failed to inject layer: Scene '${sourceSceneIdentifier}' not found.`);
                return { success: false, isFirstLoad: false };
            }
            if (!sourceLayer) {
                console.warn(`[SceneSystem] Failed to inject layer: Layer '${layerIdentifier}' not found in scene '${sourceSceneIdentifier}'.`);
                return { success: false, isFirstLoad: false };
            }

            targetLayer = {
                id: sourceLayer.id,
                scriptId: sourceLayer.scriptId,
                visible: sourceLayer.visible !== false,
                locked: Boolean(sourceLayer.locked),
                active: sourceLayer.active !== false,
                opacity: Number(sourceLayer.opacity !== undefined ? sourceLayer.opacity : 1.0),
                zIndex: Number(sourceLayer.zIndex ?? 0),
                orderIndex: Number(sourceLayer.orderIndex ?? 0),
                freezeInput: Boolean(sourceLayer.freezeInput ?? false),
                freezeInputType: sourceLayer.freezeInputType || 'all',
                entities: []
            };

            const entitiesData = (sourceScene.entities || []).filter(e => e.layerId === sourceLayer.id);
            const sceneLoader = new SceneLoader(world, Config.ENGINE_MODE);
            const createdEntities = [];
            const createdMap = new Map();

            for (const eData of entitiesData) {
                const entity = sceneLoader._createEntityInstance(JSON.parse(JSON.stringify(eData)));
                if (entity) {
                    createdEntities.push(entity);
                    createdMap.set(entity.id, entity);
                }
            }

            for (const entity of createdEntities) {
                if (!entity.parentId) continue;
                const parent = createdMap.get(entity.parentId);
                if (parent) {
                    parent.addChild(entity);
                } else {
                    entity.parentId = null;
                }
            }

            entitiesToMount = createdEntities;
            isFirstLoad = true;
        }

        if (sourceScene && Array.isArray(sourceScene.entities)) {
            for (const entity of entitiesToMount) {
                const template = sourceScene.entities.find(e => 
                    e.id === entity.id || (e.scriptId && entity.scriptId && e.scriptId === entity.scriptId)
                );
                if (template && template.components) {
                    if (template.components.UITransform && entity.components?.UITransform) {
                        const ut = entity.components.UITransform;
                        const tUt = template.components.UITransform;
                        if (typeof ut._baseWidth !== 'number' && typeof tUt.width === 'number') ut._baseWidth = tUt.width;
                        if (typeof ut._baseHeight !== 'number' && typeof tUt.height === 'number') ut._baseHeight = tUt.height;
                        if (typeof ut._baseX !== 'number' && typeof tUt.x === 'number') ut._baseX = tUt.x;
                        if (typeof ut._baseY !== 'number' && typeof tUt.y === 'number') ut._baseY = tUt.y;
                    }
                    if (template.components.SpriteRenderer && entity.components?.SpriteRenderer) {
                        const sr = entity.components.SpriteRenderer;
                        const tSr = template.components.SpriteRenderer;
                        if (typeof sr._baseSourceWidth !== 'number' && typeof tSr.sourceWidth === 'number') sr._baseSourceWidth = tSr.sourceWidth;
                        if (typeof sr._baseSourceHeight !== 'number' && typeof tSr.sourceHeight === 'number') sr._baseSourceHeight = tSr.sourceHeight;
                        if (typeof sr._baseSourceX !== 'number' && typeof tSr.sourceX === 'number') sr._baseSourceX = tSr.sourceX;
                        if (typeof sr._baseSourceY !== 'number' && typeof tSr.sourceY === 'number') sr._baseSourceY = tSr.sourceY;
                    }
                    if (template.components.ShapeRenderer && entity.components?.ShapeRenderer) {
                        const sh = entity.components.ShapeRenderer;
                        const tSh = template.components.ShapeRenderer;
                        if (typeof sh._baseWidth !== 'number' && typeof tSh.width === 'number') sh._baseWidth = tSh.width;
                        if (typeof sh._baseHeight !== 'number' && typeof tSh.height === 'number') sh._baseHeight = tSh.height;
                    }
                }
            }
        }

        // Store/update in _persistentLayers
        if (!this._persistentLayers) {
            this._persistentLayers = new Map();
        }
        const persistentRecord = {
            layer: targetLayer,
            entities: entitiesToMount
        };

        if (sourceScene) {
            const sId = sourceScene.id || sourceScene.scriptId;
            const lId = sourceLayer ? (sourceLayer.id || sourceLayer.scriptId) : (targetLayer.id || targetLayer.scriptId);
            this._persistentLayers.set(`${sId}_${lId}`, persistentRecord);
            if (targetLayer.scriptId) {
                this._persistentLayers.set(`${sId}_${targetLayer.scriptId.toLowerCase()}`, persistentRecord);
                if (sourceScene.scriptId) {
                    this._persistentLayers.set(`${sourceScene.scriptId.toLowerCase()}_${targetLayer.scriptId.toLowerCase()}`, persistentRecord);
                }
            }
        }
        if (targetLayer.scriptId) {
            this._persistentLayers.set(`layer_${targetLayer.scriptId.toLowerCase()}`, persistentRecord);
        }

        const isTargetSceneSelf = !targetSceneIdentifier || String(targetSceneIdentifier).trim() === '' || String(targetSceneIdentifier).trim().toLowerCase() === 'self';
        let targetSceneObj = null;
        if (!isTargetSceneSelf) {
            const searchTargetKey = String(targetSceneIdentifier).trim().toLowerCase();
            const currentSceneId = String(this.getCurrentSceneId() || '').toLowerCase();
            const currentSceneScriptId = String(this.getCurrentSceneScriptId() || '').toLowerCase();
            if (searchTargetKey !== currentSceneId && searchTargetKey !== currentSceneScriptId) {
                targetSceneObj = this._sceneDataCache.find(s =>
                    (s.scriptId && s.scriptId.trim().toLowerCase() === searchTargetKey) ||
                    (s.id === targetSceneIdentifier)
                );
            }
        }

        const isTargetLayerSelf = !targetLayerIdentifier || String(targetLayerIdentifier).trim() === '' || String(targetLayerIdentifier).trim().toLowerCase() === 'self';
        const destScriptId = (!isTargetLayerSelf)
            ? String(targetLayerIdentifier).trim()
            : (targetLayer.scriptId || (sourceLayer && sourceLayer.scriptId) || (sourceLayer && sourceLayer.id) || targetLayer.id);

        const destKey = destScriptId.toLowerCase();

        const isUI = (world && Array.isArray(world.layersUI) && world.layersUI.some(l => 
                         (l.scriptId && l.scriptId.toLowerCase() === destKey) || 
                         (l.id && l.id.toLowerCase() === destKey) ||
                         l.id === targetLayerIdentifier
                     )) ||
                     (sourceScene && Array.isArray(sourceScene.layersUI) && sourceScene.layersUI.some(l => 
                         l.id === (sourceLayer ? sourceLayer.id : targetLayer.id) || 
                         (sourceLayer && l.scriptId && sourceLayer.scriptId && l.scriptId.toLowerCase() === sourceLayer.scriptId.toLowerCase())
                     )) ||
                     (entitiesToMount && entitiesToMount.some(e => e.type === 'ui' || e.type === 'ui_entity' || Boolean(e.components && e.components.UITransform))) ||
                     (targetLayer.scriptId && targetLayer.scriptId.toLowerCase().includes('ui')) ||
                     targetLayer.section === 'ui';

        if (targetSceneObj) {
            const destTargetCollection = isUI ? (targetSceneObj.layersUI = targetSceneObj.layersUI || []) : (targetSceneObj.layersWorld = targetSceneObj.layersWorld || []);
            const existingIdx = destTargetCollection.findIndex(l =>
                (l.scriptId && l.scriptId.toLowerCase() === destKey) || 
                (l.id && l.id.toLowerCase() === destKey) ||
                l.id === targetLayer.id
            );
            if (existingIdx === -1) {
                targetLayer.scriptId = destScriptId;
                targetLayer.entities = targetLayer.entities || [];
                destTargetCollection.push(targetLayer);
            } else {
                const existing = destTargetCollection[existingIdx];
                if (!isTargetLayerSelf) {
                    targetLayer.zIndex = (existing.zIndex !== undefined && existing.zIndex !== null) ? existing.zIndex : targetLayer.zIndex;
                    targetLayer.orderIndex = (existing.orderIndex !== undefined && existing.orderIndex !== null) ? existing.orderIndex : targetLayer.orderIndex;
                } else {
                    targetLayer.zIndex = Math.max(Number(existing.zIndex ?? 0), Number(targetLayer.zIndex ?? 0));
                    targetLayer.orderIndex = Math.max(Number(existing.orderIndex ?? 0), Number(targetLayer.orderIndex ?? 0));
                }
                destTargetCollection[existingIdx] = targetLayer;
            }
            if (!targetSceneObj.entities) targetSceneObj.entities = [];
            for (const entity of entitiesToMount) {
                entity.layerId = targetLayer.id;
                if (!targetSceneObj.entities.some(e => e.id === entity.id)) {
                    targetSceneObj.entities.push(entity);
                }
            }
            return { success: true, isFirstLoad };
        }

        const targetCollection = isUI ? world.layersUI : world.layersWorld;

        const existingLayerIndex = targetCollection.findIndex(l => 
            (l.scriptId && l.scriptId.toLowerCase() === destKey) ||
            (l.id && l.id.toLowerCase() === destKey) ||
            l.id === targetLayer.id
        );

        if (existingLayerIndex === -1) {
            targetLayer.scriptId = destScriptId;
            targetLayer.entities = targetLayer.entities || [];
            targetCollection.push(targetLayer);
        } else {
            const existing = targetCollection[existingLayerIndex];
            if (!isTargetLayerSelf) {
                if (existing.zIndex === undefined || existing.zIndex === null) {
                    existing.zIndex = Number(targetLayer.zIndex ?? 0);
                }
                if (existing.orderIndex === undefined || existing.orderIndex === null) {
                    existing.orderIndex = Number(targetLayer.orderIndex ?? 0);
                }
            } else {
                const existingZ = Number(existing.zIndex ?? 0);
                const targetZ = Number(targetLayer.zIndex ?? 0);
                existing.zIndex = Math.max(existingZ, targetZ);
                existing.orderIndex = Math.max(Number(existing.orderIndex ?? 0), Number(targetLayer.orderIndex ?? 0));
                existing.active = targetLayer.active;
                existing.visible = targetLayer.visible;
                existing.locked = targetLayer.locked;
                existing.opacity = targetLayer.opacity;
                existing.freezeInput = targetLayer.freezeInput;
                existing.freezeInputType = targetLayer.freezeInputType;
            }
            targetLayer = existing;
            persistentRecord.layer = targetLayer;
        }

        if (!Array.isArray(targetLayer.entities)) {
            targetLayer.entities = [];
        }

        for (const entity of entitiesToMount) {
            entity.layerId = targetLayer.id;
            
            for (const layer of world.allLayers) {
                if (layer !== targetLayer && Array.isArray(layer.entities)) {
                    const idx = layer.entities.findIndex(e => e.id === entity.id);
                    if (idx !== -1) {
                        layer.entities.splice(idx, 1);
                    }
                }
            }

            const alreadyInWorld = world.entities.some(e => e.id === entity.id);
            if (!alreadyInWorld) {
                world.addEntity(entity);
            }

            if (!targetLayer.entities.some(e => e.id === entity.id)) {
                targetLayer.entities.push(entity);
            }
            if (world.scriptIdMap && entity.scriptId) {
                world.scriptIdMap.set(entity.scriptId, entity);
            }
        }

        targetCollection.sort((a, b) => {
            const zA = Number(a?.zIndex ?? 0);
            const zB = Number(b?.zIndex ?? 0);
            if (zA !== zB) return zA - zB;
            const oA = Number(a?.orderIndex ?? 0);
            const oB = Number(b?.orderIndex ?? 0);
            if (oA !== oB) return oA - oB;
            return String(a?.id || "").localeCompare(String(b?.id || ""));
        });

        if (targetLayer.entities && targetLayer.entities.length > 0) {
            targetLayer.entities.sort((a, b) => {
                const zA = Number(a?.zIndex ?? 0);
                const zB = Number(b?.zIndex ?? 0);
                if (zA !== zB) return zA - zB;
                return Number(a?.orderIndex ?? 0) - Number(b?.orderIndex ?? 0);
            });
        }

        if (Config.ENGINE_MODE === "runtime") {
            this._initializeInjectedScripts(entitiesToMount, true);
        }

        return { success: true, isFirstLoad };
    }

    resetLayer(sourceSceneIdentifier = 'self', layerIdentifier = null) {
        if (!this._sceneDataCache || this._sceneDataCache.length === 0) {
            console.warn("[SceneSystem] Cannot reset layer: Scene cache is empty.");
            return false;
        }

        const world = this.game.world;
        if (!world) {
            return false;
        }

        const isSceneIdentifierEmpty = !sourceSceneIdentifier || String(sourceSceneIdentifier).trim() === '' || String(sourceSceneIdentifier).trim().toLowerCase() === 'self';
        let sourceScene = null;
        if (isSceneIdentifierEmpty) {
            const currentId = this.getCurrentSceneId();
            const currentScriptId = this.getCurrentSceneScriptId();
            sourceScene = this._sceneDataCache.find(s => 
                (s.id && s.id === currentId) || 
                (s.scriptId && currentScriptId && s.scriptId.toLowerCase() === currentScriptId.toLowerCase())
            ) || this._currentSceneData;
        } else {
            const searchSceneKey = String(sourceSceneIdentifier).trim().toLowerCase();
            sourceScene = this._sceneDataCache.find(s => 
                (s.scriptId && s.scriptId.trim().toLowerCase() === searchSceneKey) ||
                (s.id === sourceSceneIdentifier)
            );
        }

        if (!sourceScene) {
            console.warn(`[SceneSystem] Failed to reset layer: Scene '${sourceSceneIdentifier}' not found.`);
            return false;
        }

        const searchLayerKey = layerIdentifier !== null && layerIdentifier !== undefined ? String(layerIdentifier).trim().toLowerCase() : '';
        if (!searchLayerKey) {
            console.warn(`[SceneSystem] Failed to reset layer: Layer identifier is required.`);
            return false;
        }

        const allSourceLayers = [...(sourceScene.layersUI || []), ...(sourceScene.layersWorld || [])];
        const sourceLayer = allSourceLayers.find(l => 
            (l.scriptId && l.scriptId.trim().toLowerCase() === searchLayerKey) ||
            (l.id === layerIdentifier)
        );

        if (!sourceLayer) {
            console.warn(`[SceneSystem] Failed to reset layer: Layer '${layerIdentifier}' not found in scene '${sourceScene.scriptId || sourceScene.id}'.`);
            return false;
        }

        const targetScriptId = sourceLayer.scriptId || sourceLayer.id;
        const targetKey = targetScriptId.toLowerCase();

        const currentSceneId = String(this.getCurrentSceneId() || '').toLowerCase();
        const currentSceneScriptId = String(this.getCurrentSceneScriptId() || '').toLowerCase();
        const searchSceneKey = String(sourceSceneIdentifier || '').trim().toLowerCase();
        const isCurrentScene = !searchSceneKey || searchSceneKey === 'self' || searchSceneKey === currentSceneId || searchSceneKey === currentSceneScriptId;

        const allWorldLayers = world.allLayers || [];
        let activeLayer = allWorldLayers.find(l => 
            (l.scriptId && l.scriptId.toLowerCase() === targetKey) ||
            (l.id && l.id === sourceLayer.id) ||
            (l.id && l.id.toLowerCase() === targetKey)
        );

        if (!isCurrentScene && !activeLayer) {
            if (this._persistentLayers) {
                const sId = sourceScene.id || sourceScene.scriptId;
                const lId = sourceLayer.id || sourceLayer.scriptId;
                const candidateKeys = [
                    `${sId}_${lId}`,
                    sourceLayer.scriptId ? `${sId}_${sourceLayer.scriptId.toLowerCase()}` : null,
                    sourceScene.scriptId && sourceLayer.scriptId ? `${sourceScene.scriptId.toLowerCase()}_${sourceLayer.scriptId.toLowerCase()}` : null,
                    sourceLayer.scriptId ? `layer_${sourceLayer.scriptId.toLowerCase()}` : null,
                    sourceLayer.id ? `layer_${sourceLayer.id.toLowerCase()}` : null
                ].filter(Boolean);

                for (const k of candidateKeys) {
                    this._persistentLayers.delete(k);
                }

                for (const [k, p] of this._persistentLayers.entries()) {
                    if (p && p.layer) {
                        const pScriptId = (p.layer.scriptId || '').toLowerCase();
                        const pId = p.layer.id;
                        if (pId === sourceLayer.id || (sourceLayer.scriptId && pScriptId === sourceLayer.scriptId.toLowerCase())) {
                            this._persistentLayers.delete(k);
                        }
                    }
                }
            }
            return true;
        }

        const targetLayerId = activeLayer ? activeLayer.id : sourceLayer.id;

        if (this.game.entitySystem) {
            const allEntities = [...(world.entities || [])];
            const entitiesToDestroy = allEntities.filter(e => 
                e.layerId === targetLayerId || 
                (activeLayer && e.layerId === activeLayer.id) ||
                (sourceLayer.id && e.layerId === sourceLayer.id)
            );
            if (activeLayer && Array.isArray(activeLayer.entities)) {
                for (const e of activeLayer.entities) {
                    if (!entitiesToDestroy.includes(e)) {
                        entitiesToDestroy.push(e);
                    }
                }
            }
            for (const ent of entitiesToDestroy) {
                if (!ent._isDestroyed) {
                    this.game.entitySystem.destroyEntity(ent);
                }
            }
        }

        const isUI = (world && Array.isArray(world.layersUI) && world.layersUI.some(l => 
                         (l.scriptId && l.scriptId.toLowerCase() === targetKey) || 
                         (l.id && l.id.toLowerCase() === targetKey) ||
                         l.id === sourceLayer.id
                     )) ||
                     (sourceScene && Array.isArray(sourceScene.layersUI) && sourceScene.layersUI.some(l => 
                         l.id === sourceLayer.id || 
                         (l.scriptId && l.scriptId.toLowerCase() === targetKey)
                     )) ||
                     (sourceLayer.scriptId && sourceLayer.scriptId.toLowerCase().includes('ui')) ||
                     sourceLayer.section === 'ui';

        const targetCollection = isUI ? world.layersUI : world.layersWorld;

        let targetLayer = activeLayer;
        if (targetLayer) {
            targetLayer.visible = sourceLayer.visible !== false;
            targetLayer.locked = Boolean(sourceLayer.locked);
            targetLayer.active = sourceLayer.active !== false;
            targetLayer.opacity = Number(sourceLayer.opacity !== undefined ? sourceLayer.opacity : 1.0);
            targetLayer.zIndex = Number(sourceLayer.zIndex !== undefined && sourceLayer.zIndex !== null ? sourceLayer.zIndex : 0);
            targetLayer.orderIndex = Number(sourceLayer.orderIndex !== undefined && sourceLayer.orderIndex !== null ? sourceLayer.orderIndex : 0);
            targetLayer.freezeInput = Boolean(sourceLayer.freezeInput !== undefined && sourceLayer.freezeInput !== null ? sourceLayer.freezeInput : false);
            targetLayer.freezeInputType = sourceLayer.freezeInputType || 'all';
            targetLayer.entities = [];
        } else {
            targetLayer = {
                id: sourceLayer.id,
                scriptId: sourceLayer.scriptId,
                visible: sourceLayer.visible !== false,
                locked: Boolean(sourceLayer.locked),
                active: sourceLayer.active !== false,
                opacity: Number(sourceLayer.opacity !== undefined ? sourceLayer.opacity : 1.0),
                zIndex: Number(sourceLayer.zIndex !== undefined && sourceLayer.zIndex !== null ? sourceLayer.zIndex : 0),
                orderIndex: Number(sourceLayer.orderIndex !== undefined && sourceLayer.orderIndex !== null ? sourceLayer.orderIndex : 0),
                freezeInput: Boolean(sourceLayer.freezeInput !== undefined && sourceLayer.freezeInput !== null ? sourceLayer.freezeInput : false),
                freezeInputType: sourceLayer.freezeInputType || 'all',
                entities: []
            };
            targetCollection.push(targetLayer);
        }

        const entitiesData = (sourceScene.entities || []).filter(e => e.layerId === sourceLayer.id);
        const sceneLoader = new SceneLoader(world, Config.ENGINE_MODE);
        const createdEntities = [];
        const createdMap = new Map();

        for (const eData of entitiesData) {
            const entity = sceneLoader._createEntityInstance(JSON.parse(JSON.stringify(eData)));
            if (entity) {
                createdEntities.push(entity);
                createdMap.set(entity.id, entity);
            }
        }

        for (const entity of createdEntities) {
            if (!entity.parentId) continue;
            const parent = createdMap.get(entity.parentId);
            if (parent) {
                parent.addChild(entity);
            } else {
                entity.parentId = null;
            }
        }

        for (const entity of createdEntities) {
            const template = sourceScene.entities.find(e => 
                e.id === entity.id || (e.scriptId && entity.scriptId && e.scriptId === entity.scriptId)
            );
            if (template && template.components) {
                if (template.components.UITransform && entity.components?.UITransform) {
                    const ut = entity.components.UITransform;
                    const tUt = template.components.UITransform;
                    if (typeof ut._baseWidth !== 'number' && typeof tUt.width === 'number') ut._baseWidth = tUt.width;
                    if (typeof ut._baseHeight !== 'number' && typeof tUt.height === 'number') ut._baseHeight = tUt.height;
                    if (typeof ut._baseX !== 'number' && typeof tUt.x === 'number') ut._baseX = tUt.x;
                    if (typeof ut._baseY !== 'number' && typeof tUt.y === 'number') ut._baseY = tUt.y;
                }
                if (template.components.SpriteRenderer && entity.components?.SpriteRenderer) {
                    const sr = entity.components.SpriteRenderer;
                    const tSr = template.components.SpriteRenderer;
                    if (typeof sr._baseSourceWidth !== 'number' && typeof tSr.sourceWidth === 'number') sr._baseSourceWidth = tSr.sourceWidth;
                    if (typeof sr._baseSourceHeight !== 'number' && typeof tSr.sourceHeight === 'number') sr._baseSourceHeight = tSr.sourceHeight;
                    if (typeof sr._baseSourceX !== 'number' && typeof tSr.sourceX === 'number') sr._baseSourceX = tSr.sourceX;
                    if (typeof sr._baseSourceY !== 'number' && typeof tSr.sourceY === 'number') sr._baseSourceY = tSr.sourceY;
                }
                if (template.components.ShapeRenderer && entity.components?.ShapeRenderer) {
                    const sh = entity.components.ShapeRenderer;
                    const tSh = template.components.ShapeRenderer;
                    if (typeof sh._baseWidth !== 'number' && typeof tSh.width === 'number') sh._baseWidth = tSh.width;
                    if (typeof sh._baseHeight !== 'number' && typeof tSh.height === 'number') sh._baseHeight = tSh.height;
                }
            }
        }

        for (const entity of createdEntities) {
            entity.layerId = targetLayer.id;
            const alreadyInWorld = world.entities.some(e => e.id === entity.id);
            if (!alreadyInWorld) {
                world.addEntity(entity);
            }
            if (!targetLayer.entities.some(e => e.id === entity.id)) {
                targetLayer.entities.push(entity);
            }
            if (world.scriptIdMap && entity.scriptId) {
                world.scriptIdMap.set(entity.scriptId, entity);
            }
        }

        if (this._persistentLayers) {
            const sId = sourceScene.id || sourceScene.scriptId;
            const lId = sourceLayer.id || sourceLayer.scriptId;
            const persistentRecord = {
                layer: targetLayer,
                entities: createdEntities
            };
            this._persistentLayers.set(`${sId}_${lId}`, persistentRecord);
            if (targetLayer.scriptId) {
                this._persistentLayers.set(`${sId}_${targetLayer.scriptId.toLowerCase()}`, persistentRecord);
                if (sourceScene.scriptId) {
                    this._persistentLayers.set(`${sourceScene.scriptId.toLowerCase()}_${targetLayer.scriptId.toLowerCase()}`, persistentRecord);
                }
                this._persistentLayers.set(`layer_${targetLayer.scriptId.toLowerCase()}`, persistentRecord);
            }
        }

        targetCollection.sort((a, b) => {
            const zA = Number(a?.zIndex ?? 0);
            const zB = Number(b?.zIndex ?? 0);
            if (zA !== zB) return zA - zB;
            const oA = Number(a?.orderIndex ?? 0);
            const oB = Number(b?.orderIndex ?? 0);
            if (oA !== oB) return oA - oB;
            return String(a?.id || "").localeCompare(String(b?.id || ""));
        });

        if (targetLayer.entities && targetLayer.entities.length > 0) {
            targetLayer.entities.sort((a, b) => {
                const zA = Number(a?.zIndex ?? 0);
                const zB = Number(b?.zIndex ?? 0);
                if (zA !== zB) return zA - zB;
                return Number(a?.orderIndex ?? 0) - Number(b?.orderIndex ?? 0);
            });
        }

        if (Config.ENGINE_MODE === "runtime") {
            this._initializeInjectedScripts(createdEntities, true);
        }

        return true;
    }

    _syncPersistentLayersFromWorld() {
        if (!this.game?.world) return;
        if (!this._persistentLayers) {
            this._persistentLayers = new Map();
        }

        const allWorldLayers = this.game.world.allLayers || [];
        const allEntities = this.game.world.entities || [];
        const currentSceneId = this.getCurrentSceneId();
        const currentSceneScriptId = this.getCurrentSceneScriptId();

        // 1. Sync live property changes and entities for already-registered persistent layers
        for (const [cacheKey, persistent] of this._persistentLayers.entries()) {
            if (!persistent || !persistent.layer) continue;
            const liveLayer = allWorldLayers.find(l => 
                l.id === persistent.layer.id || 
                (l.scriptId && persistent.layer.scriptId && l.scriptId.toLowerCase() === persistent.layer.scriptId.toLowerCase())
            );

            if (liveLayer) {
                persistent.layer.active = liveLayer.active;
                persistent.layer.visible = liveLayer.visible;
                persistent.layer.locked = liveLayer.locked;
                persistent.layer.opacity = liveLayer.opacity;
                persistent.layer.zIndex = liveLayer.zIndex;
                persistent.layer.orderIndex = liveLayer.orderIndex;
                persistent.layer.freezeInput = liveLayer.freezeInput;
                persistent.layer.freezeInputType = liveLayer.freezeInputType;

                const liveEntities = allEntities.filter(e => e.layerId === liveLayer.id);
                if (liveEntities.length > 0) {
                    persistent.entities = liveEntities;
                }
            }
        }

        // 2. Also capture native layers of the leaving scene that are not yet tracked
        const currentSceneData = this._currentSceneData;
        const currentSceneNativeLayers = [
            ...(currentSceneData?.layersUI || []),
            ...(currentSceneData?.layersWorld || [])
        ];

        for (const liveLayer of allWorldLayers) {
            const layerScriptId = (liveLayer.scriptId || '').toLowerCase();
            const isAlreadyTracked = Array.from(this._persistentLayers.values()).some(p => 
                p && p.layer && (p.layer.id === liveLayer.id || (p.layer.scriptId && p.layer.scriptId.toLowerCase() === layerScriptId))
            );
            if (isAlreadyTracked) continue;

            const isNativeToScene = currentSceneNativeLayers.some(nl => 
                nl.id === liveLayer.id || (nl.scriptId && nl.scriptId.toLowerCase() === layerScriptId)
            );
            if (!isNativeToScene) continue;

            const layerEntities = allEntities.filter(e => e.layerId === liveLayer.id);
            const persistentLayer = {
                id: liveLayer.id,
                scriptId: liveLayer.scriptId,
                section: liveLayer.section,
                visible: liveLayer.visible,
                locked: liveLayer.locked,
                active: liveLayer.active,
                opacity: liveLayer.opacity,
                zIndex: liveLayer.zIndex,
                orderIndex: liveLayer.orderIndex,
                freezeInput: liveLayer.freezeInput,
                freezeInputType: liveLayer.freezeInputType,
                entities: []
            };

            const record = {
                layer: persistentLayer,
                entities: layerEntities
            };

            if (currentSceneId) {
                this._persistentLayers.set(`${currentSceneId}_${liveLayer.id}`, record);
                if (liveLayer.scriptId) {
                    this._persistentLayers.set(`${currentSceneId}_${layerScriptId}`, record);
                }
            }
            if (currentSceneScriptId) {
                this._persistentLayers.set(`${currentSceneScriptId.toLowerCase()}_${liveLayer.id}`, record);
                if (liveLayer.scriptId) {
                    this._persistentLayers.set(`${currentSceneScriptId.toLowerCase()}_${layerScriptId}`, record);
                }
            }
            if (liveLayer.scriptId) {
                this._persistentLayers.set(`layer_${layerScriptId}`, record);
            }
        }
    }

    _initializeInjectedScripts(entities, startImmediately = true) {
        if (!this.game?.scriptSystem || !this.game?.world?.scripts) return;
        const newRunners = [];

        entities.forEach(entity => {
            if (this.game.scriptSystem.runners && this.game.scriptSystem.runners.some(r => r.owner === entity)) {
                return;
            }

            const controller = entity.components?.ScriptController;
            if (!Array.isArray(controller?.data)) return;

            controller.data.forEach(instance => {
                const asset = this.game.world.scripts[instance.assetId];
                if (asset) {
                    const instanceVars = instance.variables || {};
                    const mergedVars = (asset.variables || []).map(v => ({
                        ...v,
                        defaultValue: instanceVars[v.id] !== undefined ? instanceVars[v.id] : v.defaultValue
                    }));

                    const runner = this.game.scriptSystem.add({
                        ...asset,
                        variables: mergedVars
                    }, entity);

                    if (runner) {
                        newRunners.push(runner);
                    }
                }
            });
        });

        if (startImmediately && newRunners.length > 0) {
            newRunners.forEach(r => {
                if (typeof r.start === 'function') {
                    r.start();
                }
            });
        }
    }

    clearPersistentLayers(cacheKey = null) {
        if (!this._persistentLayers) return;
        if (cacheKey) {
            this._persistentLayers.delete(cacheKey);
        } else {
            this._persistentLayers.clear();
        }
    }
}
__exports.default = SceneSystem;
};
// === Module: System/TilemapSystem.js ===
__reg.m["System/TilemapSystem.js"] = function(__require, __exports, __module) {
const __imp_0 = __require("System/TilemapSystem/TilemapSystem.js"); const TilemapSystem = __imp_0.default !== undefined ? __imp_0.default : __imp_0; const { TilemapMath } = __imp_0;


__exports.default = TilemapSystem;

__exports.TilemapSystem = TilemapSystem;
__exports.TilemapMath = TilemapMath;
};
// === Module: System/TilemapSystem/TilemapMath.js ===
__reg.m["System/TilemapSystem/TilemapMath.js"] = function(__require, __exports, __module) {
const __imp_0 = __require("Renderer/Scene/RenderUtils.js"); const RenderUtils = __imp_0.default !== undefined ? __imp_0.default : __imp_0;
const { CanvasToWorld } = __require("Util/MapToCanvasPixels.js");

class TilemapMath {
    static getMouseGridPosition(game, entity, tm) {
        const globalT = RenderUtils.getGlobalTransform(entity, game.world);
        const canvas = game?.renderer?.canvas;
        if (!canvas || !game.camera || !game.input) return null;

        const worldP = CanvasToWorld(game.input.mouse.x, game.input.mouse.y, game.camera, canvas);

        const dx = worldP.x - globalT.x;
        const dy = worldP.y - globalT.y;

        const rad = -(globalT.rotation || 0) * (Math.PI / 180);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const localX = (dx * cos) - (dy * sin);
        const localY = (dx * sin) + (dy * cos);

        const scaleX = (globalT.flipX ? -1 : 1) * (globalT.scaleX ?? 1);
        const scaleY = (globalT.flipY ? -1 : 1) * (globalT.scaleY ?? 1);

        const tileW = (Number(tm.width) || 32) * scaleX;
        const tileH = (Number(tm.height) || 32) * scaleY;

        if (tileW === 0 || tileH === 0) return null;

        const gx = Math.floor(localX / tileW);
        const gy = Math.floor(localY / tileH);

        return { x: gx, y: gy };
    }

    // Invalidates cached bounds to force recalculation on next query
    static invalidateBounds(tm) {
        if (tm) tm._boundsDirty = true;
    }

    // Computes actual bounding box from placed tiles with caching
    static getBounds(tm) {
        if (!tm) {
            return {
                minX: 0, maxX: 0, minY: 0, maxY: 0,
                offsetX: 0, offsetY: 0,
                width: 32,
                height: 32,
                hasTiles: false
            };
        }

        const tileW = Number(tm.width) || 32;
        const tileH = Number(tm.height) || 32;

        // Return cached bounds if data reference hasn't changed and not marked dirty
        if (
            !tm._boundsDirty &&
            tm._bounds &&
            tm._boundsDataRef === tm.data &&
            tm._boundsTileW === tileW &&
            tm._boundsTileH === tileH
        ) {
            return tm._bounds;
        }

        const data = tm.data;
        if (!data) {
            const defaultBounds = {
                minX: 0, maxX: 0, minY: 0, maxY: 0,
                offsetX: 0, offsetY: 0,
                width: tileW,
                height: tileH,
                hasTiles: false
            };
            tm._bounds = defaultBounds;
            tm._boundsDataRef = data;
            tm._boundsTileW = tileW;
            tm._boundsTileH = tileH;
            tm._boundsDirty = false;
            tm._placedTiles = [];
            return defaultBounds;
        }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let hasTiles = false;
        const placedTiles = [];

        for (const key in data) {
            const id = data[key];
            if (!id || id <= 0) continue;

            const commaIdx = key.indexOf(',');
            if (commaIdx === -1) continue;

            const x = parseInt(key.substring(0, commaIdx), 10);
            const y = parseInt(key.substring(commaIdx + 1), 10);
            if (isNaN(x) || isNaN(y)) continue;

            hasTiles = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;

            placedTiles.push({ x, y, tileId: id });
        }

        let bounds;
        if (!hasTiles) {
            bounds = {
                minX: 0, maxX: 0, minY: 0, maxY: 0,
                offsetX: 0, offsetY: 0,
                width: tileW,
                height: tileH,
                hasTiles: false
            };
        } else {
            const cols = maxX - minX + 1;
            const rows = maxY - minY + 1;
            bounds = {
                minX, maxX, minY, maxY,
                offsetX: minX * tileW,
                offsetY: minY * tileH,
                width: cols * tileW,
                height: rows * tileH,
                hasTiles: true
            };
        }

        tm._bounds = bounds;
        tm._boundsDataRef = data;
        tm._boundsTileW = tileW;
        tm._boundsTileH = tileH;
        tm._boundsDirty = false;
        tm._placedTiles = placedTiles;

        return bounds;
    }

    static getPlacedTiles(tm) {
        if (!tm) return [];
        this.getBounds(tm);
        return tm._placedTiles || [];
    }

    static getTilemapQuadVertices(absPos, tm, rotationRad, scaleX, scaleY) {
        const bounds = this.getBounds(tm);
        const tileW = Number(tm?.width) || 32;
        const tileH = Number(tm?.height) || 32;

        const localMinX = bounds.minX * tileW * scaleX;
        const localMinY = bounds.minY * tileH * scaleY;
        const localW = bounds.width * scaleX;
        const localH = bounds.height * scaleY;

        const localCorners = [
            { x: localMinX,          y: localMinY },          
            { x: localMinX + localW, y: localMinY },          
            { x: localMinX + localW, y: localMinY + localH }, 
            { x: localMinX,          y: localMinY + localH }  
        ];

        const cos = Math.cos(rotationRad);
        const sin = Math.sin(rotationRad);

        const worldCorners = localCorners.map(pt => ({
            x: absPos.x + (pt.x * cos - pt.y * sin),
            y: absPos.y + (pt.x * sin + pt.y * cos)
        }));

        return {
            tl: worldCorners[0],
            tr: worldCorners[1],
            br: worldCorners[2],
            bl: worldCorners[3]
        };
    }

    static findEntity(world, activeId) {
        if (!activeId) return null;
        const allLayers = [...(world?.layersWorld || []), ...(world?.layersUI || [])];
        for (const layer of allLayers) {
            if (!layer?.entities) continue;
            for (const e of layer.entities) {
                if (String(e.id) === String(activeId)) return e;
                if (e.children?.length) {
                    const found = this._findInChildren(e, activeId);
                    if (found) return found;
                }
            }
        }
        return null;
    }

    static _findInChildren(entity, id) {
        for (const child of entity.children) {
            if (String(child.id) === String(id)) return child;
            if (child.children?.length) {
                const found = this._findInChildren(child, id);
                if (found) return found;
            }
        }
        return null;
    }
}

__exports.default = TilemapMath;

__exports.TilemapMath = TilemapMath;
};
// === Module: System/TilemapSystem/TilemapSystem.js ===
__reg.m["System/TilemapSystem/TilemapSystem.js"] = function(__require, __exports, __module) {
const { TilemapMath } = __require("System/TilemapSystem/TilemapMath.js");

class TilemapSystem {
    constructor(game) {
        this.game = game;
    }

    getBounds(tm) {
        return TilemapMath.getBounds(tm);
    }

    invalidateBounds(tm) {
        TilemapMath.invalidateBounds(tm);
    }

    getPlacedTiles(tm) {
        return TilemapMath.getPlacedTiles(tm);
    }

    getQuadVertices(absPos, tm, rotationRad, scaleX = 1, scaleY = 1) {
        return TilemapMath.getTilemapQuadVertices(absPos, tm, rotationRad, scaleX, scaleY);
    }

    getMouseGridPosition(entity, tm) {
        return TilemapMath.getMouseGridPosition(this.game, entity, tm);
    }

    getTile(tm, x, y) {
        if (!tm || !tm.data) return 0;
        const key = `${Math.floor(x)},${Math.floor(y)}`;
        return tm.data[key] || 0;
    }

    setTile(tm, x, y, tileId) {
        if (!tm) return;
        if (!tm.data) tm.data = {};
        const key = `${Math.floor(x)},${Math.floor(y)}`;
        const id = Number(tileId) || 0;

        if (id <= 0) {
            delete tm.data[key];
        } else {
            tm.data[key] = id;
        }

        TilemapMath.invalidateBounds(tm);
    }

    hasTile(tm, x, y) {
        return this.getTile(tm, x, y) > 0;
    }

    clear(tm) {
        if (!tm) return;
        tm.data = {};
        TilemapMath.invalidateBounds(tm);
    }
}



__exports.TilemapSystem = TilemapSystem;
__exports.TilemapMath = TilemapMath;
__exports.default = TilemapSystem;
};
// === Module: System/TilemapSystem/index.js ===
__reg.m["System/TilemapSystem/index.js"] = function(__require, __exports, __module) {
const __imp_0 = __require("System/TilemapSystem/TilemapSystem.js"); const TilemapSystem = __imp_0.default !== undefined ? __imp_0.default : __imp_0; const { TilemapMath } = __imp_0;


__exports.default = TilemapSystem;

__exports.TilemapSystem = TilemapSystem;
__exports.TilemapMath = TilemapMath;
};
// === Module: System/TransitionSystem.js ===
__reg.m["System/TransitionSystem.js"] = function(__require, __exports, __module) {
const { HexToVec4 } = __require("Util/HexToVec4.js");

class TransitionSystem {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.alpha = 0.0;     
        this.state = 'none';  
        this.duration = 1.0; 
        this.timer = 0.0;
        this.color = [0, 0, 0, 1]; 
        this.onComplete = null;
    }

    fadeOut(duration = 1.0, colorHex = "#000000", callback = null) {
        this.active = true;
        this.state = 'fade_out'; 
        this.duration = Math.max(0.0001, Number(duration !== undefined ? duration : 1.0)); 
        this.timer = 0.0;
        this.alpha = 0.0;
        this.color = HexToVec4(colorHex);
        this.onComplete = callback;
    }

    fadeIn(duration = 1.0, colorHex = "#000000", callback = null) {
        this.active = true;
        this.state = 'fade_in'; 
        this.duration = Math.max(0.0001, Number(duration !== undefined ? duration : 1.0)); 
        this.timer = 0.0;
        this.alpha = 1.0;
        this.color = HexToVec4(colorHex);
        this.onComplete = callback;
    }

    update(dt) {
        if (this.state === 'none') return;

        let safeDt = Math.min(dt, 0.1); 
        this.timer += safeDt;
        
        let progress = Math.min(this.timer / this.duration, 1.0);
        
        let smoothProgress = progress * progress * (3 - 2 * progress);

        if (this.state === 'fade_out') {
            this.alpha = smoothProgress;
        } else if (this.state === 'fade_in') {
            this.alpha = 1.0 - smoothProgress;
        }

        if (progress >= 1.0) {
            this.state = 'none';
            
            if (this.alpha <= 0) {
                this.active = false; 
            } else {
                this.active = true;
            }

            if (this.onComplete) {
                const cb = this.onComplete;
                this.onComplete = null; 
                cb();
            }
        }
    }
}
__exports.default = TransitionSystem;
};
// === Module: Util/ApplyResizeToEntity.js ===
__reg.m["Util/ApplyResizeToEntity.js"] = function(__require, __exports, __module) {
const __imp_0 = __require("Core/Config.js"); const Config = __imp_0.default !== undefined ? __imp_0.default : __imp_0;
const __imp_1 = __require("Util/FontMath.js"); const FontMath = __imp_1.default !== undefined ? __imp_1.default : __imp_1; 

function ApplyResizeToEntity(ent, world, force = false) {
    const t = ent.components.Transform || ent.components.UITransform;
    if (!t) return;

    if (ent.components.SpriteRenderer) {
        const sr = ent.components.SpriteRenderer;
        if (sr.width !== undefined) sr.width = t.width;
        if (sr.height !== undefined) sr.height = t.height;
    }

    if (ent.components.ShapeRenderer) {
        const sh = ent.components.ShapeRenderer;
        if (["rectangle", "rectStroke", "circle"].includes(sh.type)) {
            sh.width = t.width;
            sh.height = t.height;
        }
    }

    if (ent.components.TextRenderer) {
        const tr = ent.components.TextRenderer;
        let fontId = tr.assetId || tr.fontId || tr.font || Config.FONT;
        let font = null;
        if (fontId) {
            font = world?.assets?.fonts?.[fontId];
            if (!font && world?.assetMap?.[fontId]) {
                const assetObj = world.assetMap[fontId];
                font = world?.assets?.fonts?.[assetObj.id] || world?.assets?.fonts?.[assetObj.scriptId];
            }
        }
        if (!font?.ready) font = world?.assets?.fonts?.["system_default"];

        if (font) {
            const textValue = tr.value ?? "Text";
            const fontSize = Number(tr.fontSize) || 24;
            const lineSpacing = Number(tr.lineSpacing) || 1.2;
            const letterSpacing = Number(tr.letterSpacing) || 0;
            const maxLine = Math.max(1, Number(tr.maxLine ?? 1));
            const autoLine = tr.autoLine !== false;
            const overflow = tr.overflow || "wrap";

            if (t.width === undefined || t.width <= 0) {
                t.width = 100;
            }
            const currentWidth = t.width;

            const isChanged = force || 
                tr._lastValue !== textValue || 
                tr._lastFontSize !== fontSize ||
                tr._lastLineSpacing !== lineSpacing ||
                tr._lastLetterSpacing !== letterSpacing ||
                tr._lastMaxLine !== maxLine || 
                tr._lastAutoLine !== autoLine ||
                tr._lastOverflow !== overflow ||
                tr._lastWidth !== currentWidth ||
                t.height <= 0;

            if (isChanged) {
                const m = FontMath.measureText(font, textValue, fontSize, { 
                    width: currentWidth, lineSpacing, letterSpacing, maxLine, autoLine, overflow 
                });

                t.height = m.boundsHeight > 0 ? Math.ceil(m.boundsHeight) : Math.ceil(fontSize);
                
                tr._lastValue = textValue;
                tr._lastFontSize = fontSize;
                tr._lastLineSpacing = lineSpacing;
                tr._lastLetterSpacing = letterSpacing;
                tr._lastMaxLine = maxLine; 
                tr._lastAutoLine = autoLine;
                tr._lastOverflow = overflow;
                tr._lastWidth = currentWidth;
            }
        }
    }

    if (ent.components.Transform) {
        ent.hitX = t.x;
        ent.hitY = t.y;
        ent.hitWidth = t.width;
        ent.hitHeight = t.height;
    }
}
__exports.ApplyResizeToEntity = ApplyResizeToEntity;
};
// === Module: Util/calculateQuadVertices.js ===
__reg.m["Util/calculateQuadVertices.js"] = function(__require, __exports, __module) {
function calculateQuadVertices(x, y, w, h, rot, sx, sy, px, py) {
    const finalW = w * sx;
    const finalH = h * sy;

    const offsetX = -px * finalW;
    const offsetY = -py * finalH;

    const c = Math.cos(rot);
    const s = Math.sin(rot);

    const transform = (lx, ly) => {
        const ox = lx + offsetX;
        const oy = ly + offsetY;

        return {
            x: x + (ox * c - oy * s),
            y: y + (ox * s + oy * c)
        };
    };

    return {
        tl: transform(0, 0),          
        tr: transform(finalW, 0),    
        bl: transform(0, finalH),  
        br: transform(finalW, finalH) 
    };
}
__exports.calculateQuadVertices = calculateQuadVertices;
};
// === Module: Util/Camera.js ===
__reg.m["Util/Camera.js"] = function(__require, __exports, __module) {
const __imp_0 = __require("Core/Config.js"); const Config = __imp_0.default !== undefined ? __imp_0.default : __imp_0;

class Camera {
    constructor(x = 0, y = 0) {
        this.x = isNaN(x) ? 0 : x;
        this.y = isNaN(y) ? 0 : y;
        this.scale = 1;
        this.target = null;
        this.offset = { x: 0, y: 0 }; 
        this.lerp = 0.1;
        this.defaultLerp = 0.1;
        this.isFirstFrameTracking = false; 
    }

    snapTo(x, y) {
        this.x = x;
        this.y = y;
    }

    setTarget(entity, speed, offset = { x: 0, y: 0 }) {
        this.target = entity;
        if (typeof speed === 'number' && !isNaN(speed)) {
            this.lerp = speed;
        } else if (typeof this.defaultLerp === 'number') {
            this.lerp = this.defaultLerp;
        }
        this.offset = {
            x: (offset && typeof offset.x === 'number') ? offset.x : 0,
            y: (offset && typeof offset.y === 'number') ? offset.y : 0
        };
        this.isFirstFrameTracking = true; 
    }

    clearTarget() {
        this.target = null;
        if (typeof this.defaultLerp === 'number') {
            this.lerp = this.defaultLerp;
        }
        this.isFirstFrameTracking = false;
    }

    update(dt, world, canvas) {
        if (this.target && !this.target._isDestroyed) {
            let tX = 0, tY = 0;
            if (this.target.components && this.target.components.Transform) {
                const transform = this.target.components.Transform;
                tX = Number(transform.x) || 0;
                tY = Number(transform.y) || 0;
            } else if (typeof this.target.x === 'number' && typeof this.target.y === 'number') {
                tX = this.target.x;
                tY = this.target.y;
            }

            const desiredX = tX + this.offset.x;
            const desiredY = tY + this.offset.y;

            if (this.isFirstFrameTracking) {
                this.x = desiredX;
                this.y = desiredY;
                this.isFirstFrameTracking = false;
            } else {
                const safeDt = dt || 0.016; 
                const clampedLerp = Math.max(0, Math.min(1, (typeof this.lerp === 'number' && !isNaN(this.lerp)) ? this.lerp : 0.1));
                const k = 1 - Math.pow(1 - clampedLerp, safeDt * 60.0); 

                let nx = this.x + (desiredX - this.x) * k;
                let ny = this.y + (desiredY - this.y) * k;

                this.x = isNaN(nx) ? this.x : nx;
                this.y = isNaN(ny) ? this.y : ny;
            }
        }

        if (isNaN(this.x)) this.x = 0;
        if (isNaN(this.y)) this.y = 0;

        if (world && canvas && world.settings?.worldBounds?.active) {
            this._applyClamp(world.settings.worldBounds, canvas);
        }
    }

    _applyClamp(bounds, canvas) {
        const viewW = canvas.width / this.scale;
        const viewH = canvas.height / this.scale;
        const halfW = viewW / 2;
        const halfH = viewH / 2;

        const boundsW = bounds.x2 - bounds.x1;
        const boundsH = bounds.y2 - bounds.y1;

        if (boundsW < viewW) {
            this.x = bounds.x1 + boundsW / 2;
        } else {
            const minX = bounds.x1 + halfW;
            const maxX = bounds.x2 - halfW;
            this.x = Math.max(minX, Math.min(this.x, maxX));
        }

        if (boundsH < viewH) {
            this.y = bounds.y1 + boundsH / 2;
        } else {
            const minY = bounds.y1 + halfH;
            const maxY = bounds.y2 - halfH;
            this.y = Math.max(minY, Math.min(this.y, maxY));
        }
    }
}
__exports.default = Camera;
};
// === Module: Util/ConsoleBroadcaster.js ===
__reg.m["Util/ConsoleBroadcaster.js"] = function(__require, __exports, __module) {
const { bus } = __require("Util/EventBus.js");

const BROADCAST_CHANNEL_NAME = "lupis_engine_preview_channel";

class ConsoleBroadcaster {
  constructor(channelName = BROADCAST_CHANNEL_NAME) {
    this.channelName = channelName || BROADCAST_CHANNEL_NAME;
    this.channel = new BroadcastChannel(this.channelName);
    this.isDestroyed = false;
    this.initListeners();
  }

  initListeners() {
    this._forwardLog = (entry) => {
      if (this.isDestroyed || !this.channel) return;
      try {
        this.channel.postMessage({
          type: "ENGINE_CONSOLE_LOG",
          payload: entry
        });
      } catch (err) {
        // Channel may be closed or in invalid state; ignore gracefully
      }
    };

    this._forwardClear = () => {
      if (this.isDestroyed || !this.channel) return;
      try {
        this.channel.postMessage({ type: "ENGINE_CONSOLE_CLEAR" });
      } catch (err) {
        // Channel may be closed; ignore gracefully
      }
    };

    bus.on('console:log', this._forwardLog);
    bus.on('console:warn', this._forwardLog);
    bus.on('console:error', this._forwardLog);
    bus.on('console:clear', this._forwardClear);

    this.channel.onmessage = (event) => {
      if (event.data.type === "CONSOLE_CLEAR_REQUEST") {
      }
    };
  }

  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    if (this._forwardLog) {
      bus.off('console:log', this._forwardLog);
      bus.off('console:warn', this._forwardLog);
      bus.off('console:error', this._forwardLog);
      this._forwardLog = null;
    }

    if (this._forwardClear) {
      bus.off('console:clear', this._forwardClear);
      this._forwardClear = null;
    }

    try {
      this.channel?.close();
    } catch (err) {}
    this.channel = null;
  }
}
__exports.default = ConsoleBroadcaster;
};
// === Module: Util/EngineConsole.js ===
__reg.m["Util/EngineConsole.js"] = function(__require, __exports, __module) {
const { bus } = __require("Util/EventBus.js");
const { formatScriptPrefix } = __require("Util/ScriptContextUtils.js");

class EngineConsole {
  constructor() {
    this.logs = [];
  }

  log(message, context = null) {
    this.#add("log", message, context);
  }

  warn(message, context = null) {
    this.#add("warn", message, context);
  }

  error(message, context = null) {
    this.#add("error", message, context);
  }

  clear() {
    this.logs = [];
    bus.emit("console:clear");
  }

  #add(type, message, context = null) {
    const source = this.#getCallerFile();
    let finalMessage = typeof message === 'object' && message !== null ? JSON.stringify(message) : String(message ?? '');

    let ctx = null;
    if (context && typeof context === 'object') {
      const scene = context.scene || 'Scene';
      const entity = context.entityScriptId || context.entity || 'Entity';
      const script = context.script || 'Script';
      const node = context.node || 'Node';
      ctx = { scene, entityScriptId: entity, script, node };

      const prefix = formatScriptPrefix(entity, script);
      if (!finalMessage.startsWith(prefix)) {
        finalMessage = `${prefix} ${finalMessage}`;
      }
    }

    const lastIndex = this.logs.length - 1;
    if (lastIndex >= 0) {
      const last = this.logs[lastIndex];
      if (last.type === type && last.message === finalMessage) {
        last.count = (last.count || 1) + 1;
        last.time = Date.now();
        bus.emit(`console:${type}`, { ...last, isRepeat: true });
        return;
      }
    }

    const entry = { type, message: finalMessage, source, ...(ctx ? { context: ctx } : {}), time: Date.now(), count: 1 };
    this.logs.push(entry);
    bus.emit(`console:${type}`, entry);
  }

  #getCallerFile() {
    try {
      const err = new Error();
      const stack = err.stack?.split("\n") || [];

      const caller = stack.find(
        line =>
          line.includes(".js") &&
          !line.includes("EngineConsole.js") &&
          !line.includes("EventBus.js")
      );

      if (!caller) return "(unknown)";

      const regex =
        /([A-Za-z0-9_\-/]+\.js)(?::(\d+))?(?::(\d+))?/;
      const match = caller.match(regex);

      if (match) {
        const file = match[1].split("/").pop();
        const line = match[2] ? `:${match[2]}` : "";
        return `${file}${line}`;
      }

      return "(unknown)";
    } catch (err) {
      return "(unknown)";
    }
  }
}

const econsole = new EngineConsole();
__exports.default = EngineConsole;

__exports.econsole = econsole;
};
// === Module: Util/EventBus.js ===
__reg.m["Util/EventBus.js"] = function(__require, __exports, __module) {
class EventBus {
  constructor() {
    this.events = new Map();
  }

  on(event, handler) {
    if (!this.events.has(event)) this.events.set(event, []);
    this.events.get(event).push(handler);
  }

  off(event, handler) {
    if (!this.events.has(event)) return;
    const list = this.events.get(event);
    const idx = list.indexOf(handler);
    if (idx >= 0) list.splice(idx, 1);
  }

  emit(event, ...args) {
    if (!this.events.has(event)) return;
    for (const handler of this.events.get(event)) {
      try {
        handler(...args);
      } catch (err) {
        console.warn(`[EventBus] Error in "${event}" handler:`, err);
      }
    }
  }

  once(event, handler) {
    const wrapper = (...args) => {
      handler(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}

const bus = new EventBus();

// Expose to window for E2E Testing & Dev
if (typeof window !== "undefined") {
  const isDevOrTest = 
    (globalThis.__LUPIS_ENV__ || {})?.DEV || 
    (globalThis.__LUPIS_ENV__ || {})?.MODE === 'test' || 
    window.__E2E__ || 
    window.playwright;

  if (isDevOrTest) {
    window.bus = bus;
    window.$bus = bus;
  }
}

__exports.default = EventBus;
__exports.bus = bus;
};
// === Module: Util/FontMath.js ===
__reg.m["Util/FontMath.js"] = function(__require, __exports, __module) {
const _measureCaches = new WeakMap();

class FontMath {
    static clearCache(font) {
        if (font && typeof font === "object") {
            _measureCaches.delete(font);
        }
    }

    static measureText(font, str, size, options = {}) {
        if (!font || !font.chars || !font.info || str === undefined || str === null || str === "") {
            const fallbackW = Number(options.width) > 0 ? Number(options.width) : (Number(options.maxWidth) > 0 ? Number(options.maxWidth) : 0);
            return { 
                width: fallbackW, height: 0, boundsWidth: fallbackW, boundsHeight: 0, 
                xMin: 0, yMin: 0, xMax: 0, yMax: 0, 
                lines: [], lineWidths: [], wordCounts: [], lineH: 0 
            };
        }

        const limitWidth = (Number(options.width) > 0) 
            ? Number(options.width) 
            : ((Number(options.maxWidth) > 0) ? Number(options.maxWidth) : Infinity);

        const autoLine = options.autoLine !== false;
        const maxLine = Math.max(1, Number(options.maxLine ?? 1));
        const effectiveMaxLine = autoLine ? Infinity : maxLine;
        const isEllipsis = options.overflow === "ellipsis";
        const lineSpacing = Number(options.lineSpacing || 1.2);
        const letterSpacing = Number(options.letterSpacing || 0);
        const overflow = options.overflow || "";

        let fontCache = null;
        let cacheKey = null;

        if (typeof font === "object" && font !== null && !options.noCache) {
            fontCache = _measureCaches.get(font);
            if (!fontCache) {
                fontCache = new Map();
                _measureCaches.set(font, fontCache);
            }
            cacheKey = `${str}|${size}|${limitWidth}|${autoLine ? 1 : 0}|${effectiveMaxLine}|${lineSpacing}|${letterSpacing}|${overflow}`;
            const cached = fontCache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }

        const scale = size / font.info.size;
        const lineH = (font.common?.lineHeight || 10) * scale * lineSpacing;
        const lSpacing = letterSpacing * scale;

        const getCharAdvance = (ch) => {
            const g = font.chars[ch.charCodeAt(0)];
            return g ? (g.adv * scale) + lSpacing : 0;
        };

        const getWordWidth = (word) => {
            let w = 0;
            for (let i = 0; i < word.length; i++) {
                w += getCharAdvance(word[i]);
            }
            return w;
        };

        const spaceW = getCharAdvance(' ');

        let lines = [];
        const rawLines = String(str).split(/\r\n|\r|\n/);
        let isTruncated = false;

        for (let p = 0; p < rawLines.length; p++) {
            if (lines.length >= effectiveMaxLine) {
                isTruncated = true;
                break;
            }

            const rLine = rawLines[p];
            if (limitWidth === Infinity) {
                lines.push(rLine);
                continue;
            }

            const words = rLine.split(' ');
            let currentLine = "";
            let currentLineW = 0;

            for (let i = 0; i < words.length; i++) {
                const word = words[i];

                if (word.length === 0) {
                    if (currentLine.length > 0) {
                        if (currentLineW + spaceW <= limitWidth) {
                            currentLine += " ";
                            currentLineW += spaceW;
                        } else {
                            if (lines.length + 1 < effectiveMaxLine) {
                                lines.push(currentLine);
                                currentLine = "";
                                currentLineW = 0;
                            } else {
                                isTruncated = true;
                                break;
                            }
                        }
                    }
                    continue;
                }

                const wordW = getWordWidth(word);
                const spaceNeeded = (currentLine.length > 0) ? spaceW : 0;

                if (currentLineW + spaceNeeded + wordW <= limitWidth) {
                    currentLine += (currentLine.length > 0 ? " " : "") + word;
                    currentLineW += spaceNeeded + wordW;
                    continue;
                }

                if (lines.length + 1 < effectiveMaxLine) {
                    if (currentLine.length > 0) {
                        lines.push(currentLine);
                        currentLine = "";
                        currentLineW = 0;
                    }

                    if (wordW <= limitWidth) {
                        currentLine = word;
                        currentLineW = wordW;
                    } else {
                        for (let c = 0; c < word.length; c++) {
                            const chW = getCharAdvance(word[c]);
                            if (currentLineW + chW <= limitWidth) {
                                currentLine += word[c];
                                currentLineW += chW;
                            } else {
                                if (lines.length + 1 < effectiveMaxLine) {
                                    lines.push(currentLine);
                                    currentLine = word[c];
                                    currentLineW = chW;
                                } else {
                                    isTruncated = true;
                                    break;
                                }
                            }
                        }
                    }
                } else {
                    isTruncated = true;
                    break;
                }
            }

            if (currentLine.length > 0) {
                lines.push(currentLine);
            } else if (words.length === 0 || rLine === "") {
                lines.push("");
            }
        }

        if (rawLines.length > lines.length) {
            isTruncated = true;
        }

        if (rawLines.length > 0 && lines.length === 0) {
            lines.push("");
        }

        if (lines.length > effectiveMaxLine) {
            lines = lines.slice(0, effectiveMaxLine);
            isTruncated = true;
        }

        if (isEllipsis && lines.length > 0 && isTruncated) {
            const ellipsisStr = "...";
            const ellipsisW = getWordWidth(ellipsisStr);
            let lastLine = lines[lines.length - 1];

            if (limitWidth !== Infinity) {
                while (lastLine.length > 0 && (getWordWidth(lastLine) + ellipsisW > limitWidth)) {
                    lastLine = lastLine.slice(0, -1);
                }
                lines[lines.length - 1] = lastLine.trimEnd() + ellipsisStr;
            } else {
                lines[lines.length - 1] = lastLine.trimEnd() + ellipsisStr;
            }
        } else {
            for (let i = 0; i < lines.length; i++) {
                lines[i] = lines[i].trimEnd();
            }
        }

        let cx = 0, cy = 0;
        let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity;
        const lineWidths = [];
        const wordCounts = [];

        for (const line of lines) {
            let lineW = 0;
            let spaces = 0;

            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (ch === ' ') spaces++;

                const gdat = font.chars[ch.charCodeAt(0)];
                if (!gdat) continue;

                const x0 = lineW + gdat.ox * scale;
                const x1 = x0 + gdat.w * scale;

                if (x0 < xMin) xMin = x0;
                if (x1 > xMax) xMax = x1;

                const y0 = cy + gdat.oy * scale;
                const y1 = y0 + gdat.h * scale;
                if (y0 < yMin) yMin = y0;
                if (y1 > yMax) yMax = y1;

                lineW += (gdat.adv * scale) + lSpacing;
            }

            if (line.length > 0) lineW -= lSpacing;

            lineWidths.push(lineW);
            wordCounts.push(spaces);
            if (lineW > cx) cx = lineW;
            cy += lineH;
        }

        if (font.common && font.common.stdYMin !== undefined) {
            yMin = font.common.stdYMin * scale;
            const scaledStdYMax = font.common.stdYMax * scale;
            const totalLines = lines.length > 0 ? lines.length : 1;
            yMax = scaledStdYMax + ((totalLines - 1) * lineH);
        } else if (xMin === Infinity) {
            xMin = 0; xMax = cx; yMin = 0; yMax = lineH * (lines.length > 0 ? lines.length : 1);
        }

        const calculatedHeight = Math.max(0, yMax - yMin);
        const finalWidth = (limitWidth !== Infinity) ? limitWidth : Math.max(0, xMax - xMin);

        const result = {
            lines,
            lineWidths,
            wordCounts,
            width: finalWidth,
            boundsWidth: finalWidth,
            boundsHeight: calculatedHeight,
            xMin, yMin, xMax, yMax,
            baseline: (font.common?.base || 0) * scale,
            lineH
        };

        if (fontCache && cacheKey) {
            if (fontCache.size >= 1000) {
                const iter = fontCache.keys();
                for (let k = 0; k < 200; k++) {
                    const n = iter.next();
                    if (n.done) break;
                    fontCache.delete(n.value);
                }
            }
            fontCache.set(cacheKey, result);
        }

        return result;
    }
}
__exports.default = FontMath;
};
// === Module: Util/GenerateUUID.js ===
__reg.m["Util/GenerateUUID.js"] = function(__require, __exports, __module) {
function GenerateUUID(length = 16) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
}

__exports.GenerateUUID = GenerateUUID;
};
// === Module: Util/HexToVec4.js ===
__reg.m["Util/HexToVec4.js"] = function(__require, __exports, __module) {
const _colorCache = new Map();

function HexToVec4(hex) {
    if (!hex) return [1, 1, 1, 1];
    if (_colorCache.has(hex)) return _colorCache.get(hex);

    let c = hex.replace("#", "");
    let r = 0, g = 0, b = 0, a = 1;

    if (c.length === 3) {
        r = parseInt(c[0] + c[0], 16) / 255;
        g = parseInt(c[1] + c[1], 16) / 255;
        b = parseInt(c[2] + c[2], 16) / 255;
    } else if (c.length === 6) {
        r = parseInt(c.substring(0, 2), 16) / 255;
        g = parseInt(c.substring(2, 4), 16) / 255;
        b = parseInt(c.substring(4, 6), 16) / 255;
    } else if (c.length === 8) {
        r = parseInt(c.substring(0, 2), 16) / 255;
        g = parseInt(c.substring(2, 4), 16) / 255;
        b = parseInt(c.substring(4, 6), 16) / 255;
        a = parseInt(c.substring(6, 8), 16) / 255;
    }

    const vec = [r, g, b, a];
    if (_colorCache.size > 500) _colorCache.clear();
    _colorCache.set(hex, vec);
    
    return vec;
}
__exports.HexToVec4 = HexToVec4;
};
// === Module: Util/identifier.js ===
__reg.m["Util/identifier.js"] = function(__require, __exports, __module) {
const SCRIPT_ID_REGEX = /^[a-zA-Z0-9_]+$/;

function isValidScriptId(val) {
  return typeof val === 'string' && val.length > 0 && SCRIPT_ID_REGEX.test(val);
}

// Sanitizes a string into alphanumeric and underscore characters
function sanitizeScriptId(raw, fallbackVal = 'item') {
  if (typeof raw !== 'string') return fallbackVal;
  const sanitized = raw.trim().replace(/[\s-]+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  return sanitized.length > 0 ? sanitized : fallbackVal;
}

// Generates a unique script identifier by appending an incremental numeric suffix if needed
function getValidUniqueScriptId(desired, existing = [], keyExtractor = 'scriptId', excludeId = null) {
  const clean = sanitizeScriptId(desired);
  
  const existingSet = new Set();
  if (Array.isArray(existing)) {
    for (const item of existing) {
      if (!item) continue;
      if (excludeId && typeof item === 'object' && item.id === excludeId) continue;
      
      let val = '';
      if (typeof item === 'string') {
        val = item;
      } else if (typeof keyExtractor === 'function') {
        val = keyExtractor(item);
      } else if (typeof keyExtractor === 'string') {
        val = item[keyExtractor] ?? item.name ?? item.id ?? '';
      }
      if (val) {
        existingSet.add(String(val).toLowerCase());
      }
    }
  }

  if (!existingSet.has(clean.toLowerCase())) {
    return clean;
  }

  const match = clean.match(/^(.*?)(?:_(\d+))?$/);
  const baseName = (match && match[1]) ? match[1] : clean;

  let counter = 1;
  let candidate = `${baseName}_${counter}`;
  while (existingSet.has(candidate.toLowerCase())) {
    counter++;
    candidate = `${baseName}_${counter}`;
  }
  return candidate;
}

__exports.isValidScriptId = isValidScriptId;
__exports.sanitizeScriptId = sanitizeScriptId;
__exports.getValidUniqueScriptId = getValidUniqueScriptId;
__exports.SCRIPT_ID_REGEX = SCRIPT_ID_REGEX;
};
// === Module: Util/MapToCanvasPixels.js ===
__reg.m["Util/MapToCanvasPixels.js"] = function(__require, __exports, __module) {
function MapToCanvasPixels(e, canvas) {
    const rect = canvas.getBoundingClientRect();

    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;

    const px = (cx - rect.left) * scaleX;
    const py = (cy - rect.top)  * scaleY;

    return {
        px: Math.max(0, Math.min(canvas.width,  px)),
        py: Math.max(0, Math.min(canvas.height, py))
    };
}

function CanvasToWorld(px, py, camera, canvas) {
    const scale = camera.scale || 1;
    return {
        x: (px - canvas.width * 0.5) / scale + camera.x,
        y: (py - canvas.height * 0.5) / scale + camera.y
    };
}
__exports.MapToCanvasPixels = MapToCanvasPixels;
__exports.CanvasToWorld = CanvasToWorld;
};
// === Module: Util/Mat4.js ===
__reg.m["Util/Mat4.js"] = function(__require, __exports, __module) {
class Mat4 {
  static identity(out = new Float32Array(16)) {
    out.set([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
    return out;
  }

  static copy(out, a) {
    out.set(a);
    return out;
  }

  static translate(out, a, tx, ty, tz = 0) {
    const x = tx, y = ty, z = tz;
    if (a === out) {
      out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
      out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
      out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
      out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
      return out;
    }
    for (let i = 0; i < 12; i++) out[i] = a[i];
    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    return out;
  }

  static scale(out, a, sx, sy, sz = 1) {
    out[0] = a[0] * sx; out[1] = a[1] * sx; out[2] = a[2] * sx; out[3] = a[3] * sx;
    out[4] = a[4] * sy; out[5] = a[5] * sy; out[6] = a[6] * sy; out[7] = a[7] * sy;
    out[8] = a[8] * sz; out[9] = a[9] * sz; out[10] = a[10] * sz; out[11] = a[11] * sz;
    out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
    return out;
  }

  static rotateZ(out, a, rad) {
    const s = Math.sin(rad);
    const c = Math.cos(rad);

    const a0 = a[0], a4 = a[4];
    const a1 = a[1], a5 = a[5];
    const a2 = a[2], a6 = a[6];
    const a3 = a[3], a7 = a[7];

    out[0] = a0 * c + a4 * s;
    out[4] = a0 * -s + a4 * c;
    out[1] = a1 * c + a5 * s;
    out[5] = a1 * -s + a5 * c;
    out[2] = a2 * c + a6 * s;
    out[6] = a2 * -s + a6 * c;
    out[3] = a3 * c + a7 * s;
    out[7] = a3 * -s + a7 * c;

    out[8]  = a[8];  out[9]  = a[9];
    out[10] = a[10]; out[11] = a[11];
    out[12] = a[12]; out[13] = a[13];
    out[14] = a[14]; out[15] = a[15];
    return out;
  }

  static ortho(out, left, right, bottom, top, near = -1, far = 1) {
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);

    out[0]  = -2 * lr;
    out[1]  = 0;
    out[2]  = 0;
    out[3]  = 0;

    out[4]  = 0;
    out[5]  = -2 * bt;
    out[6]  = 0;
    out[7]  = 0;

    out[8]  = 0;
    out[9]  = 0;
    out[10] = 2 * nf;
    out[11] = 0;

    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
  }

  static multiply(out, a, b) {
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    let b0, b1, b2, b3;
    b0 = b[0]; b1 = b[1]; b2 = b[2]; b3 = b[3];
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8]  = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[9]  = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    return out;
  }

  static create() {
    return new Float32Array(16);
  }

  static log(m, label = "Mat4") {
    console.log(`${label}:`);
    for (let i = 0; i < 4; i++) {
      console.log(
        Array.from(m.slice(i * 4, i * 4 + 4))
          .map(v => v.toFixed(3))
          .join("\t")
      );
    }
  }
}

__exports.default = Mat4;
};
// === Module: Util/MiniConsoleOverlay.js ===
__reg.m["Util/MiniConsoleOverlay.js"] = function(__require, __exports, __module) {
const { bus } = __require("Util/EventBus.js");
const __imp_0 = __require("Core/Config.js"); const Config = __imp_0.default !== undefined ? __imp_0.default : __imp_0;

class MiniConsoleOverlay {
    constructor(container, debugConfig = {}) {
        const isRelease = globalThis.__LUPIS_BUILD_MODE__ === 'release' || 
                          globalThis.__LUPIS_ENV__?.MODE === 'production';
        if (isRelease) {
            this.container = null;
            this.config = { active: false };
            this.logs = [];
            this.domElement = null;
            this.logContainer = null;
            this.isVisible = false;
            this._listeners = [];
            this._onKeyDown = null;
            return;
        }
        this.container = container || document.body;
        this.config = {
            active: debugConfig.active ?? true,
            position: debugConfig.position || 'top-right',
            width: debugConfig.width ?? 360,
            height: debugConfig.height ?? 220,
            maxLogs: debugConfig.maxLogs ?? 50,
            isPreview: debugConfig.isPreview !== false
        };

        this.logs = [];
        this.domElement = null;
        this.logContainer = null;
        this.isVisible = Boolean(this.config.active);
        this._listeners = [];
        this._onKeyDown = null;

        if (this.config.active) {
            this._initDOM();
            this._bindEvents();
        }
    }

    _initDOM() {
        this.domElement = document.createElement('div');
        this.domElement.id = 'lupis-mini-console';
        
        Object.assign(this.domElement.style, {
            position: 'absolute',
            zIndex: '9999',
            width: `${this.config.width}px`,
            height: `${this.config.height}px`,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            color: '#f8fafc',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '11px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            pointerEvents: 'auto',
            transition: 'all 0.2s ease'
        });

        this._applyPositionStyle(this.config.position);

        const header = document.createElement('div');
        Object.assign(header.style, {
            padding: '4px 8px',
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            userSelect: 'none'
        });

        const title = document.createElement('span');
        title.innerText = 'Debug Console';
        title.style.fontWeight = 'bold';
        title.style.color = '#38bdf8';

        const btnGroup = document.createElement('div');
        btnGroup.style.display = 'flex';
        btnGroup.style.alignItems = 'center';
        btnGroup.style.gap = '6px';

        const clearBtn = document.createElement('button');
        clearBtn.innerText = 'Clear';
        Object.assign(clearBtn.style, {
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '10px',
            cursor: 'pointer',
            padding: '2px 4px'
        });
        clearBtn.onclick = () => this.clear();

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.title = 'Close Console (Ctrl+F2)';
        closeBtn.setAttribute('data-testid', 'mini-console-close-btn');
        Object.assign(closeBtn.style, {
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '14px',
            lineHeight: '1',
            cursor: 'pointer',
            padding: '0 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });
        closeBtn.onclick = () => this.close();

        btnGroup.appendChild(clearBtn);
        btnGroup.appendChild(closeBtn);

        header.appendChild(title);
        header.appendChild(btnGroup);
        this.domElement.appendChild(header);

        this.logContainer = document.createElement('div');
        Object.assign(this.logContainer.style, {
            flex: '1',
            overflowY: 'auto',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
        });
        this.domElement.appendChild(this.logContainer);

        this.container.appendChild(this.domElement);
    }

    _applyPositionStyle(pos) {
        const style = this.domElement.style;
        style.top = 'auto';
        style.bottom = 'auto';
        style.left = 'auto';
        style.right = 'auto';
        style.transform = 'none';

        const margin = '12px';

        switch (pos) {
            case 'top-left':
                style.top = margin; style.left = margin; break;
            case 'top-center':
                style.top = margin; style.left = '50%'; style.transform = 'translateX(-50%)'; break;
            case 'top-right':
                style.top = margin; style.right = margin; break;
            case 'middle-left':
                style.top = '50%'; style.left = margin; style.transform = 'translateY(-50%)'; break;
            case 'middle-center':
                style.top = '50%'; style.left = '50%'; style.transform = 'translate(-50%, -50%)'; break;
            case 'middle-right':
                style.top = '50%'; style.right = margin; style.transform = 'translateY(-50%)'; break;
            case 'bottom-left':
                style.bottom = margin; style.left = margin; break;
            case 'bottom-center':
                style.bottom = margin; style.left = '50%'; style.transform = 'translateX(-50%)'; break;
            case 'bottom-right':
                style.bottom = margin; style.right = margin; break;
            default:
                style.top = margin; style.right = margin; break;
        }
    }

    _bindEvents() {
        const onLog = (data) => this.addLog(data);
        bus.on('console:log', onLog);
        bus.on('console:warn', onLog);
        bus.on('console:error', onLog);

        this._listeners.push(
            { event: 'console:log', fn: onLog },
            { event: 'console:warn', fn: onLog },
            { event: 'console:error', fn: onLog }
        );

        this._onKeyDown = (e) => {
            if (Config.ENGINE_MODE === 'editor') return;
            if (!this.config.active) return;
            if (this.config.isPreview === false) return;

            const isCtrl = Boolean(e.ctrlKey || e.metaKey);
            if (isCtrl && !e.altKey && !e.shiftKey && (e.key === 'F2' || e.code === 'F2')) {
                e.preventDefault();
                e.stopPropagation();
                this.toggle();
            }
        };

        window.addEventListener('keydown', this._onKeyDown, { capture: true });
    }

    close() {
        if (!this.domElement || !this.isVisible) return;
        this.domElement.style.display = 'none';
        this.isVisible = false;
    }

    open() {
        if (!this.config.active) return;
        if (Config.ENGINE_MODE === 'editor') return;
        if (this.config.isPreview === false) return;

        if (!this.domElement) {
            this._initDOM();
        }
        this.domElement.style.display = 'flex';
        this.isVisible = true;

        if (this.logContainer) {
            this.logContainer.scrollTop = this.logContainer.scrollHeight;
        }
    }

    toggle() {
        if (!this.config.active) return;
        if (this.isVisible) {
            this.close();
        } else {
            this.open();
        }
    }

    addLog(data) {
        if (!this.config.active || !this.logContainer) return;

        const msgText = typeof data.message === 'object' ? JSON.stringify(data.message) : String(data.message ?? '');
        const sourceText = data.source || 'App';
        const type = data.type || 'log';

        const lastLog = this.logs[this.logs.length - 1];
        if (lastLog && lastLog.message === msgText && lastLog.source === sourceText && lastLog.type === type) {
            lastLog.count = (lastLog.count || 1) + 1;
            this._updateLastLogDOM(lastLog);
            return;
        }

        const logEntry = {
            id: Date.now() + Math.random(),
            message: msgText,
            source: sourceText,
            type: type,
            context: data.context || null,
            count: 1
        };

        this.logs.push(logEntry);
        if (this.logs.length > this.config.maxLogs) {
            this.logs.shift();
            if (this.logContainer.firstChild) {
                this.logContainer.removeChild(this.logContainer.firstChild);
            }
        }

        this._renderLogItem(logEntry);
        if (this.isVisible && this.logContainer) {
            this.logContainer.scrollTop = this.logContainer.scrollHeight;
        }
    }

    _renderLogItem(logEntry) {
        const item = document.createElement('div');
        item.dataset.id = logEntry.id;
        
        let color = '#cbd5e1';
        if (logEntry.type === 'warn') color = '#fbbf24';
        if (logEntry.type === 'error') color = '#f87171';

        Object.assign(item.style, {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            color: color,
            lineHeight: '1.3',
            wordBreak: 'break-all'
        });

        const hasContext = Boolean(logEntry.context) || /^\[.*?\]\s*\[.*?\]\s*\[.*?\]\s*\[.*?\]/.test(logEntry.message) || /^\[.*?::.*?\]/.test(logEntry.message);
        const sourceHtml = hasContext
            ? ''
            : `<span style="color: #64748b; font-size: 9px; shrink: 0;">[${logEntry.source}]</span>`;

        item.innerHTML = `
            ${sourceHtml}
            <span class="log-msg" style="flex: 1;">${logEntry.message}</span>
            <span class="log-count" style="display: none; background: #334155; color: #f1f5f9; padding: 0 4px; border-radius: 9999px; font-size: 9px;">1</span>
        `;

        this.logContainer.appendChild(item);
    }

    _updateLastLogDOM(logEntry) {
        const lastItem = this.logContainer.lastElementChild;
        if (lastItem) {
            const countEl = lastItem.querySelector('.log-count');
            if (countEl) {
                countEl.innerText = logEntry.count;
                countEl.style.display = 'inline-block';
            }
        }
    }

    clear() {
        this.logs = [];
        if (this.logContainer) {
            this.logContainer.innerHTML = '';
        }
    }

    destroy() {
        this._listeners.forEach(({ event, fn }) => bus.off(event, fn));
        this._listeners = [];

        if (this._onKeyDown) {
            window.removeEventListener('keydown', this._onKeyDown, { capture: true });
            this._onKeyDown = null;
        }

        if (this.domElement && this.domElement.parentNode) {
            this.domElement.parentNode.removeChild(this.domElement);
            this.domElement = null;
        }
    }
}
__exports.default = MiniConsoleOverlay;
};
// === Module: Util/opfsHelper.js ===
__reg.m["Util/opfsHelper.js"] = function(__require, __exports, __module) {
const ROOT_APP_DIR = 'lupis-engine';
const PROJECTS_DIR = 'projects';
const ASSETS_DIR = 'assets';

class OPFSHelper {
  // Returns directory handle for a project's assets folder (lupis-engine/projects/{projectId}/assets)
  static async getProjectAssetsDir(projectId) {
    try {
      const root = await navigator.storage.getDirectory();
      const appDir = await root.getDirectoryHandle(ROOT_APP_DIR, { create: true });
      const projectsDir = await appDir.getDirectoryHandle(PROJECTS_DIR, { create: true });
      const projectDir = await projectsDir.getDirectoryHandle(String(projectId), { create: true });
      return await projectDir.getDirectoryHandle(ASSETS_DIR, { create: true });
    } catch (error) {
      console.error(`[OPFSHelper] Failed to access assets directory for project [${projectId}]:`, error);
      throw error;
    }
  }

  static async getFile(projectId, fileName) {
    try {
      const assetsDir = await this.getProjectAssetsDir(projectId);
      const fileHandle = await assetsDir.getFileHandle(fileName);
      return await fileHandle.getFile();
    } catch (error) {
      console.error(`[OPFSHelper] Failed to retrieve file "${fileName}" (Project: ${projectId}):`, error);
      throw error;
    }
  }

  static async saveFile(projectId, fileName, content) {
    try {
      const assetsDir = await this.getProjectAssetsDir(projectId);
      const fileHandle = await assetsDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      
      await writable.write(content);
      await writable.close();
      return true;
    } catch (error) {
      console.error(`[OPFSHelper] Failed to save file "${fileName}" (Project: ${projectId}):`, error);
      throw error;
    }
  }

  static async deleteFile(projectId, fileName) {
    try {
      const assetsDir = await this.getProjectAssetsDir(projectId);
      await assetsDir.removeEntry(fileName);
      return true;
    } catch (error) {
      console.warn(`[OPFSHelper] Failed to delete file "${fileName}" (Project: ${projectId}):`, error);
      return false;
    }
  }

  // Caller is responsible for calling URL.revokeObjectURL(url) when finished
  static async createBlobUrl(projectId, fileName) {
    const file = await this.getFile(projectId, fileName);
    return URL.createObjectURL(file);
  }

  static async readAsArrayBuffer(projectId, fileName) {
    const file = await this.getFile(projectId, fileName);
    return await file.arrayBuffer();
  }

  static async readAsText(projectId, fileName) {
    const file = await this.getFile(projectId, fileName);
    return await file.text();
  }

  static async listAssetFiles(projectId) {
    try {
      const assetsDir = await this.getProjectAssetsDir(projectId);
      const files = [];
      for await (const entry of assetsDir.values()) {
        if (entry.kind === 'file') {
          files.push(entry.name);
        }
      }
      return files;
    } catch (error) {
      console.error(`[OPFSHelper] Failed to list files (Project: ${projectId}):`, error);
      return [];
    }
  }

  // Resolves "opfs://projects/{id}/{file}" or "opfs://{id}/{file}"
  static parseOpfsUrl(opfsUrl) {
    if (!opfsUrl || !opfsUrl.startsWith('opfs://')) return null;
    const cleanPath = opfsUrl.replace('opfs://', '');
    const parts = cleanPath.split('/').filter(Boolean);

    if (parts.length < 2) return null;

    const projectId = parts[0] === PROJECTS_DIR ? parts[1] : parts[0];
    const fileName = parts[parts.length - 1];

    return { projectId, fileName };
  }
}

__exports.default = OPFSHelper;

__exports.OPFSHelper = OPFSHelper;
};
// === Module: Util/ScriptContextUtils.js ===
__reg.m["Util/ScriptContextUtils.js"] = function(__require, __exports, __module) {
// Diagnostic error classes and metadata resolution utilities for visual script execution contexts

// Thrown when a script contract invariant assertion fails (context.assert.*)
class ScriptAssertionError extends Error {
  constructor(message, nodeId, nodeType, nodeName = null) {
    super(message);
    this.name = 'ScriptAssertionError';
    this.nodeId = nodeId;
    this.nodeType = nodeType;
    this.nodeName = nodeName || nodeId;
  }
}

// Resolves a clean, professional diagnostic prefix like [Entity::Script] or [Script]
function formatScriptPrefix(entityScriptId, scriptName) {
  const entity = entityScriptId && entityScriptId !== 'Global' && entityScriptId !== 'Entity'
    ? entityScriptId
    : null;
  const script = scriptName && scriptName !== 'Script' ? scriptName : null;

  if (entity && script) {
    return `[${entity}::${script}]`;
  }
  if (entity) {
    return `[${entity}]`;
  }
  if (script) {
    return `[${script}]`;
  }
  return '[Engine]';
}

// Resolves diagnostic metadata and compact prefix for console events
function getScriptContextMetadata(game, runner, node) {
  if (runner && typeof runner.getContextMetadata === 'function') {
    return runner.getContextMetadata(node);
  }

  const sceneName = game?.sceneSystem?.getCurrentSceneScriptId?.() || 
                    game?.world?.currentSceneScriptId || 
                    game?.world?.currentScene?.scriptId || 
                    game?.sceneSystem?.getCurrentSceneId?.() || 
                    'Scene';

  const entityScriptId = runner?.owner 
    ? (runner.owner.scriptId || runner.owner.id || 'Entity') 
    : 'Global';

  const scriptName = runner?.data?.scriptId || 
                     game?.world?.scripts?.[runner?.scriptId]?.scriptId || 
                     runner?.data?.title || 
                     runner?.scriptId || 
                     'Script';

  const nodeName = node ? (
    node.settings?.headerTitle || 
    node.data?.settings?.headerTitle || 
    node.title || 
    node.label || 
    node.type || 
    node.id || 
    'Node'
  ) : 'Node';

  return {
    scene: sceneName,
    entityScriptId: String(entityScriptId),
    script: scriptName,
    node: nodeName,
    prefix: formatScriptPrefix(entityScriptId, scriptName)
  };
}

// Formats raw notifications or log values into a human-readable string
function formatNotificationMessage(message) {
  if (message === undefined || message === null) {
    return String(message ?? '');
  }
  if (message instanceof Map) {
    try {
      return JSON.stringify(Object.fromEntries(message), null, 2);
    } catch {
      return String(message);
    }
  }
  if (message instanceof Set) {
    try {
      return JSON.stringify(Array.from(message), null, 2);
    } catch {
      return String(message);
    }
  }
  if (Array.isArray(message) || (typeof message === 'object' && message !== null)) {
    try {
      return JSON.stringify(message, null, 2);
    } catch {
      return String(message);
    }
  }
  return String(message);
}

__exports.ScriptAssertionError = ScriptAssertionError;
__exports.formatScriptPrefix = formatScriptPrefix;
__exports.getScriptContextMetadata = getScriptContextMetadata;
__exports.formatNotificationMessage = formatNotificationMessage;
};
})();
//# sourceMappingURL=lupis.core.js.map
