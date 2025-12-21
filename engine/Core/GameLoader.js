import Config from "./Config.js";
import RendererManager from "../Renderer/RendererManager.js";
import World from "./World.js";
import GameLoop from "../Loop/GameLoop.js";
import InputManager from "../Input/InputManager.js";
import GLImageResource from "../Renderer/Graphic/GLImageResource.js";
import AssetLoader from "../Loader/AssetLoader.js";
import SceneLoader from "../Loader/SceneLoader.js";
import HistoryManager from "../Core/HistoryManager.js";

// Tools Imports... (Biarkan sama)
import CameraController from "../Editor/CameraController.js";
import Rulers from "../Editor/Rulers.js";
import PointerCoordinates from "../Editor/PointerCoordinates.js";
import SelectionTool from "../Editor/SelectionTool.js";
import TransformTool from "../Editor/TransformTool.js";
import Grid from "../Editor/Grid.js";

export default class GameLoader {
    async initializeGame(game, canvas, mode = "runtime", baseURL = "./", payload = {}) {
        Config.ENGINE_MODE = mode;

        // Init Core Systems
        game.renderer = new RendererManager(canvas);
        game.input = new InputManager(canvas);
        game.world = new World();
        game.history = new HistoryManager(game, game.input);

        console.log("📦 [GameLoader] Processing Payload...");

        // 1. Prepare Data (Fail-safe)
        const { project, assetsMap, sceneData } = this._prepareData(payload);

        // 2. Initialize Loaders
        const assetLoader = new AssetLoader(
            new GLImageResource(game.renderer.gl),
            async (fnt, png) => {
                await game.renderer.text.loadFont(fnt, png);
                return game.renderer.text; 
            }
        );
        const sceneLoader = new SceneLoader(game.world);
        
        // 3. Load Assets & Scene
        console.log(`🔄 [GameLoader] Loading ${Object.keys(assetsMap.textures).length} textures...`);
        game.world.assets = await assetLoader.loadMap(assetsMap, baseURL);

        if (sceneData) {
            console.log("🔄 [GameLoader] Building Scene...");
            await sceneLoader.load(sceneData, project, baseURL, game.world.assets);
        } else {
            console.warn("⚠️ [GameLoader] Scene data is empty.");
        }

        // 4. Setup Editor Tools (Only in Editor Mode)
        if (mode === "editor") {
            this._initializeEditorTools(game, canvas);
        }

        // 5. Start Loop
        game.loop = new GameLoop({
            update: dt => game.update(dt),
            render: alpha => game.render(alpha),
        });
        
        console.log("✅ [GameLoader] Ready.");
    }

    _prepareData(payload = {}) {
        // Fallback Defaults
        const rawProject = payload.project || { name: "Untitled", settings: {}, layers: [] };
        
        const project = {
            name: rawProject.name,
            ...rawProject.settings, 
            layers: rawProject.layers?.length ? rawProject.layers : ["layer_background", "layer_objects"]
        };

        const assetsMap = { textures: {}, fonts: {} };
        const rawAssets = Array.isArray(payload.assets) ? payload.assets : [];

        // Map Assets for faster lookup
        rawAssets.forEach(asset => {
            const fileName = asset.fileKey || asset._id;
            
            if (['texture', 'sprite'].includes(asset.type)) {
                assetsMap.textures[asset._id] = {
                    uri: `${fileName}${asset.meta?.extension || '.png'}`,
                    filterMode: asset.meta?.filterMode || 'smooth' 
                };
            } else if (asset.type === 'font') {
                assetsMap.fonts[asset._id] = fileName; 
            }
        });

        return {
            project,
            assetsMap,
            sceneData: payload.scene || { entities: [] }
        };
    }

    _initializeEditorTools(game, canvas) {
        const { world, renderer, camera, input } = game;
        const { EDITOR } = Config;

        if (EDITOR.CAMERA_CONTROLLER) game.cameraController = new CameraController(camera, canvas, input);
        
        if (EDITOR.GRID) {
            game.grid = new Grid(world, game, canvas, renderer, camera, {
                color: "#ffffff", width: 50, height: 50, alpha: 0.5
            });
        }

        if (EDITOR.SELECTION) {
            game.selection = new SelectionTool(world, game, canvas, renderer, input);
            // Ensure editor layer exists
            if (!world.layers.has("__editor_selection")) {
                world.layers.set("__editor_selection", []);
                world.layerOrder.push("__editor_selection");
            }
        }

        if (EDITOR.TRANSFORM) game.transform = new TransformTool(game.selection, world, game, canvas, renderer, input);
        if (EDITOR.RULERS) game.rulers = new Rulers(renderer, camera);
        if (EDITOR.POINTER) game.pointerCoords = new PointerCoordinates(game, renderer);
    }

    start(game) {
        game.loop?.start();
    }
}