import SceneLoader from "../Loader/SceneLoader.js";
import Config from "../Core/Config.js";

export default class SceneSystem {
    constructor(game) {
        this.game = game;
        
        this._sceneDataCache = []; 
        this._currentSceneData = null; 
        this._pendingSceneLoad = null;
        this._initialSceneId = null;
        this._persistentLayers = new Map();
    }

    setInitialSceneId(sceneId) {
        this._initialSceneId = sceneId;
    }

    setSceneCache(scenesArray, initialSceneId = null) {
        if (Array.isArray(scenesArray)) {
            this._sceneDataCache = scenesArray;
        }
        if (initialSceneId) {
            this._initialSceneId = initialSceneId;
        }
    }

    getAvailableScenes() {
        return this._sceneDataCache.map(s => ({
            id: s.id,
            scriptId: s.scriptId || s.id
        }));
    }

    getCurrentScene() {
        return this._currentSceneData;
    }

    getCurrentSceneScriptId() {
        return this._currentSceneData?.scriptId || this.game.world.currentSceneScriptId || "";
    }

    getCurrentSceneName() {
        return this.getCurrentSceneScriptId();
    }

    getCurrentSceneId() {
        return this._currentSceneData?.id || this.game.world.currentSceneId || null;
    }

    queueLoadScene(sceneIdentifier) {
        this._pendingSceneLoad = sceneIdentifier;
    }

    loadInitialScene() {
        if (this._persistentLayers) {
            this._persistentLayers.clear();
        }

        if (!this._sceneDataCache || this._sceneDataCache.length === 0) {
            console.warn("[SceneSystem] Cannot restart: Scene cache is empty.");
            return;
        }

        // Prioritize _initialSceneId, fallback to first scene if not found
        const targetScene = this._sceneDataCache.find(s => s.id === this._initialSceneId) || this._sceneDataCache[0];

        if (targetScene) {
            this.queueLoadScene(targetScene.id);
        }
    }

    loadScene(sceneIdentifier) {
        if (!this._sceneDataCache || this._sceneDataCache.length === 0) {
            console.warn("[SceneSystem] Cannot load scene: Scene cache is empty.");
            return;
        }

        const searchKey = String(sceneIdentifier).trim().toLowerCase();

        const rawSceneData = this._sceneDataCache.find(s =>
            (s.scriptId && s.scriptId.trim().toLowerCase() === searchKey) ||
            (s.id === sceneIdentifier)
        );

        if (!rawSceneData) {
            console.error(`[SceneSystem] Failed to load: Scene '${sceneIdentifier}' not found.`);
            return;
        }

        this._syncPersistentLayersFromWorld();

        const targetSceneData = JSON.parse(JSON.stringify(rawSceneData));
        this._currentSceneData = targetSceneData;

        this.game.pauseGame();

        if (this.game.camera) {
            this.game.camera.clearTarget();
            this.game.camera.snapTo(0, 0);
        }

        if (this.game.cameraController) {
            this.game.cameraController.enabled = false;
        }

        const world = this.game.world;
        world.entities = [];
        world.layersWorld = [];
        world.layersUI = [];

        if (world.scriptIdMap) {
            world.scriptIdMap.clear();
        }

        if (this.game.scriptSystem && typeof this.game.scriptSystem.clear === 'function') {
            this.game.scriptSystem.clear();
        }

        world.currentSceneId = targetSceneData.id;
        world.currentSceneScriptId = targetSceneData.scriptId || targetSceneData.id || null;

        const sceneLoader = new SceneLoader(world, Config.ENGINE_MODE);
        sceneLoader.loadScene(targetSceneData);

        const rw = world.settings.ui?.width || 1920;
        const rh = world.settings.ui?.height || 1080;

        if (this.game.camera) {
            if (Config.ENGINE_MODE === "runtime") {
                const camSettings = world.settings?.camera;
                const camX = (camSettings?.x !== undefined && camSettings?.x !== null && !isNaN(camSettings.x))
                    ? Number(camSettings.x)
                    : rw / 2;
                const camY = (camSettings?.y !== undefined && camSettings?.y !== null && !isNaN(camSettings.y))
                    ? Number(camSettings.y)
                    : rh / 2;
                this.game.camera.snapTo(camX, camY);

                const camZoom = camSettings?.zoom;
                this.game.camera.scale = (typeof camZoom === 'number' && !isNaN(camZoom) && camZoom > 0)
                    ? Number(camZoom)
                    : 1;

                const camLerp = camSettings?.lerp;
                if (typeof camLerp === 'number' && !isNaN(camLerp)) {
                    const clampedLerp = Math.max(0, Math.min(1, Number(camLerp)));
                    this.game.camera.lerp = clampedLerp;
                    this.game.camera.defaultLerp = clampedLerp;
                }
            } else {
                this.game.camera.snapTo(rw / 2, rh / 2);
                this.game.camera.scale = 0.5;
            }
        }

        if (this.game.cameraController) {
            this.game.cameraController.enabled = true;
        }

        if (Config.ENGINE_MODE === "runtime") {
            this._initializeEntityScripts();
            this.game.scriptSystem.startAll();
            this.game.audioSystem.handleSceneTransition(world.entities);
            this.game.audioSystem.startSceneAutoplay(world);

            if (this.game.loop) {
                this.game.loop.isFirstFrame = true;
            }

            const activeSceneScriptId = this.getCurrentSceneScriptId();
            this.game.events.emit('scene:start', activeSceneScriptId);
        }

        this.game.resumeGame();
    }

