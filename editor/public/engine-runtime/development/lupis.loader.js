(function() {
const __reg = globalThis.__LUPIS_REGISTRY__ = globalThis.__LUPIS_REGISTRY__ || { m: {}, c: {} };
// === Module: Runtime.js ===
__reg.m["Runtime.js"] = function(__require, __exports, __module) {
const __imp_0 = __require("Core/Game.js"); const Game = __imp_0.default !== undefined ? __imp_0.default : __imp_0;
const __imp_1 = __require("Loader/RuntimeLoader.js"); const RuntimeLoader = __imp_1.default !== undefined ? __imp_1.default : __imp_1;
const { bus } = __require("Util/EventBus.js");
const __imp_2 = __require("Util/LupisPackageHelper.js"); const LupisPackageHelper = __imp_2.default !== undefined ? __imp_2.default : __imp_2;

async function fetchJsonWithFallback(url, fallbackValue = null) {
    try {
        const result = await LupisPackageHelper.fetchJson(url, null);
        if (result !== null) return result;
        return fallbackValue;
    } catch (e) {
        console.warn(`[Main] Optional JSON not found at ${url}, using fallback.`);
        return fallbackValue;
    }
}

async function loadDetailedItems(baseURL, indexItems, folderName) {
    if (!Array.isArray(indexItems) || indexItems.length === 0) return [];

    const itemPromises = indexItems.map(async (item) => {
        if (typeof item === 'object' && (item.nodes || item.entities || item.localVariables)) {
            return item;
        }

        const fileName = item.fileName || item.file || (typeof item === 'string' ? `${item}.json` : (item.id ? `${item.id}.json` : null));
        if (!fileName) return item;

        const detailUrl = `${baseURL}/${folderName}/${fileName}`;
        const detailData = await fetchJsonWithFallback(detailUrl, null);
        
        if (detailData && typeof detailData === 'object') {
            return { ...item, ...detailData };
        }
        return item;
    });

    return await Promise.all(itemPromises);
}

async function startEngine(canvasSource, baseURL, initialData = {}, mode = "runtime", onProgress = null) {
    let canvas = typeof canvasSource === 'string' ? document.getElementById(canvasSource) : canvasSource;

    if (!canvas) {
        console.error(`[Main] Canvas element not found.`);
        return null;
    }
    
    Object.assign(canvas.style, {
        display: "block",      
        touchAction: "none",   
        userSelect: "none", 
        outline: "none"      
    });

    canvas.oncontextmenu = (e) => e.preventDefault();

    const game = new Game(); 
    window.$game = game;

    const loader = new RuntimeLoader();

    try {
        let payload = initialData;
        let effectiveBaseURL = baseURL || "./data";

        if (!payload || !payload.assets) {
            let cleanBaseURL = effectiveBaseURL.replace(/\/$/, "");

            if (cleanBaseURL.endsWith(".lupisproject") || cleanBaseURL.endsWith(".data")) {
                const targetAlias = cleanBaseURL.endsWith(".data") ? "./data" : "./project";
                const archiveLoaded = await LupisPackageHelper.tryLoadArchiveFromUrl(cleanBaseURL, targetAlias);
                if (!archiveLoaded) {
                    throw new Error(`Failed to load or decode binary archive from ${cleanBaseURL}`);
                }
                cleanBaseURL = targetAlias;
                effectiveBaseURL = targetAlias;
            } else if (globalThis.__LUPIS_BUILD_MODE__ === "release" && !LupisPackageHelper.hasVirtualArchive()) {
                await LupisPackageHelper.tryLoadArchiveFromUrl(`${cleanBaseURL}/game.data`, cleanBaseURL);
            }

            let projectJsonUrl = `${cleanBaseURL}/project.json`;
            console.log(`[Main] ${mode.toUpperCase()} mode: Fetching project structure from ${cleanBaseURL}...`);

            let projectMeta = await LupisPackageHelper.fetchJson(projectJsonUrl, null);

            if (!projectMeta) {
                const archiveCandidates = [
                    `${cleanBaseURL}/game.data`,
                    "./data/game.data",
                    "./game.lupisproject"
                ];
                for (const candidateUrl of archiveCandidates) {
                    const loaded = await LupisPackageHelper.tryLoadArchiveFromUrl(candidateUrl, cleanBaseURL);
                    if (loaded) {
                        projectMeta = await LupisPackageHelper.fetchJson(projectJsonUrl, null);
                        if (projectMeta) break;
                    }
                }
            }

            if (!projectMeta && cleanBaseURL !== "./project") {
                const legacyMeta = await LupisPackageHelper.fetchJson("./project/project.json", null);
                if (legacyMeta) {
                    projectMeta = legacyMeta;
                    cleanBaseURL = "./project";
                    effectiveBaseURL = "./project";
                    projectJsonUrl = "./project/project.json";
                }
            }

            if (!projectMeta) {
                throw new Error(`Failed to load project.json from ${projectJsonUrl}`);
            }

            let [assetsData, scenesData, prefabsData, scriptsData] = await Promise.all([
                fetchJsonWithFallback(`${cleanBaseURL}/workspaces/assets.json`, []),
                fetchJsonWithFallback(`${cleanBaseURL}/workspaces/scenes.json`, []),
                fetchJsonWithFallback(`${cleanBaseURL}/workspaces/prefabs.json`, []),
                fetchJsonWithFallback(`${cleanBaseURL}/workspaces/scripts.json`, [])
            ]);

            const rawAssets = Array.isArray(assetsData) ? assetsData : (assetsData?.items || []);
            const rawScenes = Array.isArray(scenesData) ? scenesData : (scenesData?.items || []);
            const rawPrefabs = Array.isArray(prefabsData) ? prefabsData : (prefabsData?.items || []);
            const rawScripts = Array.isArray(scriptsData) ? scriptsData : (scriptsData?.items || []);

            const [fullScenes, fullPrefabs, fullScripts] = await Promise.all([
                loadDetailedItems(cleanBaseURL, rawScenes, "scenes"),
                loadDetailedItems(cleanBaseURL, rawPrefabs, "prefabs"),
                loadDetailedItems(cleanBaseURL, rawScripts, "scripts")
            ]);

            const resolvedAssets = rawAssets.map(asset => ({
                ...asset,
                fileUrl: asset.fileUrl || (asset.path ? `${cleanBaseURL}/${asset.path}` : null)
            }));

            const finalScripts = Array.isArray(fullScripts) ? fullScripts : Object.values(fullScripts);

            payload = {
                project: projectMeta,
                assets: resolvedAssets,
                scenes: fullScenes,
                prefabs: fullPrefabs,
                scripts: finalScripts,
                onProgress
            };
        } else if (onProgress && !payload.onProgress) {
            payload.onProgress = onProgress;
        }

        await loader.initializeGame(game, canvas, effectiveBaseURL, mode, payload);
        
        return { game, bus };
        
    } catch (error) {
        console.error("[Main] Fatal Error: Failed to start engine.", error);
        throw error;
    }
}

__exports.startEngine = startEngine;
};
// === Module: Loader/AssetLoader.js ===
__reg.m["Loader/AssetLoader.js"] = function(__require, __exports, __module) {
const { DEFAULT_FONT_XML, DEFAULT_FONT_TEXTURE_B64 } = __require("Assets/Fonts/defaultFont.js");
const { DEFAULT_SYSTEM_FONT_ASSET } = __require("Schema/defaultAsset.js");
const __imp_0 = __require("Core/Config.js"); const Config = __imp_0.default !== undefined ? __imp_0.default : __imp_0;

class AssetLoader {
  constructor(imageResource, fontResource, audioResource) {
    this.imageResource = imageResource;
    this.fontResource = fontResource;
    this.audioResource = audioResource;
    this._isSystemDefaultLoaded = false;
  }

  async loadAsset(world, assets = [], baseURL, onProgress) {
    if (!this._isSystemDefaultLoaded) {
      await this._loadSystemDefault(world);
      this._isSystemDefaultLoaded = true;
    }

    if (!world.audios) world.audios = {};
    if (!world.assetMap) world.assetMap = {};
    world.assetList = Array.isArray(assets) ? assets : [];
    for (const a of world.assetList) {
      if (a && a.id) {
        world.assetMap[a.id] = a;
        if (a.scriptId) world.assetMap[a.scriptId] = a;
      }
    }

    const totalAssets = assets.length;
    let loadedAssets = 0;

    if (totalAssets === 0) {
      if (onProgress) onProgress("All assets ready...", 100);
      return;
    }

    const loadPromises = assets.map(async (asset) => {
      try {
        switch (asset.type) {
          case "texture":
            await this.loadTexture(world, asset, baseURL);
            break;
          case "font":
            await this.loadFont(world, asset, baseURL);
            break;
          case "audio":
            if (Config.ENGINE_MODE !== "editor") {
              await this.loadAudio(world, asset, baseURL);
            }
            break;
        }
      } catch (err) {
        console.error(`[AssetLoader] Failed to load asset [${asset.id}]: ${asset.scriptId || asset.id}`, err);
      } finally {
        loadedAssets++;
        if (onProgress) {
          const percentage = Math.floor((loadedAssets / totalAssets) * 100);
          onProgress("Loading assets...", percentage);
        }
      }
    });

    await Promise.all(loadPromises);
  }

  async _loadSystemDefault(world) {
    try {
      const blob = new Blob([DEFAULT_FONT_XML], { type: "application/xml" });
      const xmlUrl = URL.createObjectURL(blob);

      const defaultAsset = {
        ...DEFAULT_SYSTEM_FONT_ASSET,
        fileUrl: xmlUrl,
        meta: {
          ...DEFAULT_SYSTEM_FONT_ASSET.meta,
          textureUrl: DEFAULT_FONT_TEXTURE_B64
        }
      };

      const fontResult = await this.fontResource.loadFontFromAsset(defaultAsset, null, true);
      world.addFont(defaultAsset.id, fontResult);

      URL.revokeObjectURL(xmlUrl);
    } catch (e) {
      console.error("[AssetLoader] CRITICAL: Failed to load System Default Font.", e);
    }
  }

  async loadTexture(world, asset, baseURL) {
    const textureData = await this.imageResource.loadTextureFromAsset(asset, baseURL);
    if (!textureData) return;

    const data = {
      id: asset.id,
      glTexture: textureData.glTexture,
      fileurl: textureData.src,
      width: textureData.width,
      height: textureData.height
    };

    world.addTexture(asset.id, data);
    if (asset.scriptId && asset.scriptId !== asset.id) {
      world.addTexture(asset.scriptId, data);
    }
  }

  async loadFont(world, asset, baseURL) {
    const fontResult = await this.fontResource.loadFontFromAsset(asset, baseURL);
    if (fontResult) {
      world.addFont(asset.id, fontResult);
      if (asset.scriptId && asset.scriptId !== asset.id) {
        world.addFont(asset.scriptId, fontResult);
      }
    }
  }

  async loadAudio(world, asset, baseURL) {
    const audioData = await this.audioResource.loadAudioFromAsset(asset, baseURL);
    if (audioData && audioData.buffer) {
      world.audios[asset.id] = audioData.buffer;
    }
  }
}
__exports.default = AssetLoader;
};
// === Module: Loader/RuntimeLoader.js ===
__reg.m["Loader/RuntimeLoader.js"] = function(__require, __exports, __module) {
const __imp_0 = __require("Core/Config.js"); const Config = __imp_0.default !== undefined ? __imp_0.default : __imp_0;
const __imp_1 = __require("Renderer/RendererManager.js"); const RendererManager = __imp_1.default !== undefined ? __imp_1.default : __imp_1;
const __imp_2 = __require("Input/InputManager.js"); const InputManager = __imp_2.default !== undefined ? __imp_2.default : __imp_2;
const __imp_3 = __require("Script/EventManager.js"); const EventManager = __imp_3.default !== undefined ? __imp_3.default : __imp_3;
const __imp_4 = __require("Renderer/Graphic/GLImageResource.js"); const GLImageResource = __imp_4.default !== undefined ? __imp_4.default : __imp_4;
const __imp_5 = __require("Renderer/Graphic/GLFontResource.js"); const GLFontResource = __imp_5.default !== undefined ? __imp_5.default : __imp_5;
const __imp_6 = __require("Renderer/Graphic/GLAudioResource.js"); const GLAudioResource = __imp_6.default !== undefined ? __imp_6.default : __imp_6;
const __imp_7 = __require("Loader/AssetLoader.js"); const AssetLoader = __imp_7.default !== undefined ? __imp_7.default : __imp_7;
const __imp_8 = __require("Loader/ScriptLoader.js"); const ScriptLoader = __imp_8.default !== undefined ? __imp_8.default : __imp_8;
const { bus } = __require("Util/EventBus.js");
const __imp_9 = __require("Util/ConsoleBroadcaster.js"); const ConsoleBroadcaster = __imp_9.default !== undefined ? __imp_9.default : __imp_9;
const __imp_10 = __require("Util/MiniConsoleOverlay.js"); const MiniConsoleOverlay = __imp_10.default !== undefined ? __imp_10.default : __imp_10;
const { DEFAULT_PROJECT_PAYLOAD } = __require("Schema/defaultProject.js");

class RuntimeLoader {
    async initializeGame(game, canvas, baseURL, mode = "runtime", userPayload = {}) {
        const payload = this._mergeWithDefaultPayload(userPayload);
        const { project, assets, scenes, prefabs, scripts, onProgress } = payload;

        const reportProgress = (message, percent) => {
            if (typeof onProgress === 'function') onProgress(message, percent);
        };

        try {
            reportProgress("Initializing...", 10);

            const consoleChannelName = project?.id 
                ? `lupis_engine_preview_channel_${project.id}` 
                : undefined;
            game.consoleBroadcaster = new ConsoleBroadcaster(consoleChannelName);

            if (game.isPreview || payload?.isPreview) {
                bus.emit('console:clear');
            }

            bus.emit('console:log', {
                type: 'log',
                time: Date.now(),
                source: 'System',
                message: `Preview session started (${mode.toUpperCase()} mode)`
            });

            game.baseURL = baseURL;
            game.debugSettings = project.settings.debug;
            game.id = project.id;
            
            this._initMain(game, canvas, mode);

            if (project.globalVariables && game.variables) {
                game.variables.initGlobals(project.globalVariables);
            }

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

            this.destroyGame(game);
        };

        window.addEventListener('beforeunload', game._unloadHandler);
    }

    destroyGame(game) {
        if (game.loop && typeof game.loop.stop === 'function') {
            game.loop.stop();
        }

        if (game.consoleBroadcaster) {
            const broadcaster = game.consoleBroadcaster;
            game.consoleBroadcaster = null;
            setTimeout(() => {
                broadcaster.destroy();
            }, 100);
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
__exports.default = RuntimeLoader;
};
// === Module: Loader/SceneLoader.js ===
__reg.m["Loader/SceneLoader.js"] = function(__require, __exports, __module) {
const __imp_0 = __require("Core/Entity.js"); const Entity = __imp_0.default !== undefined ? __imp_0.default : __imp_0;

class SceneLoader {
    constructor(world, mode) {
        this.world = world;
        this.mode = mode;
    }

    loadScene(sceneData) {
        if (!sceneData) return;

        if (this.world) {
            this.world.currentSceneId = sceneData.id; 
            this.world.currentSceneScriptId = sceneData.scriptId || sceneData.id || null;
            
            if (sceneData.settings) {
                this.world.settings = { ...this.world.settings, ...sceneData.settings };
            }
        }

        const parseLayers = (layers, defaultZ) => {
            if (Array.isArray(layers) && layers.length > 0) {
                return layers.map((layer, index) => ({
                    id: layer.id,
                    scriptId: layer.scriptId, 
                    visible: layer.visible ?? true,
                    locked: layer.locked ?? false,
                    active: layer.active ?? true,
                    opacity: layer.opacity ?? 1.0, 
                    zIndex: Number(layer.zIndex ?? defaultZ), 
                    orderIndex: Number(layer.orderIndex ?? index),
                    entities: []
                }));
            }
            return [];
        };

        this.world.layersWorld = parseLayers(sceneData.layersWorld, 0);
        this.world.layersUI = parseLayers(sceneData.layersUI, 0);

        if (this.world.layersWorld.length === 0) {
            this.world.layersWorld.push({ 
                id: "layer_w_root", scriptId: "root_w", 
                visible: true, locked: false, zIndex: 0, orderIndex: 0, entities: [] 
            });
        }
        if (this.world.layersUI.length === 0) {
            this.world.layersUI.push({ 
                id: "layer_ui_root", scriptId: "root_ui", 
                visible: true, locked: false, zIndex: 0, orderIndex: 0, entities: [] 
            });
        }

        if (!Array.isArray(sceneData.entities)) return;

        this.world.entities = [];
        if (this.world.scriptIdMap) this.world.scriptIdMap.clear();

        const createdEntities = new Map();

        for (const entityData of sceneData.entities) {
            const entity = this._createEntityInstance(entityData);
            if (!entity) continue;

            createdEntities.set(entity.id, entity);
            this.world.addEntity(entity);
            
            if (this.world.scriptIdMap && entity.scriptId) {
                this.world.scriptIdMap.set(entity.scriptId, entity);
            }
        }

        for (const entity of createdEntities.values()) {
            if (!entity.parentId) continue;

            const parent = createdEntities.get(entity.parentId);
            if (parent) {
                parent.addChild(entity);
            } else {
                entity.parentId = null; 
            }
        }

        this.world.allLayers.forEach(layer => {
            if(layer.entities.length > 0) {
                layer.entities.sort((a, b) => {
                    if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
                    return a.orderIndex - b.orderIndex;
                });
            }
        });
    }

    _createEntityInstance(instanceData) {
        let finalData = instanceData;

        if (instanceData.prefabId) {
            const prefab = this.world.prefabs?.[instanceData.prefabId];
            if (prefab) {
                let template = null;

                if (prefab.children && prefab.children.length > 0) {
                    template = prefab.children.find(c => c.scriptId === instanceData.scriptId);
                }

                if (!template) {
                    template = prefab.data;
                }

                if (template) {
                    finalData = this._mergePrefabData(template, instanceData);
                }
            }
        }

        const entity = new Entity(finalData.id);

        entity.scriptId = finalData.scriptId; 
        entity.type = finalData.type;
        if (Array.isArray(finalData.tags)) {
            entity.tags = finalData.tags.map(t => String(t).trim()).filter(Boolean);
        } else if (finalData.tag && String(finalData.tag).toLowerCase() !== 'untagged') {
            entity.tags = [String(finalData.tag).trim()];
        } else {
            entity.tags = [];
        }
        entity.layerId = finalData.layerId;
        entity.parentId = finalData.parentId;

        entity.zIndex = Number(finalData.zIndex ?? 0);
        entity.orderIndex = Number(finalData.orderIndex ?? 0);

        entity.active = finalData.active ?? true;
        entity.visible = finalData.visible ?? true;
        entity.locked = finalData.locked ?? false;
        entity.prefabId = finalData.prefabId;
        
        entity.overridden = finalData.overridden ?? false;

        if(this.mode == "editor") entity._editor = finalData._editor;

        if (finalData.components) {
            for (const [key, val] of Object.entries(finalData.components)) {
                entity.addComponent(key, val);
            }
            if (entity.components.UITransform) {
                const ut = entity.components.UITransform;
                if (typeof ut._baseWidth !== 'number' && typeof ut.width === 'number') ut._baseWidth = ut.width;
                if (typeof ut._baseHeight !== 'number' && typeof ut.height === 'number') ut._baseHeight = ut.height;
                if (typeof ut._baseX !== 'number' && typeof ut.x === 'number') ut._baseX = ut.x;
                if (typeof ut._baseY !== 'number' && typeof ut.y === 'number') ut._baseY = ut.y;
            }
            if (entity.components.SpriteRenderer) {
                const sr = entity.components.SpriteRenderer;
                if (typeof sr._baseSourceWidth !== 'number' && typeof sr.sourceWidth === 'number') sr._baseSourceWidth = sr.sourceWidth;
                if (typeof sr._baseSourceHeight !== 'number' && typeof sr.sourceHeight === 'number') sr._baseSourceHeight = sr.sourceHeight;
                if (typeof sr._baseSourceX !== 'number' && typeof sr.sourceX === 'number') sr._baseSourceX = sr.sourceX;
                if (typeof sr._baseSourceY !== 'number' && typeof sr.sourceY === 'number') sr._baseSourceY = sr.sourceY;
            }
            if (entity.components.ShapeRenderer) {
                const sh = entity.components.ShapeRenderer;
                if (typeof sh._baseWidth !== 'number' && typeof sh.width === 'number') sh._baseWidth = sh.width;
                if (typeof sh._baseHeight !== 'number' && typeof sh.height === 'number') sh._baseHeight = sh.height;
            }
        }

        return entity;
    }

    _mergePrefabData(template, instance) {
        const merged = JSON.parse(JSON.stringify(template));

        merged.id = instance.id;
        merged.scriptId = instance.scriptId || template.scriptId; 
        merged.parentId = instance.parentId;
        merged.layerId = instance.layerId;
        merged.prefabId = instance.prefabId;
        if (Array.isArray(instance.tags)) {
            merged.tags = [...instance.tags];
        } else if (instance.tag && String(instance.tag).toLowerCase() !== 'untagged') {
            merged.tags = [String(instance.tag).trim()];
        } else if (Array.isArray(template.tags)) {
            merged.tags = [...template.tags];
        } else if (template.tag && String(template.tag).toLowerCase() !== 'untagged') {
            merged.tags = [String(template.tag).trim()];
        } else {
            merged.tags = [];
        }
        merged.tag = merged.tags[0] || instance.tag || template.tag || 'untagged';
        merged.active = instance.active;
        merged.visible = instance.visible;
        merged.locked = instance.locked;
        merged.zIndex = instance.zIndex;
        merged.orderIndex = instance.orderIndex;
        
        merged.components ??= {};
        const instanceComps = instance.components || {};

        for (const [key, compData] of Object.entries(instanceComps)) {
            const isCompOverridden = compData.overridden === true;
            
            if (isCompOverridden) {
                merged.components[key] = { ...compData }; 
            } else {
                if (merged.components[key]) {
                    if (key === "Transform" || key === "UITransform") {
                        if (compData.x !== undefined) merged.components[key].x = compData.x;
                        if (compData.y !== undefined) merged.components[key].y = compData.y;
                        if (compData.rotation !== undefined) merged.components[key].rotation = compData.rotation;
                    }
                } else {
                    merged.components[key] = { ...compData };
                }
            }
        }

        return merged;
    }
}
__exports.default = SceneLoader;
};
// === Module: Loader/ScriptLoader.js ===
__reg.m["Loader/ScriptLoader.js"] = function(__require, __exports, __module) {
class LoadScript {
    static load(game, payload) {
        const { project, scripts } = payload;

        if (!game.variables || !game.events) {
            console.error("[LoadScript] VariableManager or EventManager not initialized in Game.");
            return;
        }

        if (project && project.globalVariables) {
            game.variables.initGlobals(project.globalVariables);
        }

        if (Array.isArray(scripts)) {
            scripts.forEach(script => {
                const vars = script.variables || script.localVariables || [];
                game.variables.registerScriptSchema(script.id, vars);
            });
        }
    }
}

__exports.default = LoadScript;
};
// === Module: Util/LupisPackageHelper.js ===
__reg.m["Util/LupisPackageHelper.js"] = function(__require, __exports, __module) {
// Decodes protected assets, obfuscated node code, and unpacks in-memory .lupisproject archives

const LUPIS_PROJECT_HEADER = new Uint8Array([
  0x4C, 0x55, 0x50, 0x49, 0x53, 0x5F, 0x50, 0x52,
  0x4F, 0x4A, 0x45, 0x43, 0x54, 0x31, 0x21, 0x00
]); // "LUPIS_PROJECT1!\0"

const LUPIS_DATA_HEADER = new Uint8Array([
  0x4C, 0x55, 0x50, 0x49, 0x53, 0x5F, 0x44, 0x41,
  0x54, 0x41, 0x5F, 0x56, 0x31, 0x21, 0x00, 0x00
]); // "LUPIS_DATA_V1!\0\0"

const LUPIS_XOR_KEY = 0x5A;

class LupisPackageHelper {
  static _virtualFiles = new Map();
  static _activeArchiveBase = null;

  static hasHeader(bytes, header) {
    if (!bytes || bytes.length < header.length) return false;
    for (let i = 0; i < header.length; i++) {
      if (bytes[i] !== header[i]) return false;
    }
    return true;
  }

  static isLupisDataBuffer(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    return this.hasHeader(bytes, LUPIS_DATA_HEADER);
  }

  static isLupisProjectBuffer(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    return this.hasHeader(bytes, LUPIS_PROJECT_HEADER);
  }

  static encodeLupisDataBuffer(buffer) {
    const src = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const out = new Uint8Array(LUPIS_DATA_HEADER.length + src.length);
    out.set(LUPIS_DATA_HEADER, 0);
    for (let i = 0; i < src.length; i++) {
      out[LUPIS_DATA_HEADER.length + i] = src[i] ^ LUPIS_XOR_KEY;
    }
    return out.buffer;
  }

  static decodeLupisDataBuffer(buffer) {
    if (!buffer) return buffer;
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    if (!this.hasHeader(bytes, LUPIS_DATA_HEADER)) {
      return buffer instanceof ArrayBuffer ? buffer : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    }

    const payloadLength = bytes.length - LUPIS_DATA_HEADER.length;
    const decoded = new Uint8Array(payloadLength);
    for (let i = 0; i < payloadLength; i++) {
      decoded[i] = bytes[LUPIS_DATA_HEADER.length + i] ^ LUPIS_XOR_KEY;
    }
    return decoded.buffer;
  }

  static encodeObfuscatedCode(codeStr) {
    if (typeof codeStr !== 'string' || !codeStr) return '';
    const encoder = new TextEncoder();
    const bytes = encoder.encode(codeStr);
    const masked = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      masked[i] = bytes[i] ^ LUPIS_XOR_KEY;
    }
    let binary = '';
    for (let i = 0; i < masked.length; i++) {
      binary += String.fromCharCode(masked[i]);
    }
    return typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(masked).toString('base64');
  }

  static decodeObfuscatedCode(encodedStr) {
    if (typeof encodedStr !== 'string' || !encodedStr) return '';
    try {
      let masked;
      if (typeof atob === 'function') {
        const binary = atob(encodedStr);
        masked = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          masked[i] = binary.charCodeAt(i);
        }
      } else {
        masked = new Uint8Array(Buffer.from(encodedStr, 'base64'));
      }
      const unmasked = new Uint8Array(masked.length);
      for (let i = 0; i < masked.length; i++) {
        unmasked[i] = masked[i] ^ LUPIS_XOR_KEY;
      }
      return new TextDecoder('utf-8').decode(unmasked);
    } catch (err) {
      console.error('[LupisPackageHelper] Failed to decode obfuscated node code:', err);
      return '';
    }
  }

  static clearVirtualArchive() {
    this._virtualFiles.clear();
    this._activeArchiveBase = null;
  }

  static hasVirtualArchive() {
    return this._virtualFiles.size > 0;
  }

  static _normalizeVirtualKey(urlOrPath) {
    if (!urlOrPath) return '';
    let clean = String(urlOrPath).replace(/\\/g, '/');
    if (this._activeArchiveBase && clean.startsWith(this._activeArchiveBase)) {
      clean = clean.slice(this._activeArchiveBase.length);
    }
    clean = clean.replace(/^(\.\/|\/)+/, '');
    if (clean.startsWith('project/')) {
      clean = clean.slice('project/'.length);
    }
    if (clean.startsWith('data/')) {
      clean = clean.slice('data/'.length);
    }
    return clean;
  }

  static resolveAssetBaseUrl(baseURL = '') {
    if (!baseURL || typeof baseURL !== 'string') return '.';
    const clean = baseURL.replace(/\/$/, '');
    if (clean === './data' || clean === 'data') return '.';
    if (clean.endsWith('/data')) return clean.slice(0, -5) || '.';
    return clean;
  }

  static async _inflateRawBrowser(compressedBytes) {
    if (typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(compressedBytes);
      writer.close();
      const response = new Response(ds.readable);
      const ab = await response.arrayBuffer();
      return new Uint8Array(ab);
    }
    throw new Error('DecompressionStream is not supported in this environment.');
  }

  static async loadLupisProjectBuffer(arrayBuffer, baseAlias = './project') {
    const bytes = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);
    if (!this.hasHeader(bytes, LUPIS_PROJECT_HEADER)) {
      throw new Error('Invalid .lupisproject archive: missing LUPIS_PROJECT1 magic header.');
    }

    const zipBytes = new Uint8Array(bytes.length - LUPIS_PROJECT_HEADER.length);
    for (let i = 0; i < zipBytes.length; i++) {
      zipBytes[i] = bytes[LUPIS_PROJECT_HEADER.length + i] ^ LUPIS_XOR_KEY;
    }

    const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
    let eocdOffset = -1;
    for (let i = zipBytes.length - 22; i >= 0; i--) {
      if (view.getUint32(i, true) === 0x06054b50) {
        eocdOffset = i;
        break;
      }
    }
    if (eocdOffset === -1) {
      throw new Error('Invalid .lupisproject archive: ZIP End of Central Directory not found.');
    }

    const totalEntries = view.getUint16(eocdOffset + 10, true);
    let cdOffset = view.getUint32(eocdOffset + 16, true);
    const decoder = new TextDecoder('utf-8');

    this._virtualFiles.clear();
    this._activeArchiveBase = String(baseAlias || './project').replace(/\/$/, '');

    for (let i = 0; i < totalEntries; i++) {
      if (view.getUint32(cdOffset, true) !== 0x02014b50) break;

      const compressionMethod = view.getUint16(cdOffset + 10, true);
      const compressedSize = view.getUint32(cdOffset + 20, true);
      const fileNameLen = view.getUint16(cdOffset + 28, true);
      const extraLen = view.getUint16(cdOffset + 30, true);
      const commentLen = view.getUint16(cdOffset + 32, true);
      const localHeaderOffset = view.getUint32(cdOffset + 42, true);

      const fileNameBytes = zipBytes.subarray(cdOffset + 46, cdOffset + 46 + fileNameLen);
      const rawFileName = decoder.decode(fileNameBytes).replace(/\\/g, '/').replace(/^\/+/, '');

      cdOffset += 46 + fileNameLen + extraLen + commentLen;

      if (rawFileName.endsWith('/')) continue;

      const localFileNameLen = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + localFileNameLen + localExtraLen;
      const compressedSlice = zipBytes.subarray(dataStart, dataStart + compressedSize);

      let fileData;
      if (compressionMethod === 0) {
        fileData = new Uint8Array(compressedSlice);
      } else if (compressionMethod === 8) {
        fileData = await this._inflateRawBrowser(compressedSlice);
      } else {
        throw new Error(`Unsupported ZIP compression method: ${compressionMethod}`);
      }

      this._virtualFiles.set(rawFileName, fileData);
    }

    return this._virtualFiles;
  }

  static async tryLoadArchiveFromUrl(archiveUrl, baseAlias = './project') {
    try {
      const res = await fetch(archiveUrl);
      if (!res.ok) return false;
      const buf = await res.arrayBuffer();
      if (!this.isLupisProjectBuffer(buf)) return false;
      await this.loadLupisProjectBuffer(buf, baseAlias);
      return true;
    } catch {
      return false;
    }
  }

  static async fetchBuffer(url) {
    if (this.hasVirtualArchive()) {
      const key = this._normalizeVirtualKey(url);
      if (this._virtualFiles.has(key)) {
        const rawBytes = this._virtualFiles.get(key);
        return this.decodeLupisDataBuffer(rawBytes);
      }
      if ( !key.startsWith('assets/') && this._virtualFiles.has(`assets/${key}`) ) {
        const rawBytes = this._virtualFiles.get(`assets/${key}`);
        return this.decodeLupisDataBuffer(rawBytes);
      }
    }

    let res = await fetch(url);
    if (!res.ok) {
      const altUrls = [];
      if (url.includes('/data/assets/')) {
        altUrls.push(url.replace('/data/assets/', '/assets/'));
      } else if (url.includes('/project/assets/')) {
        altUrls.push(url.replace('/project/assets/', '/assets/'));
      } else if (url.startsWith('./assets/')) {
        altUrls.push(url.replace('./assets/', './data/assets/'));
        altUrls.push(url.replace('./assets/', './project/assets/'));
      }
      for (const altUrl of altUrls) {
        try {
          const altRes = await fetch(altUrl);
          if (altRes.ok) {
            res = altRes;
            break;
          }
        } catch {}
      }
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch asset buffer from ${url} (HTTP ${res.status})`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return this.decodeLupisDataBuffer(arrayBuffer);
  }

  static async fetchText(url) {
    const buffer = await this.fetchBuffer(url);
    return new TextDecoder('utf-8').decode(buffer);
  }

  static async fetchJson(url, fallbackValue = null) {
    try {
      const text = await this.fetchText(url);
      return JSON.parse(text);
    } catch {
      return fallbackValue;
    }
  }

  static async createDecodedBlobUrl(url, mimeType = 'application/octet-stream') {
    const decodedBuffer = await this.fetchBuffer(url);
    const blob = new Blob([decodedBuffer], { type: mimeType });
    return URL.createObjectURL(blob);
  }
}

__exports.default = LupisPackageHelper;

__exports.LupisPackageHelper = LupisPackageHelper;
__exports.LUPIS_PROJECT_HEADER = LUPIS_PROJECT_HEADER;
__exports.LUPIS_DATA_HEADER = LUPIS_DATA_HEADER;
__exports.LUPIS_XOR_KEY = LUPIS_XOR_KEY;
};

// === Standalone Bootstrapper ===
(function() {
  globalThis.__LUPIS_BUILD_MODE__ = "development";
  globalThis.__LUPIS_ENV__ = {
    DEV: true,
    MODE: "development"
  };
  

  const __reg = globalThis.__LUPIS_REGISTRY__ = globalThis.__LUPIS_REGISTRY__ || { m: {}, c: {} };
  function __lupisRequire(id) {
    if (__reg.c[id]) return __reg.c[id].exports;
    const factory = __reg.m[id];
    if (!factory) {
      throw new Error("Module not found in Lupis registry: " + id);
    }
    const mod = __reg.c[id] = { id, exports: {} };
    Object.defineProperty(mod.exports, "__esModule", { value: true });
    factory(__lupisRequire, mod.exports, mod);
    return mod.exports;
  }
  __reg.r = __lupisRequire;

  function bootStandaloneGame() {
    const runtimeMod = __lupisRequire("Runtime.js");
    const startEngine = runtimeMod.startEngine || (runtimeMod.default && runtimeMod.default.startEngine);
    globalThis.LupisEngine = { startEngine, require: __lupisRequire };

    const loadingEl = document.getElementById("loading");
    const loadingProgressEl = document.getElementById("loading-progress");
    const loadingPercentEl = document.getElementById("loading-percent");
    const canvasEl = document.getElementById("lp_canvas_preview");
    if (!canvasEl || typeof startEngine !== "function") return;

    let windowState = { isMaximized: false, isFullScreen: false };
    if (window.electronAPI && typeof window.electronAPI.onWindowStateChange === "function") {
      window.electronAPI.onWindowStateChange((state) => {
        windowState = state || { isMaximized: false, isFullScreen: false };
        if (canvasEl && canvasEl._currentResizeHandler) canvasEl._currentResizeHandler();
      });
    }
    if (window.electronAPI && typeof window.electronAPI.getWindowState === "function") {
      window.electronAPI.getWindowState().then((state) => {
        if (state) {
          windowState = state;
          if (canvasEl && canvasEl._currentResizeHandler) canvasEl._currentResizeHandler();
        }
      }).catch(() => {});
    }

    function setupCanvasResponsiveness(refWidth, refHeight) {
      const targetW = Number(refWidth) || 1920;
      const targetH = Number(refHeight) || 1080;
      canvasEl.width = targetW;
      canvasEl.height = targetH;
      const targetRatio = targetW / targetH;

      const isElectron = typeof window !== "undefined" && Boolean(window.electronAPI);

      if (isElectron && typeof window.electronAPI.setAspectRatio === "function") {
        window.electronAPI.setAspectRatio(targetW, targetH);
      }

      const onResize = () => {
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        if (!winW || !winH) return;

        const isFullscreen = Boolean(
          document.fullscreenElement ||
          windowState.isFullScreen ||
          (window.innerWidth >= screen.width && window.innerHeight >= screen.height)
        );
        const isMaximized = Boolean(windowState.isMaximized);

        // Desktop App (Electron):
        // In normal windowed mode: ALWAYS fill 100% of the window viewport.
        // Proportional aspect ratio is enforced directly on the Electron window frame,
        // eliminating any margin, padding, or black gaps outside the canvas.
        if (isElectron && !isFullscreen && !isMaximized) {
          canvasEl.style.width = "100%";
          canvasEl.style.height = "100%";
          return;
        }

        // Web Standalone (and maximized/fullscreen Desktop App):
        // Always preserve aspect ratio with clean letterboxing/pillarboxing (black bars)
        // so the canvas never becomes stretched or elongated (lonjong).
        const winRatio = winW / winH;
        let finalW, finalH;
        if (winRatio > targetRatio) {
          finalH = winH;
          finalW = finalH * targetRatio;
        } else {
          finalW = winW;
          finalH = finalW / targetRatio;
        }
        canvasEl.style.width = Math.round(finalW) + "px";
        canvasEl.style.height = Math.round(finalH) + "px";
      };

      if (!canvasEl._hasResizeListener) {
        window.addEventListener("resize", () => {
          if (canvasEl._currentResizeHandler) canvasEl._currentResizeHandler();
        });
        canvasEl._hasResizeListener = true;
      }
      canvasEl._currentResizeHandler = onResize;
      onResize();
    }

    async function initStandalone() {
      try {
        if (loadingEl) loadingEl.classList.remove("hidden");
        if (loadingProgressEl) loadingProgressEl.style.width = "0%";
        if (loadingPercentEl) loadingPercentEl.innerText = "0%";

        let initialWidth = (globalThis.__LUPIS_CANVAS_CONFIG__ && globalThis.__LUPIS_CANVAS_CONFIG__.width) || 1920;
        let initialHeight = (globalThis.__LUPIS_CANVAS_CONFIG__ && globalThis.__LUPIS_CANVAS_CONFIG__.height) || 1080;

        if (!globalThis.__LUPIS_CANVAS_CONFIG__) {
          try {
            const resp = await fetch("./build-info.json");
            if (resp.ok) {
              const info = await resp.json();
              if (info && info.canvasWidth && info.canvasHeight) {
                initialWidth = Number(info.canvasWidth);
                initialHeight = Number(info.canvasHeight);
              }
            }
          } catch {}
        }

        setupCanvasResponsiveness(initialWidth, initialHeight);

        const engineResult = await startEngine(
          canvasEl,
          "./data",
          {},
          "runtime",
          (message, percent) => {
            const clamped = Math.max(0, Math.min(100, Math.round(percent || 0)));
            if (loadingProgressEl) {
              loadingProgressEl.style.width = clamped + "%";
            }
            if (loadingPercentEl) {
              loadingPercentEl.innerText = clamped + "%";
            }
          }
        );

        if (engineResult && engineResult.game && engineResult.game.world && engineResult.game.world.settings) {
          const ui = engineResult.game.world.settings.ui;
          if (ui && ui.width && ui.height && (Number(ui.width) !== canvasEl.width || Number(ui.height) !== canvasEl.height)) {
            setupCanvasResponsiveness(Number(ui.width), Number(ui.height));
          }
        }

        if (loadingProgressEl) loadingProgressEl.style.width = "100%";
        if (loadingPercentEl) loadingPercentEl.innerText = "100%";
        if (loadingEl) loadingEl.classList.add("hidden");
        canvasEl.focus();
      } catch (error) {
        console.error("[Standalone] Error starting game:", error);
        if (loadingEl) {
          loadingEl.classList.remove("hidden");
          const spinner = loadingEl.querySelector(".spinner");
          if (spinner) spinner.style.display = "none";
          const barWrapper = loadingEl.querySelector(".loading-bar-wrapper");
          if (barWrapper) barWrapper.style.display = "none";
          if (loadingPercentEl) loadingPercentEl.style.display = "none";
          let errorEl = document.getElementById("loading-error");
          if (!errorEl) {
            errorEl = document.createElement("div");
            errorEl.id = "loading-error";
            loadingEl.appendChild(errorEl);
          }
          errorEl.innerHTML =
            '<div style="color: #ef4444; font-size: 16px; font-weight: bold; margin-bottom: 8px;">Game Launch Failed</div>' +
            '<div style="color: #94a3b8; font-size: 12px; max-width: 480px; word-break: break-word;">' +
            (error && error.message ? error.message : String(error)) +
            "</div>";
        }
      }
    }

    initStandalone();
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bootStandaloneGame);
    } else {
      bootStandaloneGame();
    }
  }
})();

})();
//# sourceMappingURL=lupis.loader.js.map
