import Config from "../Core/Config.js";
import RendererManager from "../Renderer/RendererManager.js";
import InputManager from "../Input/InputManager.js";
import EventManager from "../Script/EventManager.js";
import GLImageResource from "../Renderer/Graphic/GLImageResource.js";
import GLFontResource from "../Renderer/Graphic/GLFontResource.js";
import GLAudioResource from "../Renderer/Graphic/GLAudioResource.js";
import AssetLoader from "../Loader/AssetLoader.js";
import SceneLoader from "../Loader/SceneLoader.js";
import ScriptLoader from "../Loader/ScriptLoader.js";

import CameraController from "../Editor/CameraController.js";
import PointerCoordinates from "../Editor/PointerCoordinates.js";
import SelectionTool from "../Editor/SelectionTool.js";
import TilemapTool from "../Editor/TilemapTool.js";
import TransformTool from "../Editor/TransformTool.js";
import ShapeTool from "../Editor/ShapeTool.js";
import SyncComponent from "../Editor/SyncComponent.js";
import Grid from "../Editor/Grid.js";
import Rulers from "../Editor/Rulers.js";
import { bus } from "../Util/EventBus.js";
import ConsoleBroadcaster from "../Util/ConsoleBroadcaster.js";

export default class GameLoader {
    async initializeGame(game, canvas, baseURL, mode = "runtime", payload = {}) {
        const { project, assets, scenes, prefabs, scripts, editorConfig, onProgress } = payload;

        const reportProgress = (message, percent) => {
            if (typeof onProgress === 'function') onProgress(message, percent);
        };

        try {
            reportProgress("Menginisialisasi Sistem Core...", 10);

            bus.emit('console:log', {
                type: 'log',
                time: Date.now(),
                source: 'System',
                message: `Starting initialization in ${mode.toUpperCase()} mode...`
            });

            game.baseURL = baseURL;
            this._initMain(game, canvas, mode);
            
            if (mode === "runtime" || mode === "editor") {
                game.consoleBroadcaster = new ConsoleBroadcaster();
            }

            if (project) game._id = project._id;
            
            if (mode === "editor") {
                this._setupEditorState(game, editorConfig);
            }

            reportProgress("Membangun Prefab Library...", 30);
            this._initPrefabLibrary(game.world, prefabs);
            
            const totalScripts = scripts ? (Array.isArray(scripts) ? scripts.length : Object.keys(scripts).length) : 0;
            bus.emit('console:log', {
                type: 'log',
                time: Date.now(),
                source: 'ScriptManager',
                message: `Compiling and preparing ${totalScripts} blueprint scripts...`
            });
            
            reportProgress("Mengkompilasi Blueprint Script...", 50);
            ScriptLoader.load(game, payload); 
            
            const totalAssets = assets ? (Array.isArray(assets) ? assets.length : Object.keys(assets).length) : 0;
            bus.emit('console:log', {
                type: 'log',
                time: Date.now(),
                source: 'AssetLoader',
                message: `Loading ${totalAssets} project assets (Textures, Audio, Fonts)...`
            });

            reportProgress(`Mengunduh ${totalAssets} Asset...`, 70);
            
            const assetLoader = new AssetLoader(
                new GLImageResource(game.renderer.gl),
                new GLFontResource(game.renderer.gl),
                new GLAudioResource(game.audioSystem.context)
            );
            game.assetLoader = assetLoader;
            
            await assetLoader.loadAsset(game.world, assets, baseURL, (assetMessage, assetProgress) => {
                const scaledProgress = 70 + Math.floor((assetProgress / 100) * 20);
                reportProgress(assetMessage, scaledProgress); 
            });

            bus.emit('console:log', {
                type: 'log',
                time: Date.now(),
                source: 'AssetLoader',
                message: `All assets successfully cached into GPU memory.`
            });

            reportProgress("Menyiapkan Scene Awal...", 90);
            this._initScriptLibrary(game.world, scripts);

            if (scenes && Array.isArray(scenes)) {
                game.setSceneCache(scenes);
            }

            if (scenes && scenes.length > 0) {
                const initialScene = scenes[0];
                bus.emit('console:log', {
                    type: 'log',
                    time: Date.now(),
                    source: 'SceneManager',
                    message: `Loading initial scene: "${initialScene.name || initialScene._id}"`
                });
                
                this._setupWorldSettings(game, project?.settings, initialScene.settings);
                game.loadScene(initialScene._id);
            } else {
                bus.emit('console:warn', {
                    type: 'warn',
                    time: Date.now(),
                    source: 'SceneManager',
                    message: `No active scenes found in project payload.`
                });
                this._setupWorldSettings(game, project?.settings, {});
            }

            if (mode === "editor") {
                this._initializeEditorTools(game, canvas);
            }
            
            reportProgress("Memulai Game Loop...", 98);
            game.initLoop();
            this.start(game);

            reportProgress("Game Siap!", 100);
            console.log(`Initialized successfully.`);
            
            bus.emit('console:log', {
                type: 'log',
                time: Date.now(),
                source: 'System',
                message: `Game successfully running!`
            });

        } catch (err) {
            console.error("Critical initialization failure:", err);
            bus.emit('console:error', {
                type: 'error',
                time: Date.now(),
                source: 'CRITICAL',
                message: `Engine crash on boot: ${err.message}`
            });
        }
    }

