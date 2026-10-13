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
        this.input = new InputManager(canvasElement, this.events);
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

        // Reset semua variabel global kembali ke nilai awal
        if (this.variables && typeof this.variables.resetGlobals === 'function') {
            this.variables.resetGlobals();
        }

        // Antrekan pemuatan Initial Scene
        if (this.sceneSystem) {
            this.sceneSystem.loadInitialScene();
        }

        this.events.emit('game:restart');
    }

    quitGame() {
        if (this.loop && typeof this.loop.stop === 'function') {
            this.loop.stop();
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

            if (this.input) {
                if (this.input.keyboard && typeof this.input.keyboard.endFrame === 'function') {
                    this.input.keyboard.endFrame();
                }
                if (this.input.mouse && typeof this.input.mouse.endFrame === 'function') {
                    this.input.mouse.endFrame();
                }
            }
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