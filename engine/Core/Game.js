import GameLoop from "../Loop/GameLoop.js";
import World from "./World.js";
import Camera from "../Util/Camera.js";
import Config from "./Config.js";
import VariableManager from "../Script/VariableManager.js";
import EventManager from "../Script/EventManager.js";
import ScriptSystem from "../Script/ScriptSystem.js";

export default class Game {
    constructor() {
        this.world = new World();
        this.camera = new Camera(0, 0);
        this.camera.scale = 1;
        this.renderer = null;
        this.variables = new VariableManager();
        this.scriptSystem = new ScriptSystem(this);
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
        this.loop = new GameLoop(this);
    }

    start() {
        console.log("[Game] Starting Game Loop...");
        this.loop.start();
    }

    update(dt) {
        if (Config.ENGINE_MODE === "runtime") {
            this.scriptSystem.update(dt);
            this.camera.update(dt);
        }

        if (Config.ENGINE_MODE === "editor") {
        }
    }

    render(alpha) {
        const cam = this.camera.getInterpolated(alpha);

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

    pauseGame() {
        this.isPaused = true;
        console.log("[Game] Paused");
    }

    resumeGame() {
        this.isPaused = false;
        console.log("[Game] Resumed");
    }

    togglePause() {
        if (this.isPaused) this.resumeGame();
        else this.pauseGame();
    }

    quitGame() {
        console.log("[Game] Quitting...");
        this.loop.stop();
    }
}
