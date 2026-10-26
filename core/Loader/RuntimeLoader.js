import Config from "../Core/Config.js";
import RendererManager from "../Renderer/RendererManager.js";
import InputManager from "../Input/InputManager.js";
import EventManager from "../Script/EventManager.js";
import GLImageResource from "../Renderer/Graphic/GLImageResource.js";
import GLFontResource from "../Renderer/Graphic/GLFontResource.js";
import GLAudioResource from "../Renderer/Graphic/GLAudioResource.js";
import AssetLoader from "./AssetLoader.js";
import ScriptLoader from "./ScriptLoader.js";
import { bus } from "../Util/EventBus.js";
import ConsoleBroadcaster from "../Util/ConsoleBroadcaster.js";
import MiniConsoleOverlay from "../Util/MiniConsoleOverlay.js";
import { DEFAULT_PROJECT_PAYLOAD } from "../Schema/defaultProject.js";

export default class RuntimeLoader {
    async initializeGame(game, canvas, baseURL, mode = "runtime", userPayload = {}) {
        const payload = this._mergeWithDefaultPayload(userPayload);
        const { project, assets, scenes, prefabs, scripts, onProgress } = payload;

        const reportProgress = (message, percent) => {
            if (typeof onProgress === 'function') onProgress(message, percent);
        };

        try {
            reportProgress("Initializing...", 10);

            bus.emit('console:log', {
                type: 'log',
                time: Date.now(),
                source: 'System',
                message: `Starting initialization in ${mode.toUpperCase()} mode...`
            });

            game.baseURL = baseURL;
            game.debugSettings = project.settings.debug;
            game.id = project.id;
            
            this._initMain(game, canvas, mode);

            if (project.globalVariables && game.variables) {
                game.variables.initGlobals(project.globalVariables);
            }
            
            const consoleChannelName = project?.id 
                ? `lupis_engine_preview_channel_${project.id}` 
                : undefined;
            game.consoleBroadcaster = new ConsoleBroadcaster(consoleChannelName);

            reportProgress("Building library...", 30);
            game.prefabSystem.initLibrary(prefabs);
            
            const totalScripts = Array.isArray(scripts) ? scripts.length : Object.keys(scripts).length;
            bus.emit('console:log', {
                type: 'log',
                time: Date.now(),
                source: 'ScriptManager',
                message: `Compiling and preparing ${totalScripts} blueprint scripts...`
            });
            
            reportProgress("Loading scripts...", 50);
            ScriptLoader.load(game, payload); 
            
            const totalAssets = Array.isArray(assets) ? assets.length : Object.keys(assets).length;
            bus.emit('console:log', {
                type: 'log',
                time: Date.now(),
                source: 'AssetLoader',
                message: `Loading ${totalAssets} project assets (Textures, Audio, Fonts)...`
            });

            reportProgress("Loading assets...", 70);
            
            const assetLoader = new AssetLoader(
                new GLImageResource(game.renderer.gl),
                new GLFontResource(game.renderer.gl),
                new GLAudioResource(game.audioSystem.context)
            );
            game.assetLoader = assetLoader;
            
            await assetLoader.loadAsset(game.world, assets, baseURL, (assetMessage, assetProgress) => {
                const scaledProgress = 70 + Math.floor((assetProgress / 100) * 20);
                reportProgress("Loading assets...", scaledProgress); 
            });

            bus.emit('console:log', {
                type: 'log',
                time: Date.now(),
                source: 'AssetLoader',
                message: `All assets successfully cached into GPU memory.`
            });

            reportProgress("Loading scene...", 90);
            this._initScriptLibrary(game.world, scripts);

            const targetSceneId = project.settings?.initialSceneId;
            game.sceneSystem.setSceneCache(scenes, targetSceneId);

            this._onPostInit(game, canvas, payload, mode);

            reportProgress("Starting...", 98);
            game.initLoop();

            reportProgress("Ready!", 100);

            bus.emit('console:log', {
                type: 'log',
                time: Date.now(),
                source: 'System',
                message: `${mode.toUpperCase()} engine successfully initialized and running!`
            });

            const initialScene = scenes.find(s => s.id === targetSceneId) || scenes[0];

            this._setupWorldSettings(game, project.settings, initialScene.settings);
            
            bus.emit('console:log', {
                type: 'log',
                time: Date.now(),
                source: 'SceneManager',
                message: `Loading initial scene: "${initialScene.scriptId || initialScene.id}"`
            });

            await game.sceneSystem.loadScene(initialScene.id);

            this.start(game);

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

    _mergeWithDefaultPayload(userPayload = {}) {
        const userProj = userPayload.project || {};
        const userSettings = userProj.settings || {};
        const defProj = DEFAULT_PROJECT_PAYLOAD.project;
        const defSettings = defProj.settings;

        return {
            project: {
                ...defProj,
                ...userProj,
                settings: {
                    ...defSettings,
                    ...userSettings,
                    debug: { ...defSettings.debug, ...userSettings.debug },
                    ui: { ...defSettings.ui, ...userSettings.ui },
                    camera: { ...defSettings.camera, ...userSettings.camera },
                    grid: { ...defSettings.grid, ...userSettings.grid }
                }
            },
            scenes: (Array.isArray(userPayload.scenes) && userPayload.scenes.length > 0)
                ? userPayload.scenes
                : DEFAULT_PROJECT_PAYLOAD.scenes,
            prefabs: userPayload.prefabs || DEFAULT_PROJECT_PAYLOAD.prefabs,
            assets: userPayload.assets || DEFAULT_PROJECT_PAYLOAD.assets,
            scripts: userPayload.scripts || DEFAULT_PROJECT_PAYLOAD.scripts,
            onProgress: userPayload.onProgress
        };
    }

    _onPostInit(game, canvas, payload, mode) {
        const isRelease = globalThis.__LUPIS_BUILD_MODE__ === 'release' || 
                          globalThis.__LUPIS_ENV__?.MODE === 'production' ||
                          mode === 'release' ||
                          payload?.buildMode === 'release' ||
                          payload?.project?.buildMode === 'release';
        if (isRelease) {
            if (game.miniConsole) {
                game.miniConsole.destroy();
                game.miniConsole = null;
            }
            return;
        }
        const debugConfig = game.debugSettings;
        if (debugConfig && debugConfig.active !== false) {
            const parentElement = canvas.parentElement || document.body;
            game.miniConsole = new MiniConsoleOverlay(parentElement, {
                ...debugConfig,
                isPreview: Boolean(game.isPreview || payload?.isPreview)
            });
        }
    }

    _initMain(game, canvas, mode) {
        Config.ENGINE_MODE = mode;
        game.events = new EventManager();
        game.input = new InputManager(canvas, game.events, game);
        game.world.ui = [];
        game.renderer = new RendererManager(canvas, game);

        ['console:log', 'console:warn', 'console:error'].forEach(eventType => {
            game.events.on(eventType, (data) => bus.emit(eventType, data));
        });

        if (game.audioSystem && typeof game.audioSystem.attachCanvas === 'function') {
            game.audioSystem.attachCanvas(canvas);
        }
    }

    _setupWorldSettings(game, projSettings, sceneSettings = {}) {
        game.world.settings = {
            tickRate: projSettings.tickRate,
            debug: projSettings.debug,
            backgroundColor: sceneSettings.backgroundColor ?? "#1a1a1a",
            worldBounds: sceneSettings.worldBounds ?? { x1: -1920, x2: 1920, y1: -1080, y2: 1080, active: true },
            physics: {
                gravity: sceneSettings.physics?.gravity ?? 1200,
                drag: sceneSettings.physics?.drag ?? 5
            },
            camera: projSettings.camera, 
            grid: projSettings.grid,
            showRulers: sceneSettings.showRulers ?? false,
            ui: projSettings.ui
        };
    }

    _initScriptLibrary(world, scripts) {
        world.scripts = Array.isArray(scripts) 
            ? Object.fromEntries(scripts.map(s => [s.id, {
                id: s.id,
                scriptId: s.scriptId,
                type: s.type,
                variables: s.localVariables || [],
                nodes: s.nodes || [],
                edges: s.edges || []
            }]))
            : {};
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

        if (game.miniConsole) {
            game.miniConsole.destroy();
            game.miniConsole = null;
        }

        if (game.audioSystem && game.audioSystem.context) {
            const ctx = game.audioSystem.context;
            if (typeof ctx.close === 'function' && ctx.state !== 'closed') {
                ctx.close().then(() => {
                    bus.emit('console:log', {
                        type: 'log',
                        time: Date.now(),
                        source: 'AudioSystem',
                        message: 'AudioContext closed successfully.'
                    });
                }).catch(err => {
                    console.error("Failed to close AudioContext:", err);
                    bus.emit('console:error', {
                        type: 'error',
                        time: Date.now(),
                        source: 'AudioSystem',
                        message: `Failed to close AudioContext: ${err.message}`
                    });
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