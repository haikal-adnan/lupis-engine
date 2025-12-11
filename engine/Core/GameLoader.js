import Config from "./Config.js";
import RendererManager from "../Renderer/RendererManager.js";
import World from "./World.js";
import GameLoop from "../Loop/GameLoop.js";
import InputManager from "../Input/InputManager.js";
import GLImageResource from "../Renderer/Graphic/GLImageResource.js";

// Loaders
import AssetLoader from "../Loader/AssetLoader.js";
import SceneLoader from "../Loader/SceneLoader.js";

// Editor Tools
import CameraController from "../Editor/CameraController.js";
import Rulers from "../Editor/Rulers.js";
import PointerCoordinates from "../Editor/PointerCoordinates.js";
import SelectionTool from "../Editor/SelectionTool.js";
import TransformTool from "../Editor/TransformTool.js";
import Grid from "../Editor/Grid.js";

export default class GameLoader {

    async initializeGame(game, canvas, mode = "runtime", baseURL = "./") {
        Config.ENGINE_MODE = mode;

        // 1. Init Core Systems
        game.renderer = new RendererManager(canvas);
        game.input = new InputManager(canvas);
        game.world = new World();
        game.font = "font_gaegu"

        // 2. Fetch Configs
        const [project, assetsMap] = await Promise.all([
            fetch(baseURL + "project.config.json").then(r => r.json()),
            fetch(baseURL + "assets.map.json").then(r => r.json())
        ]);

        // 3. Load Assets
        const glImageLoader = new GLImageResource(game.renderer.gl);
        const assetLoader = new AssetLoader(
            glImageLoader, 
            async (fnt, png) => {
                await game.renderer.text.loadFont(fnt, png);
                return game.renderer.text;
            }
        );
        
        // Inject loaded assets into World
        game.world.assets = await assetLoader.loadMap(assetsMap, baseURL);
        console.log("Assets Loaded:", Object.keys(game.world.assets.textures));

        // 4. Load Scene & Build Entities
        const sceneName = project.meta?.entryScene || project.entryScene || "level_1";
        const sceneData = await fetch(`${baseURL}scenes/${sceneName}.json`).then(r => r.json());

        const sceneLoader = new SceneLoader(game.world, game.world.assets);
        await sceneLoader.load(sceneData, project, baseURL);

        // 5. Init Editor Tools (If needed)
        if (mode === "editor") {
            this._initializeEditorTools(game, canvas);
        }

        // 6. Start Loop
        game.loop = new GameLoop({
            update: dt => game.update(dt),
            render: alpha => game.render(alpha),
        });
    }

    _initializeEditorTools(game, canvas) {
        const { world, renderer, camera, input } = game;
        
        if (Config.EDITOR.CAMERA_CONTROLLER) 
            game.cameraController = new CameraController(camera, canvas, input);

        if (Config.EDITOR.GRID) 
            game.grid = new Grid(world, game, canvas, renderer, camera, {
                color: "#ffffff", width: 50, height: 50, alpha: 0.5
            });

        if (Config.EDITOR.SELECTION) {
            game.selection = new SelectionTool(world, game, canvas, renderer, input);
            world.layers.set("__editor_selection", []);
            world.layerOrder.push("__editor_selection");
        }

        if (Config.EDITOR.TRANSFORM) 
            game.transform = new TransformTool(game.selection, world, game, canvas, renderer, input);

        if (Config.EDITOR.RULERS) 
            game.rulers = new Rulers(renderer, camera);

        if (Config.EDITOR.POINTER) 
            game.pointerCoords = new PointerCoordinates(game, renderer);
    }

    start(game) {
        game.loop.start();
    }
}