    restartScene() {
        const currentId = this.getCurrentSceneId();
        if (currentId) {
            this.queueLoadScene(currentId);
        } else {
            console.warn("[SceneSystem] Cannot restart: Active scene ID not found.");
        }
    }

    update(dt) {
        if (this._pendingSceneLoad !== null) {
            const nextScene = this._pendingSceneLoad;
            this._pendingSceneLoad = null;
            this.loadScene(nextScene);
        }
    }

    _initializeEntityScripts() {
        this.game.world.entities.forEach(entity => {
            const controller = entity.components?.ScriptController;
            if (!Array.isArray(controller?.data)) return;

            controller.data.forEach(instance => {
                const asset = this.game.world.scripts[instance.assetId];
                if (asset) {
                    const instanceVars = instance.variables || {};
                    const mergedVars = asset.variables.map(v => ({
                        ...v,
                        defaultValue: instanceVars[v.id] !== undefined ? instanceVars[v.id] : v.defaultValue
                    }));

                    this.game.scriptSystem.add({
                        ...asset,
                        variables: mergedVars
                    }, entity);
                }
            });
        });
    }

    injectLayer(sourceSceneIdentifier, layerIdentifier, inheritState = true, targetLayerIdentifier = "") {
        if (!this._sceneDataCache || this._sceneDataCache.length === 0) {
            console.warn("[SceneSystem] Cannot inject layer: Scene cache is empty.");
            return { success: false, isFirstLoad: false };
        }

        const world = this.game.world;
        if (!world) {
            return { success: false, isFirstLoad: false };
        }

        const searchSceneKey = String(sourceSceneIdentifier || '').trim().toLowerCase();
        let sourceScene = this._sceneDataCache.find(s => 
            (s.scriptId && s.scriptId.trim().toLowerCase() === searchSceneKey) ||
            (s.id === sourceSceneIdentifier)
        );

        const searchLayerKey = String(layerIdentifier || '').trim().toLowerCase();
        let sourceLayer = null;
        if (sourceScene) {
            const allSourceLayers = [...(sourceScene.layersUI || []), ...(sourceScene.layersWorld || [])];
            sourceLayer = allSourceLayers.find(l => 
                (l.scriptId && l.scriptId.trim().toLowerCase() === searchLayerKey) ||
                (l.id === layerIdentifier)
            );
        }

        let targetLayer = null;
        let entitiesToMount = [];
        let isFirstLoad = false;
        let cached = null;

        if (inheritState && this._persistentLayers) {
            // 1. Try exact composite keys
            if (sourceScene) {
                const sId = sourceScene.id || sourceScene.scriptId;
                const lId = sourceLayer ? (sourceLayer.id || sourceLayer.scriptId) : layerIdentifier;
                const candidateKeys = [
                    `${sId}_${lId}`,
                    `${sourceScene.scriptId || ''}_${searchLayerKey}`.toLowerCase(),
                    `${sourceScene.id || ''}_${searchLayerKey}`.toLowerCase()
                ];
                for (const k of candidateKeys) {
                    if (this._persistentLayers.has(k)) {
                        cached = this._persistentLayers.get(k);
                        break;
                    }
                }
            }

            // 2. Try layer-specific key
            if (!cached && this._persistentLayers.has(`layer_${searchLayerKey}`)) {
                cached = this._persistentLayers.get(`layer_${searchLayerKey}`);
            }

            // 3. Fallback: Search all persistent layers for a match by layer scriptId or ID
            if (!cached) {
                for (const p of this._persistentLayers.values()) {
                    if (p && p.layer) {
                        const pScriptId = (p.layer.scriptId || '').toLowerCase();
                        if (pScriptId === searchLayerKey || p.layer.id === layerIdentifier) {
                            cached = p;
                            break;
                        }
                    }
                }
            }
        }

        if (cached && inheritState) {
            targetLayer = cached.layer;
            entitiesToMount = cached.entities || [];
            isFirstLoad = false;
        } else {
            // Need sourceScene & sourceLayer to instantiate fresh from template
            if (!sourceScene) {
                console.warn(`[SceneSystem] Failed to inject layer: Scene '${sourceSceneIdentifier}' not found.`);
                return { success: false, isFirstLoad: false };
            }
            if (!sourceLayer) {
                console.warn(`[SceneSystem] Failed to inject layer: Layer '${layerIdentifier}' not found in scene '${sourceSceneIdentifier}'.`);
                return { success: false, isFirstLoad: false };
            }

            targetLayer = {
                id: sourceLayer.id,
                scriptId: sourceLayer.scriptId,
                visible: sourceLayer.visible !== false,
                locked: Boolean(sourceLayer.locked),
                active: sourceLayer.active !== false,
                opacity: Number(sourceLayer.opacity !== undefined ? sourceLayer.opacity : 1.0),
                zIndex: Number(sourceLayer.zIndex ?? 0),
                orderIndex: Number(sourceLayer.orderIndex ?? 0),
                freezeInput: Boolean(sourceLayer.freezeInput ?? false),
                freezeInputType: sourceLayer.freezeInputType || 'all',
                entities: []
            };

            const entitiesData = (sourceScene.entities || []).filter(e => e.layerId === sourceLayer.id);
            const sceneLoader = new SceneLoader(world, Config.ENGINE_MODE);
            const createdEntities = [];
            const createdMap = new Map();

            for (const eData of entitiesData) {
                const entity = sceneLoader._createEntityInstance(JSON.parse(JSON.stringify(eData)));
                if (entity) {
                    createdEntities.push(entity);
                    createdMap.set(entity.id, entity);
                }
            }

            for (const entity of createdEntities) {
                if (!entity.parentId) continue;
                const parent = createdMap.get(entity.parentId);
                if (parent) {
                    parent.addChild(entity);
                } else {
                    entity.parentId = null;
                }
            }

            entitiesToMount = createdEntities;
            isFirstLoad = true;
        }

        if (sourceScene && Array.isArray(sourceScene.entities)) {
            for (const entity of entitiesToMount) {
                const template = sourceScene.entities.find(e => 
                    e.id === entity.id || (e.scriptId && entity.scriptId && e.scriptId === entity.scriptId)
                );
                if (template && template.components) {
                    if (template.components.UITransform && entity.components?.UITransform) {
                        const ut = entity.components.UITransform;
                        const tUt = template.components.UITransform;
                        if (typeof ut._baseWidth !== 'number' && typeof tUt.width === 'number') ut._baseWidth = tUt.width;
                        if (typeof ut._baseHeight !== 'number' && typeof tUt.height === 'number') ut._baseHeight = tUt.height;
                        if (typeof ut._baseX !== 'number' && typeof tUt.x === 'number') ut._baseX = tUt.x;
                        if (typeof ut._baseY !== 'number' && typeof tUt.y === 'number') ut._baseY = tUt.y;
                    }
                    if (template.components.SpriteRenderer && entity.components?.SpriteRenderer) {
                        const sr = entity.components.SpriteRenderer;
                        const tSr = template.components.SpriteRenderer;
                        if (typeof sr._baseSourceWidth !== 'number' && typeof tSr.sourceWidth === 'number') sr._baseSourceWidth = tSr.sourceWidth;
                        if (typeof sr._baseSourceHeight !== 'number' && typeof tSr.sourceHeight === 'number') sr._baseSourceHeight = tSr.sourceHeight;
                        if (typeof sr._baseSourceX !== 'number' && typeof tSr.sourceX === 'number') sr._baseSourceX = tSr.sourceX;
                        if (typeof sr._baseSourceY !== 'number' && typeof tSr.sourceY === 'number') sr._baseSourceY = tSr.sourceY;
                    }
                    if (template.components.ShapeRenderer && entity.components?.ShapeRenderer) {
                        const sh = entity.components.ShapeRenderer;
                        const tSh = template.components.ShapeRenderer;
                        if (typeof sh._baseWidth !== 'number' && typeof tSh.width === 'number') sh._baseWidth = tSh.width;
                        if (typeof sh._baseHeight !== 'number' && typeof tSh.height === 'number') sh._baseHeight = tSh.height;
                    }
                }
            }
        }

        // Store/update in _persistentLayers
        if (!this._persistentLayers) {
            this._persistentLayers = new Map();
        }
        const persistentRecord = {
            layer: targetLayer,
            entities: entitiesToMount
        };

        if (sourceScene) {
            const sId = sourceScene.id || sourceScene.scriptId;
            const lId = sourceLayer ? (sourceLayer.id || sourceLayer.scriptId) : (targetLayer.id || targetLayer.scriptId);
            this._persistentLayers.set(`${sId}_${lId}`, persistentRecord);
            if (targetLayer.scriptId) {
                this._persistentLayers.set(`${sId}_${targetLayer.scriptId.toLowerCase()}`, persistentRecord);
                if (sourceScene.scriptId) {
                    this._persistentLayers.set(`${sourceScene.scriptId.toLowerCase()}_${targetLayer.scriptId.toLowerCase()}`, persistentRecord);
                }
            }
        }
        if (targetLayer.scriptId) {
            this._persistentLayers.set(`layer_${targetLayer.scriptId.toLowerCase()}`, persistentRecord);
        }

        const isUI = (sourceScene && (sourceScene.layersUI || []).some(l => l.id === (sourceLayer ? sourceLayer.id : targetLayer.id))) ||
                     (targetLayer.scriptId && targetLayer.scriptId.toLowerCase().includes('ui')) ||
                     targetLayer.section === 'ui';
        const targetCollection = isUI ? world.layersUI : world.layersWorld;

        const destScriptId = (targetLayerIdentifier && String(targetLayerIdentifier).trim())
            ? String(targetLayerIdentifier).trim()
            : (targetLayer.scriptId || (sourceLayer && sourceLayer.scriptId) || (sourceLayer && sourceLayer.id) || targetLayer.id);

        const destKey = destScriptId.toLowerCase();
        const existingLayerIndex = targetCollection.findIndex(l => 
            (l.scriptId && l.scriptId.toLowerCase() === destKey) ||
            l.id === targetLayer.id
        );

        if (existingLayerIndex === -1) {
            targetLayer.scriptId = destScriptId;
            targetLayer.entities = [];
            targetCollection.push(targetLayer);
        } else {
            const existing = targetCollection[existingLayerIndex];
            existing.active = targetLayer.active;
            existing.visible = targetLayer.visible;
            existing.locked = targetLayer.locked;
            existing.opacity = targetLayer.opacity;
            existing.zIndex = targetLayer.zIndex;
            existing.orderIndex = targetLayer.orderIndex;
            existing.freezeInput = targetLayer.freezeInput;
            existing.freezeInputType = targetLayer.freezeInputType;
            existing.entities = [];
            targetLayer = existing;
            persistentRecord.layer = targetLayer;
        }

        for (const entity of entitiesToMount) {
            entity.layerId = targetLayer.id;
            const alreadyInWorld = world.entities.some(e => e.id === entity.id);
            if (!alreadyInWorld) {
                world.addEntity(entity);
                if (world.scriptIdMap && entity.scriptId) {
                    world.scriptIdMap.set(entity.scriptId, entity);
                }
            }
        }

        if (targetLayer.entities && targetLayer.entities.length > 0) {
            targetLayer.entities.sort((a, b) => {
                if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
                return a.orderIndex - b.orderIndex;
            });
        }

        if (Config.ENGINE_MODE === "runtime") {
            this._initializeInjectedScripts(entitiesToMount, true);
        }

        return { success: true, isFirstLoad };
    }

