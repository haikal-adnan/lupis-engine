import Config from "./Config.js";
import RendererManager from "../Renderer/RendererManager.js";
import World from "./World.js";
import InputManager from "../Input/InputManager.js";
import EventManager from "../Script/EventManager.js";
import GLImageResource from "../Renderer/Graphic/GLImageResource.js";
import GLFontResource from "../Renderer/Graphic/GLFontResource.js";
import AssetLoader from "../Loader/AssetLoader.js";
import SceneLoader from "../Loader/SceneLoader.js";
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

        const { project, assets, scene, prefabs, scripts, editorConfig } = payload;

        if (scene?.settings) {
            game.world.settings = {
                tickRate: scene.settings.tickRate ?? 60,
                backgroundColor: scene.settings.backgroundColor ?? "#222222",
                worldBounds: scene.settings.worldBounds ?? game.world.settings.worldBounds,
                grid: scene.settings.grid ?? game.world.settings.grid,
                showRulers: scene.settings.showRulers ?? true
            };
        }

        if (mode === "editor" && editorConfig) {
            game.world._editors = {
                activeTool: editorConfig.activeTool || 'select',
                activeTabId: editorConfig.activeTabId || 'scene',
                tabs: editorConfig.tabs || [],
                tilemapContext: {
                    showOthers: editorConfig.tilemapContext?.showOthers ?? true,
                    opacity: editorConfig.tilemapContext?.opacity ?? 0.5
                }
            };
        }

        try {
            if (project) game._id = project._id;
            ScriptLoader.load(game, payload);
            
            const assetLoader = new AssetLoader(
                new GLImageResource(game.renderer.gl), 
                new GLFontResource(game.renderer.gl)
            );
            
            await assetLoader.loadAsset(game.world, assets);
            game.assetLoader = assetLoader;

            this._initPrefabLibrary(game.world, prefabs);
            this._initScriptLibrary(game.world, scripts);

            if (scene) {
                new SceneLoader(game.world, mode).loadScene(scene);
            }
        } catch (err) {
            console.error("Initialization error:", err);
        }

        if (mode === "editor") {
            try {
                this._initializeEditorTools(game, canvas);
            } catch (e) {
                console.warn(e);
            }
        } else {
            try {
                this._initializeEntityScripts(game);
                game.scriptSystem.startAll();
            } catch (err) {
                console.error("Failed to initialize entity scripts:", err);
            }
        }

        game.initLoop();
        this.start(game);
    }

    _initMain(game, canvas, mode) {
        Config.ENGINE_MODE = mode;
        game.events = new EventManager();
        game.input = new InputManager(canvas, game.events);
        game.world.ui = [];
        game.renderer = new RendererManager(canvas, game);
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
                    }
                });
            }
        });
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
        const settings = world.settings;

        if (EDITOR.CAMERA_CONTROLLER)
            game.cameraController = new CameraController(camera, canvas, input);

        if (EDITOR.GRID) {
            game.grid = new Grid(world, game, canvas, renderer, camera);

            world.gridRenderer = (shape, proj) => {
                if (world.settings.grid && world.settings.grid.visible) {
                    game.grid.render(shape, proj);
                }
            };
        }

        if (EDITOR.SELECTION) game.selection = new SelectionTool(world, game, canvas, renderer, input);
        if (EDITOR.TRANSFORM) game.transform = new TransformTool(game.selection, world, game, canvas, renderer, input);

        if (EDITOR.RULERS) {
            game.rulers = new Rulers(game);
            world.ui.push(ui => {
                if (world.settings.showRulers) game.rulers.render(ui);
            });
        }

        if (EDITOR.POINTER) game.pointerCoords = new PointerCoordinates(game, renderer);
        
        game.tilemapTool = new TilemapTool(game);
        game.syncSystem = new SyncComponent(world, bus, game);
    }

    start(game) {
        game.start();
    }
}