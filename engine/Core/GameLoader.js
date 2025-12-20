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

export default class GameLoader {
    async initializeGame(game, canvas, mode = "runtime", baseURL = "./", payload = {}) {
        Config.ENGINE_MODE = mode;
        // console.log(payload)

        game.renderer = new RendererManager(canvas);
        game.input = new InputManager(canvas);
        game.world = new World();
        game.font = "font_gaegu"; 

        let projectConfig, assetsMap, sceneData;

        if (mode === "editor") {
            const prepared = this._prepareEditorData(payload);
            projectConfig = prepared.project;
            assetsMap = prepared.assetsMap;
            sceneData = prepared.sceneData;
        } else {
            [projectConfig, assetsMap] = await Promise.all([
                fetch(baseURL + "project.config.json").then(r => r.json()),
                fetch(baseURL + "assets.map.json").then(r => r.json())
            ]);
            
            const sceneName = projectConfig.meta?.entryScene || projectConfig.entryScene || "level_1";
            sceneData = await fetch(`${baseURL}scenes/${sceneName}.json`).then(r => r.json());
        }

        const glImageLoader = new GLImageResource(game.renderer.gl);
        const assetLoader = new AssetLoader(
            glImageLoader,
            async (fnt, png) => {
                await game.renderer.text.loadFont(fnt, png);
                return game.renderer.text;
            }
        );

        const sceneLoader = new SceneLoader(game.world);
        
        game.world.assets = await assetLoader.loadMap(assetsMap, baseURL);
        

        console.log(assetLoader)
        
        await sceneLoader.load(sceneData, projectConfig, baseURL, game.world.assets);
        

        if (mode === "editor") {
            this._initializeEditorTools(game, canvas);
        }

        // 6. Mulai Game Loop
        game.loop = new GameLoop({
            update: dt => game.update(dt),
            render: alpha => game.render(alpha),
        });

        // console.log("🚀 Engine Started.");
    }

    _prepareEditorData(payload) {
        const { project, assets, scene } = payload;

        const projectConfig = {
            name: project.name,
            ...project.settings, 
            layers: project.layers || ["layer_background", "layer_objects"]
        };

        const texturesMap = {};
        const fontsMap = {};

        if (Array.isArray(assets)) {
            assets.forEach(asset => {
                const fileName = asset.fileKey || asset._id;
                const ext = asset.meta?.extension || '.png';
                const fullName = `${fileName}${ext}`;

                if (asset.type === 'texture' || asset.type === 'sprite') {
                    texturesMap[asset._id] = {
                    uri: fullName,
                    // Ambil filterMode dari backend (misal: 'pixelated' atau 'smooth')
                    filterMode: asset.meta?.filterMode || 'smooth' 
                };
                } else if (asset.type === 'font') {
                    fontsMap[asset._id] = fullName; 
                }
            });
        }

        return {
            project: projectConfig,
            assetsMap: {
                textures: texturesMap,
                fonts: fontsMap
            },
            sceneData: scene
        };
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
            if (!world.layers.has("__editor_selection")) {
                world.layers.set("__editor_selection", []);
                world.layerOrder.push("__editor_selection");
            }
        }

        if (Config.EDITOR.TRANSFORM)
            game.transform = new TransformTool(game.selection, world, game, canvas, renderer, input);

        if (Config.EDITOR.RULERS)
            game.rulers = new Rulers(renderer, camera);

        if (Config.EDITOR.POINTER)
            game.pointerCoords = new PointerCoordinates(game, renderer);
    }

    start(game) {
        if(game.loop) game.loop.start();
    }
}