    _syncPersistentLayersFromWorld() {
        if (!this.game?.world) return;
        if (!this._persistentLayers) {
            this._persistentLayers = new Map();
        }

        const allWorldLayers = this.game.world.allLayers || [];
        const allEntities = this.game.world.entities || [];
        const currentSceneId = this.getCurrentSceneId();
        const currentSceneScriptId = this.getCurrentSceneScriptId();

        // 1. Sync live property changes and entities for already-registered persistent layers
        for (const [cacheKey, persistent] of this._persistentLayers.entries()) {
            if (!persistent || !persistent.layer) continue;
            const liveLayer = allWorldLayers.find(l => 
                l.id === persistent.layer.id || 
                (l.scriptId && persistent.layer.scriptId && l.scriptId.toLowerCase() === persistent.layer.scriptId.toLowerCase())
            );

            if (liveLayer) {
                persistent.layer.active = liveLayer.active;
                persistent.layer.visible = liveLayer.visible;
                persistent.layer.locked = liveLayer.locked;
                persistent.layer.opacity = liveLayer.opacity;
                persistent.layer.zIndex = liveLayer.zIndex;
                persistent.layer.orderIndex = liveLayer.orderIndex;
                persistent.layer.freezeInput = liveLayer.freezeInput;
                persistent.layer.freezeInputType = liveLayer.freezeInputType;

                const liveEntities = allEntities.filter(e => e.layerId === liveLayer.id);
                if (liveEntities.length > 0) {
                    persistent.entities = liveEntities;
                }
            }
        }

        // 2. Also capture native layers of the leaving scene that are not yet tracked
        const currentSceneData = this._currentSceneData;
        const currentSceneNativeLayers = [
            ...(currentSceneData?.layersUI || []),
            ...(currentSceneData?.layersWorld || [])
        ];

        for (const liveLayer of allWorldLayers) {
            const layerScriptId = (liveLayer.scriptId || '').toLowerCase();
            const isAlreadyTracked = Array.from(this._persistentLayers.values()).some(p => 
                p && p.layer && (p.layer.id === liveLayer.id || (p.layer.scriptId && p.layer.scriptId.toLowerCase() === layerScriptId))
            );
            if (isAlreadyTracked) continue;

            const isNativeToScene = currentSceneNativeLayers.some(nl => 
                nl.id === liveLayer.id || (nl.scriptId && nl.scriptId.toLowerCase() === layerScriptId)
            );
            if (!isNativeToScene) continue;

            const layerEntities = allEntities.filter(e => e.layerId === liveLayer.id);
            const persistentLayer = {
                id: liveLayer.id,
                scriptId: liveLayer.scriptId,
                section: liveLayer.section,
                visible: liveLayer.visible,
                locked: liveLayer.locked,
                active: liveLayer.active,
                opacity: liveLayer.opacity,
                zIndex: liveLayer.zIndex,
                orderIndex: liveLayer.orderIndex,
                freezeInput: liveLayer.freezeInput,
                freezeInputType: liveLayer.freezeInputType,
                entities: []
            };

            const record = {
                layer: persistentLayer,
                entities: layerEntities
            };

            if (currentSceneId) {
                this._persistentLayers.set(`${currentSceneId}_${liveLayer.id}`, record);
                if (liveLayer.scriptId) {
                    this._persistentLayers.set(`${currentSceneId}_${layerScriptId}`, record);
                }
            }
            if (currentSceneScriptId) {
                this._persistentLayers.set(`${currentSceneScriptId.toLowerCase()}_${liveLayer.id}`, record);
                if (liveLayer.scriptId) {
                    this._persistentLayers.set(`${currentSceneScriptId.toLowerCase()}_${layerScriptId}`, record);
                }
            }
            if (liveLayer.scriptId) {
                this._persistentLayers.set(`layer_${layerScriptId}`, record);
            }
        }
    }

