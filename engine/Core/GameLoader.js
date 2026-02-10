import Config from "../Core/Config.js";
import RendererManager from "../Renderer/RendererManager.js";
import World from "../Core/World.js";
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
        const { project, assets, scene, prefabs, scripts, editorConfig } = payload;

        try {
            this._initMain(game, canvas, mode);
            
            // 2. Data & Settings Setup
            if (project) game._id = project._id;
            this._setupWorldSettings(game, scene?.settings);
            
            if (mode === "editor") {
                this._setupEditorState(game, editorConfig);
            }

            ScriptLoader.load(game, payload);
            
            const assetLoader = new AssetLoader(
                new GLImageResource(game.renderer.gl),
                new GLFontResource(game.renderer.gl)
            );
            
            game.assetLoader = assetLoader;
            await assetLoader.loadAsset(game.world, assets);

            this._initPrefabLibrary(game.world, prefabs);
            this._initScriptLibrary(game.world, scripts);

            if (scene) {
                new SceneLoader(game.world, mode).loadScene(scene);
            }

            if (mode === "editor") {
                this._initializeEditorTools(game, canvas);
            } else {
                this._initializeRuntimeSystems(game);
            }

            this._setupCamera(game, scene?.camera, mode);
            console.log(game.world)
            game.initLoop();
            this.start(game);

            console.log(`[LupisEngine] ${mode.toUpperCase()} initialized successfully.`);
        } catch (err) {
            console.error("[GameLoader] Critical initialization failure:", err);
        }
    }

    _initMain(game, canvas, mode) {
        Config.ENGINE_MODE = mode;
        game.events = new EventManager();
        game.input = new InputManager(canvas, game.events);
        game.world.ui = [];
        game.renderer = new RendererManager(canvas, game);
    }

    _setupWorldSettings(game, settings = {}) {
        const ws = game.world.settings;
        game.world.settings = {
            tickRate: settings.tickRate ?? 60,
            backgroundColor: settings.backgroundColor ?? "#222222",
            worldBounds: settings.worldBounds ?? ws.worldBounds,
            grid: settings.grid ?? ws.grid,
            showRulers: settings.showRulers ?? true,
            ui: {
                referenceWidth: settings.ui?.referenceWidth ?? 1920,
                referenceHeight: settings.ui?.referenceHeight ?? 1080,
                scaleMode: settings.ui?.scaleMode ?? "constant",
                showUIBorder: settings.ui?.showUIBorder ?? true,
                active: settings.ui?.active ?? true
            }
        };
    }

    _setupEditorState(game, config = {}) {
        game.world._editors = {
            activeTool: config.activeTool || "select",
            activeTabId: config.activeTabId || "scene",
            tabs: config.tabs || [],
            tilemapContext: {
                showOthers: config.tilemapContext?.showOthers ?? true,
                opacity: config.tilemapContext?.opacity ?? 0.5
            },
            showUIBorder: game.world.settings.ui.showUIBorder
        };
    }

    _setupCamera(game, savedCamera, mode) {
        const { referenceWidth: rw, referenceHeight: rh } = game.world.settings.ui;

        if (savedCamera?.x !== undefined) {
            game.camera.x = savedCamera.x;
            game.camera.y = savedCamera.y;
            game.camera.scale = savedCamera.scale || 1;
        } else {
            game.camera.x = rw / 2;
            game.camera.y = rh / 2;
            game.camera.scale = (mode === "editor") ? 0.5 : 1;
        }
    }

    _initializeRuntimeSystems(game) {
        try {
            this._initializeEntityScripts(game);
            game.scriptSystem.startAll();
        } catch (err) {
            console.error("Failed to initialize entity scripts:", err);
        }
    }

    _initScriptLibrary(world, scripts) {
        world.scripts = Array.isArray(scripts) 
            ? Object.fromEntries(scripts.map(s => [s._id, {
                _id: s._id,
                name: s.name,
                type: s.type,
                variables: s.exposedVariables || [],
                nodes: s.nodes || [],
                edges: s.edges || []
            }]))
            : {};
    }

    _initPrefabLibrary(world, prefabs) {
        if (!Array.isArray(prefabs)) return;
        world.prefabs = Object.fromEntries(prefabs.map(p => [p._id, {
            _id: p._id,
            name: p.name,
            data: p.data
        }]));
    }

    _initializeEntityScripts(game) {
        game.world.entities.forEach(entity => {
            const controller = entity.components?.ScriptController;
            if (!Array.isArray(controller?.data)) return;

            controller.data.forEach(instance => {
                const asset = game.world.scripts[instance.assetId];
                if (asset) {
                    game.scriptSystem.add({
                        ...asset,
                        variables: this._mergeVariables(asset.variables, instance.variables)
                    }, entity);
                }
            });
        });
    }

    _mergeVariables(assetVars = [], instanceVars = {}) {
        return assetVars.map(v => ({
            ...v,
            defaultValue: instanceVars[v._id] !== undefined ? instanceVars[v._id] : v.defaultValue
        }));
    }

    _initializeEditorTools(game, canvas) {
        const { world, renderer, camera, input } = game;
        const { EDITOR } = Config;

        if (EDITOR.CAMERA_CONTROLLER) 
            game.cameraController = new CameraController(camera, canvas, input);

        if (EDITOR.GRID) {
            game.grid = new Grid(world, game, canvas, renderer, camera);
            world.gridRenderer = (shape, proj) => {
                if (world.settings.grid?.visible) game.grid.render(shape, proj);
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