    _initMain(game, canvas, mode) {
        Config.ENGINE_MODE = mode;
        game.events = new EventManager();
        game.input = new InputManager(canvas, game.events);
        game.world.ui = [];
        game.renderer = new RendererManager(canvas, game);
    }

    _setupWorldSettings(game, projSettings = {}, sceneSettings = {}) {
        game.world.settings = {
            tickRate: projSettings.tickRate ?? 60,
            backgroundColor: sceneSettings.backgroundColor ?? "#251414",
            worldBounds: sceneSettings.worldBounds ?? { x1: -1920, x2: 1920, y1: -1080, y2: 1080, active: true },
            physics: {
                gravity: sceneSettings.physics?.gravity ?? 1200,
                drag: sceneSettings.physics?.drag ?? 5
            },
            camera: projSettings.camera ?? { x: 0, y: 0, zoom: 1, lerp: 0.1 }, 
            grid: projSettings.grid ?? { width: 32, height: 32, color: "#ffffff", opacity: 0.1, visible: true, snap: true },
            showRulers: sceneSettings.showRulers ?? true,
            ui: projSettings.ui ?? {
                width: 1920,
                height: 1080,
                showUIBorder: true,
                active: true
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
        };
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
            data: p.data,
            children: p.children || [] 
        }]));
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
        game.shapeTool = new ShapeTool(game);
        game.syncSystem = new SyncComponent(world, bus, game);
    }

    start(game) {
        game.start();

        if (game._unloadHandler) {
            window.removeEventListener('beforeunload', game._unloadHandler);
        }

        game._unloadHandler = () => {
            if (game.loop && typeof game.loop.stop === 'function') {
                game.loop.stop();
            }

            bus.emit('console:warn', {
                type: 'warn',
                time: Date.now(),
                message: 'Preview window closed. Engine stopped.',
                source: 'Engine Lifecycle'
            });

            if (game.consoleBroadcaster) {
                game.consoleBroadcaster.destroy();
            }

            this.destroyGame(game);
        };

        window.addEventListener('beforeunload', game._unloadHandler);
    }

    destroyGame(game) {
        if (game.loop && typeof game.loop.stop === 'function') {
            game.loop.stop();
        }

        if (game.audioSystem && game.audioSystem.context) {
            const ctx = game.audioSystem.context;
            if (typeof ctx.close === 'function' && ctx.state !== 'closed') {
                ctx.close().then(() => {
                    console.log("AudioContext closed successfully.");
                }).catch(err => {
                    console.error("Failed to close AudioContext:", err);
                });
            }
        }

        if (game.consoleBroadcaster) {
            game.consoleBroadcaster.destroy();
        }
        
        if (game._unloadHandler) {
            window.removeEventListener('beforeunload', game._unloadHandler);
        }
        
        bus.emit('console:warn', {
            type: 'warn',
            time: Date.now(),
            message: 'Game instance destroyed and resources cleaned up.',
            source: 'Engine Lifecycle'
        });
    }
}