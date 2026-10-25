import GameLoop from "../Loop/GameLoop.js";
import World from "./World.js";
import Camera from "../Util/Camera.js";
import Config from "./Config.js";
import VariableManager from "../Script/VariableManager.js";
import ScriptSystem from "../Script/ScriptSystem.js";
import ColliderSystem from "../System/ColliderSystem.js";
import PhysicsSystem from "../System/PhysicsSystem.js";
import AnimatorSystem from "../System/AnimatorSystem.js";
import TransitionSystem from "../System/TransitionSystem.js";
import AudioSystem from "../System/AudioSystem.js";
import PointerRaycast from "../System/PointerRaycast.js";
import SceneSystem from "../System/SceneSystem.js";
import PrefabSystem from "../System/PrefabSystem.js";
import EntitySystem from "../System/EntitySystem.js";
import LayerSystem from "../System/LayerSystem.js";
import TilemapSystem from "../System/TilemapSystem/TilemapSystem.js";
import ContextSystem from "../Script/ContextSystem.js";
import EventManager from "../Script/EventManager.js";
import InputManager from "../Input/InputManager.js";

export default class Game {
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

    quitGame() {
        this.events.emit('game:quit');

        if (this.loop && typeof this.loop.stop === 'function') {
            this.loop.stop();
        }

        if (typeof window !== 'undefined') {
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
            try {
                window.close();
            } catch (e) {
                console.warn('[Game] Unable to close window automatically:', e);
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
        this.quitGame();

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