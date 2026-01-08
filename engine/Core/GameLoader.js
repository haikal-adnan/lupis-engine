import Config from "./Config.js";
import RendererManager from "../Renderer/RendererManager.js";
import World from "./World.js";
import InputManager from "../Input/InputManager.js";
import GLImageResource from "../Renderer/Graphic/GLImageResource.js";
import GLFontResource from "../Renderer/Graphic/GLFontResource.js";
import AssetLoader from "../Loader/AssetLoader.js";
import SceneLoader from "../Loader/SceneLoader.js"; 
import GameLoop from "../Loop/GameLoop.js"
import CameraController from "../Editor/CameraController.js"
import PointerCoordinates from "../Editor/PointerCoordinates.js";
import SelectionTool from "../Editor/SelectionTool.js";
import TransformTool from "../Editor/TransformTool.js";
import SyncComponent from "../Editor/SyncComponent.js";
import Grid from "../Editor/Grid.js";
import Rulers from "../Editor/Rulers.js";
import { bus } from "../Util/EventBus.js";

export default class GameLoader {
    async initializeGame(game, canvas, mode = "runtime", payload = {}) {
        try {
            this._initMain(game, canvas, mode);
        } catch (err) {
            console.error("[GameLoader] Critical Init Failed.", err);
            return;
        }

        const { project, assets, scene, prefabs } = payload;

        try {
            this._initProject(game, project);
        } catch (err) {
            console.error("[GameLoader] Project Init Failed.", err);
            return;
        }

        const textureLoader = new GLImageResource(game.renderer.gl);
        const fontLoader = new GLFontResource(game.renderer.gl);
        const assetLoader = new AssetLoader(textureLoader, fontLoader);

        try {
            await this._initAsset(assetLoader, game.world, assets);
        } catch (err) {
            console.error("[GameLoader] Asset Init Failed.", err);
            return;
        }

        try {
            this._initPrefabLibrary(game.world, prefabs);
        } catch (err) {
            console.error("[GameLoader] Prefab Init Failed.", err);
        }

        if (scene) {
            try {
                const sceneLoader = new SceneLoader(game.world, mode);
                sceneLoader.loadScene(scene);
            } catch (err) {
                console.error("[GameLoader] Scene Load Failed.", err);
            }
        } else {
            console.warn("[GameLoader] No valid scene object found in payload.");
        }

        if (mode === "editor") {
            try { this._initializeEditorTools(game, canvas); } 
            catch (e) { console.warn("Editor tools init partial fail."); }
        }

        console.log(game.world)

        game.loop = new GameLoop({
            update: dt => { try { game.update(dt); } catch(e) { } },
            render: alpha => { try { game.render(alpha); } catch(e) { } },
        });
    }

    _initMain(game, canvas, mode) {
        Config.ENGINE_MODE = mode;
        game.renderer = new RendererManager(canvas);
        game.input = new InputManager(canvas);
        game.world = new World();
    }

    _initProject(game, project) {
        game._id = project._id;
        Config.WIDTH = project.settings.width;
        Config.HEIGHT = project.settings.height;
        Config.BACKGROUND_COLOR = project.settings.backgroundColor;
    }

    _initAsset(assetLoader, world, assets) {
        return assetLoader.loadAsset(world, assets);
    }

    _initPrefabLibrary(world, prefabs) {
        if (!Array.isArray(prefabs)) return;

        world.prefabs = prefabs.reduce((map, item) => {
            map[item._id] = {
                _id: item._id,
                name: item.name,
                data: item.data
            };
            return map;
        }, {});

        console.log(
            `[GameLoader] Registered ${Object.keys(world.prefabs).length} prefabs.`
        );
    }

    _initializeEditorTools(game, canvas) {
        const { world, renderer, camera, input } = game; // Pastikan 'bus' ada di object game
        const { EDITOR } = Config;

        if (EDITOR.CAMERA_CONTROLLER) game.cameraController = new CameraController(camera, canvas, input);
        if (EDITOR.GRID) game.grid = new Grid(world, game, canvas, renderer, camera, { color: "#ffffff", width: 50, height: 50, alpha: 0.5 });
        
        if (EDITOR.SELECTION) {
            game.selection = new SelectionTool(world, game, canvas, renderer, input);
        }

        if (EDITOR.TRANSFORM) game.transform = new TransformTool(game.selection, world, game, canvas, renderer, input);
        if (EDITOR.RULERS) game.rulers = new Rulers(renderer, camera);
        if (EDITOR.POINTER) game.pointerCoords = new PointerCoordinates(game, renderer);

        // --- TAMBAHKAN INI ---
        // Inisialisasi Sync System secara otomatis saat mode Editor
        console.log("[GameLoader] Initializing Sync System...");
        game.syncSystem = new SyncComponent(world, bus);
    }

    start(game) {
        game.loop.start();
    }
}