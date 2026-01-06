import Config from "./Config.js";
import RendererManager from "../Renderer/RendererManager.js";
import World from "./World.js";
import GameLoop from "../Loop/GameLoop.js";
import InputManager from "../Input/InputManager.js";
import GLImageResource from "../Renderer/Graphic/GLImageResource.js";
import AssetLoader from "../Loader/AssetLoader.js";
import SceneLoader from "../Loader/SceneLoader.js";
import CameraController from "../Editor/CameraController.js";
import Rulers from "../Editor/Rulers.js";
import PointerCoordinates from "../Editor/PointerCoordinates.js";
import SelectionTool from "../Editor/SelectionTool.js";
import TransformTool from "../Editor/TransformTool.js";
import Grid from "../Editor/Grid.js";

import { econsole } from "../Util/EngineConsole.js";

export default class GameLoader {
    async initializeGame(game, canvas, mode = "runtime", baseURL = "./", payload = {}) {

        Config.ENGINE_MODE = mode;

        try {
            game.renderer = new RendererManager(canvas);
            game.input = new InputManager(canvas);
            game.world = new World();
        } catch (err) {
            console.error("Renderer Init Failed:", err);
            return; 
        }

        const { project, assetsMap, sceneData, prefabsMap } = this._prepareData(payload);

        const assetLoader = new AssetLoader(
            new GLImageResource(game.renderer.gl),
            async (fnt, png) => {
                return await game.renderer.text.loadFont(fnt, png);
            }
        );

        const sceneLoader = new SceneLoader(game.world, game.renderer.text);
        
        try {
            game.world.assets = await assetLoader.loadMap(assetsMap, baseURL);
            econsole.log(`[GameLoader] Loaded assets.`);
        } catch (err) {
            econsole.error(`[GameLoader] Asset Map Error: ${err.message}`);
            game.world.assets = { textures: {}, fonts: {} }; 
        }

        try {
            if (sceneData) {
                await sceneLoader.load(sceneData, project, game.world.assets, prefabsMap);
            }
        } catch (err) {
            econsole.error(`[GameLoader] Scene Error: ${err.message}`);
        }

        if (mode === "editor") {
            try { this._initializeEditorTools(game, canvas); } 
            catch (e) { console.warn("Editor tools init partial fail."); }
        }

        game.loop = new GameLoop({
            update: dt => { try { game.update(dt); } catch(e) { } },
            render: alpha => { try { game.render(alpha); } catch(e) { } },
        });
    }

    _prepareData(payload = {}) {
        const rawProject = payload.project || {};
        const project = {
            name: rawProject.name || "Untitled",
            ...(rawProject.settings || {}),
            layers: rawProject.layers || [{ id: "layer_root", name: "Root" }]
        };

        const assetsMap = { textures: {}, fonts: {} };
        const rawAssets = Array.isArray(payload.assets) ? payload.assets : [];

        for (const asset of rawAssets) {
            if (!asset.fileKey) continue; 

            let ext = asset.meta?.extension || '';
            if (!ext && ['texture','sprite','image'].includes(asset.type)) ext = '.png';

            const fileName = asset.fileKey + ext;
            
            const config = {
                fileUrl: asset.fileUrl, 
                uri: fileName,          
                fileKey: asset.fileKey, 
                filterMode: asset.meta?.filterMode || 'nearest'
            };

            if (['texture', 'sprite', 'image'].includes(asset.type)) {
                assetsMap.textures[asset._id] = config;
            } else if (asset.type === 'font') {
                assetsMap.fonts[asset._id] = config;
            }
        }

        const prefabsMap = {};
        const rawPrefabs = payload.prefabs || [];
        for (const p of rawPrefabs) prefabsMap[p._id] = p;

        return {
            project,
            assetsMap,
            prefabsMap,
            sceneData: payload.scene || { entities: [] }
        };
    }

    _initializeEditorTools(game, canvas) {
        const { world, renderer, camera, input } = game;
        const { EDITOR } = Config;

        if (EDITOR.CAMERA_CONTROLLER) game.cameraController = new CameraController(camera, canvas, input);
        if (EDITOR.GRID) game.grid = new Grid(world, game, canvas, renderer, camera, { color: "#ffffff", width: 50, height: 50, alpha: 0.5 });
        
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