    _initializeInjectedScripts(entities, startImmediately = true) {
        if (!this.game?.scriptSystem || !this.game?.world?.scripts) return;
        const newRunners = [];

        entities.forEach(entity => {
            if (this.game.scriptSystem.runners && this.game.scriptSystem.runners.some(r => r.owner === entity)) {
                return;
            }

            const controller = entity.components?.ScriptController;
            if (!Array.isArray(controller?.data)) return;

            controller.data.forEach(instance => {
                const asset = this.game.world.scripts[instance.assetId];
                if (asset) {
                    const instanceVars = instance.variables || {};
                    const mergedVars = (asset.variables || []).map(v => ({
                        ...v,
                        defaultValue: instanceVars[v.id] !== undefined ? instanceVars[v.id] : v.defaultValue
                    }));

                    const runner = this.game.scriptSystem.add({
                        ...asset,
                        variables: mergedVars
                    }, entity);

                    if (runner) {
                        newRunners.push(runner);
                    }
                }
            });
        });

        if (startImmediately && newRunners.length > 0) {
            newRunners.forEach(r => {
                if (typeof r.start === 'function') {
                    r.start();
                }
            });
        }
    }

    clearPersistentLayers(cacheKey = null) {
        if (!this._persistentLayers) return;
        if (cacheKey) {
            this._persistentLayers.delete(cacheKey);
        } else {
            this._persistentLayers.clear();
        }
    }
}