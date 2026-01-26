import Config from "./Config.js";
import RendererManager from "../Renderer/RendererManager.js";
import World from "./World.js";
import InputManager from "../Input/InputManager.js";
import GLImageResource from "../Renderer/Graphic/GLImageResource.js";
import GLFontResource from "../Renderer/Graphic/GLFontResource.js";
import AssetLoader from "../Loader/AssetLoader.js";
import SceneLoader from "../Loader/SceneLoader.js"; 
import GameLoop from "../Loop/GameLoop.js";
import ScriptLoader from "../Loader/ScriptLoader.js"; 

import CameraController from "../Editor/CameraController.js";
import PointerCoordinates from "../Editor/PointerCoordinates.js";
import SelectionTool from "../Editor/SelectionTool.js";
import TilemapTool from "../Editor/TilemapTool.js";
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
            console.error(err);
            return;
        }
        console.log("Mode:", mode);

        const { 
            project, 
            assets, 
            scene, 
            prefabs, 
            scripts, 
            editorConfig } = payload;

        if(mode === "editor" && editorConfig) {
            game.world._editors = {
                activeTool: editorConfig.activeTool,
                activeTabId: editorConfig.activeTabId,
                tilemapContext: {
                    showOthers: editorConfig.tilemapContext?.showOthers ?? true,
                    opacity: editorConfig.tilemapContext?.opacity ?? 0.5
                },
                tabs: editorConfig.tabs || [],
                config: editorConfig.config,
                gridContext: editorConfig.gridContext
            };
        }

        try {
            this._initProject(game, project);
            ScriptLoader.load(game, payload);
        } catch (err) {
            console.error(err);
            return;
        }

        const textureLoader = new GLImageResource(game.renderer.gl);
        const fontLoader = new GLFontResource(game.renderer.gl);
        const assetLoader = new AssetLoader(textureLoader, fontLoader);
        
        try {
            await this._initAsset(assetLoader, game.world, assets);
        } catch (err) {
            console.error(err);
            return;
        }
        game.assetLoader = assetLoader;
        
        try {
            this._initPrefabLibrary(game.world, prefabs);
            this._initScriptLibrary(game.world, scripts);
        } catch (err) {
            console.error("Failed to load libraries:", err);
        }

        if (scene) {
            try {
                const sceneLoader = new SceneLoader(game.world, mode);
                sceneLoader.loadScene(scene);
            } catch (err) {
                console.error(err);
            }
        } else {
            console.warn("No valid scene object found.");
        }

        if (mode === "runtime") {
            try {
                this._initializeEntityScripts(game);
            } catch (err) {
                console.error("Failed to initialize entity scripts:", err);
            }
        }

        if (mode === "editor") {
            try { 
                this._initializeEditorTools(game, canvas); 
            } catch (e) { 
                console.warn(e); 
            }
        }

        console.log("Game World Initialized:", game.world);
        
        game.loop = new GameLoop({
            update: dt => { try { game.update(dt); } catch(e) { } },
            render: alpha => { try { game.render(alpha); } catch(e) { } },
        });
    }

    _initMain(game, canvas, mode) {
        Config.ENGINE_MODE = mode;
        game.input = new InputManager(canvas);
        game.world = new World();
        game.world.ui = [];
        game.renderer = new RendererManager(canvas, game);
    }
    
    _initProject(game, project) {
        if (!project) return;
        game._id = project._id;
        Config.WIDTH = project.settings?.width || 1280;
        Config.HEIGHT = project.settings?.height || 720;
        Config.BACKGROUND_COLOR = project.settings?.backgroundColor || "#000000";
    }
    
    _initAsset(assetLoader, world, assets) {
        return assetLoader.loadAsset(world, assets);
    }

    _initScriptLibrary(world, scripts) {
        if (!Array.isArray(scripts)) {
            world.scripts = {}; 
            return;
        }
        world.scripts = scripts.reduce((map, scriptItem) => {
            map[scriptItem._id] = {
                _id: scriptItem._id,
                name: scriptItem.name,
                type: scriptItem.type,
                variables: scriptItem.exposedVariables || [], 
                nodes: scriptItem.nodes || [],
                edges: scriptItem.edges || []
            };
            return map;
        }, {});
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
    }

    _initializeEntityScripts(game) {
        console.log("[GameLoader] Initializing Entity Scripts...");
        let count = 0;

        game.world.entities.forEach(entity => {
            if (!entity.components || !entity.components.ScriptController) return;

            const controller = entity.components.ScriptController;
            
            if (Array.isArray(controller.data)) {
                controller.data.forEach(scriptInstance => {
                    const scriptAssetId = scriptInstance.assetId;
                    const scriptAsset = game.world.scripts[scriptAssetId];

                    if (scriptAsset) {
                        const runtimeScriptData = {
                            ...scriptAsset,
                            variables: this._mergeVariables(scriptAsset.variables, scriptInstance.variables)
                        };

                        game.scriptSystem.add(runtimeScriptData, entity);
                        count++;
                    } else {
                        console.warn(`[GameLoader] Script asset '${scriptAssetId}' not found for entity '${entity.name}'`);
                    }
                });
            }
        });

        console.log(`[GameLoader] attached ${count} script instances to entities.`);
    }

    _mergeVariables(assetVars, instanceVars) {
        if (!assetVars) return [];
        if (!instanceVars) return assetVars;

        return assetVars.map(v => ({
            ...v,
            defaultValue: instanceVars[v._id] !== undefined ? instanceVars[v._id] : v.defaultValue
        }));
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
        game.tilemapTool = new TilemapTool(game);
        if (EDITOR.SELECTION) {
            game.selection = new SelectionTool(world, game, canvas, renderer, input);
        }
        if (EDITOR.TRANSFORM) {
            game.transform = new TransformTool(game.selection, world, game, canvas, renderer, input);
        }
        if (EDITOR.RULERS) {
            game.rulers = new Rulers(game);
            world.ui.push((ui) => {
                game.rulers.render(ui);
            });
        }
        if (EDITOR.POINTER) game.pointerCoords = new PointerCoordinates(game, renderer);
        game.syncSystem = new SyncComponent(world, bus, game.assetLoader);
    }

    start(game) {
        game.loop.start();
    }
}
