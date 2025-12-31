import Config from "./Config.js";
import RendererManager from "../Renderer/RendererManager.js";
import World from "./World.js";
import GameLoop from "../Loop/GameLoop.js";
import InputManager from "../Input/InputManager.js";
import GLImageResource from "../Renderer/Graphic/GLImageResource.js";
import AssetLoader from "../Loader/AssetLoader.js";
import SceneLoader from "../Loader/SceneLoader.js";
import HistoryManager from "../Core/HistoryManager.js";
import CameraController from "../Editor/CameraController.js";
import Rulers from "../Editor/Rulers.js";
import PointerCoordinates from "../Editor/PointerCoordinates.js";
import SelectionTool from "../Editor/SelectionTool.js";
import TransformTool from "../Editor/TransformTool.js";
import Grid from "../Editor/Grid.js";

export default class GameLoader {
    async initializeGame(game, canvas, mode = "runtime", baseURL = "./", payload = {}) {
        Config.ENGINE_MODE = mode;

        game.renderer = new RendererManager(canvas);
        game.input = new InputManager(canvas);
        game.world = new World();
        game.history = new HistoryManager(game, game.input);

        const { project, assetsMap, sceneData, prefabsMap } = this._prepareData(payload);

        const assetLoader = new AssetLoader(
            new GLImageResource(game.renderer.gl),
            async (fnt, png) => {
                await game.renderer.text.loadFont(fnt, png);
                return game.renderer.text; 
            }
        );
        const sceneLoader = new SceneLoader(game.world);
        
        // Load Assets (Pass baseURL yang berisi path project)
        game.world.assets = await assetLoader.loadMap(assetsMap, baseURL);

        if (sceneData) {
            await sceneLoader.load(sceneData, project, game.world.assets, prefabsMap);
        }

        if (mode === "editor") {
            this._initializeEditorTools(game, canvas);
        }

        game.loop = new GameLoop({
            update: dt => game.update(dt),
            render: alpha => game.render(alpha),
        });
    }

    _prepareData(payload = {}) {
        const rawProject = payload.project || { name: "Untitled", settings: {}, layers: [] };
        
        const project = {
            name: rawProject.name,
            ...rawProject.settings, 
            layers: rawProject.layers?.length ? rawProject.layers : ["layer_background", "layer_objects"]
        };

        const assetsMap = { textures: {}, fonts: {} };
        const rawAssets = Array.isArray(payload.assets) ? payload.assets : [];

        rawAssets.forEach(asset => {
            const fileName = asset.fileKey || asset._id;
            
            if (['texture', 'sprite', 'image'].includes(asset.type)) {
                assetsMap.textures[asset._id] = {
                    // URI hanya nama file (misal: "player.png")
                    uri: `${fileName}${asset.meta?.extension || '.png'}`,
                    
                    // --- WAJIB ADA: Agar Engine tahu ada Blob lokal ---
                    fileUrl: asset.fileUrl, 
                    // -------------------------------------------------
                    
                    filterMode: asset.meta?.filterMode || 'smooth' 
                };
            } else if (asset.type === 'font') {
                assetsMap.fonts[asset._id] = fileName; 
            }
        });

        const prefabsMap = {};
        const rawPrefabs = Array.isArray(payload.prefabs) ? payload.prefabs : [];
        
        rawPrefabs.forEach(p => {
            prefabsMap[p._id] = p;
        });

        return {
            project,
            assetsMap,
            prefabsMap,
            sceneData: payload.scene || { entities: [] }
        };
    }

    _initializeEditorTools(game, canvas) {
        // ... (Kode Editor Tools sama seperti sebelumnya) ...
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