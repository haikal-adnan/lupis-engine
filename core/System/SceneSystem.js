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

    injectLayer(sourceSceneIdentifier, layerIdentifier = null, inheritState = true, targetLayerIdentifier = "self", targetSceneIdentifier = "self") {
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

        const isLayerIdProvided = layerIdentifier !== null && layerIdentifier !== undefined && String(layerIdentifier).trim() !== '' && String(layerIdentifier).trim() !== 'null';
        const searchLayerKey = isLayerIdProvided ? String(layerIdentifier).trim().toLowerCase() : null;

        let sourceLayer = null;
        if (sourceScene) {
            const allSourceLayers = [...(sourceScene.layersUI || []), ...(sourceScene.layersWorld || [])];
            if (searchLayerKey) {
                sourceLayer = allSourceLayers.find(l => 
                    (l.scriptId && l.scriptId.trim().toLowerCase() === searchLayerKey) ||
                    (l.id === layerIdentifier)
                );
            } else {
                if (targetLayerIdentifier && targetLayerIdentifier !== 'self' && targetLayerIdentifier !== '') {
                    const targetKey = String(targetLayerIdentifier).trim().toLowerCase();
                    sourceLayer = allSourceLayers.find(l =>
                        (l.scriptId && l.scriptId.trim().toLowerCase() === targetKey) ||
                        (l.id === targetLayerIdentifier)
                    );
                }
                if (!sourceLayer && allSourceLayers.length > 0) {
                    sourceLayer = allSourceLayers[0];
                }
            }
        }

        let targetLayer = null;
        let entitiesToMount = [];
        let isFirstLoad = false;
        let cached = null;

        if (inheritState && this._persistentLayers) {
            // 1. Try exact composite keys
            if (sourceScene) {
                const sId = sourceScene.id || sourceScene.scriptId;
                const lId = sourceLayer ? (sourceLayer.id || sourceLayer.scriptId) : (searchLayerKey || layerIdentifier || 'default');
                const candidateKeys = [
                    `${sId}_${lId}`,
                    searchLayerKey ? `${sourceScene.scriptId || ''}_${searchLayerKey}`.toLowerCase() : null,
                    searchLayerKey ? `${sourceScene.id || ''}_${searchLayerKey}`.toLowerCase() : null,
                    sourceLayer?.scriptId ? `${sourceScene.scriptId || ''}_${sourceLayer.scriptId}`.toLowerCase() : null,
                    sourceLayer?.id ? `${sourceScene.id || ''}_${sourceLayer.id}`.toLowerCase() : null
                ].filter(Boolean);
                for (const k of candidateKeys) {
                    if (this._persistentLayers.has(k)) {
                        cached = this._persistentLayers.get(k);
                        break;
                    }
                }
            }

            // 2. Try layer-specific key
            const lKey = searchLayerKey || (sourceLayer?.scriptId ? sourceLayer.scriptId.toLowerCase() : null);
            if (!cached && lKey && this._persistentLayers.has(`layer_${lKey}`)) {
                cached = this._persistentLayers.get(`layer_${lKey}`);
            }

            // 3. Fallback: Search all persistent layers for a match by layer scriptId or ID
            if (!cached) {
                for (const p of this._persistentLayers.values()) {
                    if (p && p.layer) {
                        const pScriptId = (p.layer.scriptId || '').toLowerCase();
                        if ((searchLayerKey && pScriptId === searchLayerKey) || (layerIdentifier && p.layer.id === layerIdentifier) || (sourceLayer && (pScriptId === (sourceLayer.scriptId || '').toLowerCase() || p.layer.id === sourceLayer.id))) {
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

        const isTargetSceneSelf = !targetSceneIdentifier || String(targetSceneIdentifier).trim() === '' || String(targetSceneIdentifier).trim().toLowerCase() === 'self';
        let targetSceneObj = null;
        if (!isTargetSceneSelf) {
            const searchTargetKey = String(targetSceneIdentifier).trim().toLowerCase();
            const currentSceneId = String(this.getCurrentSceneId() || '').toLowerCase();
            const currentSceneScriptId = String(this.getCurrentSceneScriptId() || '').toLowerCase();
            if (searchTargetKey !== currentSceneId && searchTargetKey !== currentSceneScriptId) {
                targetSceneObj = this._sceneDataCache.find(s =>
                    (s.scriptId && s.scriptId.trim().toLowerCase() === searchTargetKey) ||
                    (s.id === targetSceneIdentifier)
                );
            }
        }

        const isTargetLayerSelf = !targetLayerIdentifier || String(targetLayerIdentifier).trim() === '' || String(targetLayerIdentifier).trim().toLowerCase() === 'self';
        const destScriptId = (!isTargetLayerSelf)
            ? String(targetLayerIdentifier).trim()
            : (targetLayer.scriptId || (sourceLayer && sourceLayer.scriptId) || (sourceLayer && sourceLayer.id) || targetLayer.id);

        const destKey = destScriptId.toLowerCase();

        const isUI = (world && Array.isArray(world.layersUI) && world.layersUI.some(l => 
                         (l.scriptId && l.scriptId.toLowerCase() === destKey) || 
                         (l.id && l.id.toLowerCase() === destKey) ||
                         l.id === targetLayerIdentifier
                     )) ||
                     (sourceScene && Array.isArray(sourceScene.layersUI) && sourceScene.layersUI.some(l => 
                         l.id === (sourceLayer ? sourceLayer.id : targetLayer.id) || 
                         (sourceLayer && l.scriptId && sourceLayer.scriptId && l.scriptId.toLowerCase() === sourceLayer.scriptId.toLowerCase())
                     )) ||
                     (entitiesToMount && entitiesToMount.some(e => e.type === 'ui' || e.type === 'ui_entity' || Boolean(e.components && e.components.UITransform))) ||
                     (targetLayer.scriptId && targetLayer.scriptId.toLowerCase().includes('ui')) ||
                     targetLayer.section === 'ui';

        if (targetSceneObj) {
            const destTargetCollection = isUI ? (targetSceneObj.layersUI = targetSceneObj.layersUI || []) : (targetSceneObj.layersWorld = targetSceneObj.layersWorld || []);
            const existingIdx = destTargetCollection.findIndex(l =>
                (l.scriptId && l.scriptId.toLowerCase() === destKey) || 
                (l.id && l.id.toLowerCase() === destKey) ||
                l.id === targetLayer.id
            );
            if (existingIdx === -1) {
                targetLayer.scriptId = destScriptId;
                targetLayer.entities = targetLayer.entities || [];
                destTargetCollection.push(targetLayer);
            } else {
                const existing = destTargetCollection[existingIdx];
                if (!isTargetLayerSelf) {
                    targetLayer.zIndex = (existing.zIndex !== undefined && existing.zIndex !== null) ? existing.zIndex : targetLayer.zIndex;
                    targetLayer.orderIndex = (existing.orderIndex !== undefined && existing.orderIndex !== null) ? existing.orderIndex : targetLayer.orderIndex;
                } else {
                    targetLayer.zIndex = Math.max(Number(existing.zIndex ?? 0), Number(targetLayer.zIndex ?? 0));
                    targetLayer.orderIndex = Math.max(Number(existing.orderIndex ?? 0), Number(targetLayer.orderIndex ?? 0));
                }
                destTargetCollection[existingIdx] = targetLayer;
            }
            if (!targetSceneObj.entities) targetSceneObj.entities = [];
            for (const entity of entitiesToMount) {
                entity.layerId = targetLayer.id;
                if (!targetSceneObj.entities.some(e => e.id === entity.id)) {
                    targetSceneObj.entities.push(entity);
                }
            }
            return { success: true, isFirstLoad };
        }

        const targetCollection = isUI ? world.layersUI : world.layersWorld;

        const existingLayerIndex = targetCollection.findIndex(l => 
            (l.scriptId && l.scriptId.toLowerCase() === destKey) ||
            (l.id && l.id.toLowerCase() === destKey) ||
            l.id === targetLayer.id
        );

        if (existingLayerIndex === -1) {
            targetLayer.scriptId = destScriptId;
            targetLayer.entities = targetLayer.entities || [];
            targetCollection.push(targetLayer);
        } else {
            const existing = targetCollection[existingLayerIndex];
            if (!isTargetLayerSelf) {
                if (existing.zIndex === undefined || existing.zIndex === null) {
                    existing.zIndex = Number(targetLayer.zIndex ?? 0);
                }
                if (existing.orderIndex === undefined || existing.orderIndex === null) {
                    existing.orderIndex = Number(targetLayer.orderIndex ?? 0);
                }
            } else {
                const existingZ = Number(existing.zIndex ?? 0);
                const targetZ = Number(targetLayer.zIndex ?? 0);
                existing.zIndex = Math.max(existingZ, targetZ);
                existing.orderIndex = Math.max(Number(existing.orderIndex ?? 0), Number(targetLayer.orderIndex ?? 0));
                existing.active = targetLayer.active;
                existing.visible = targetLayer.visible;
                existing.locked = targetLayer.locked;
                existing.opacity = targetLayer.opacity;
                existing.freezeInput = targetLayer.freezeInput;
                existing.freezeInputType = targetLayer.freezeInputType;
            }
            targetLayer = existing;
            persistentRecord.layer = targetLayer;
        }

        if (!Array.isArray(targetLayer.entities)) {
            targetLayer.entities = [];
        }

        for (const entity of entitiesToMount) {
            entity.layerId = targetLayer.id;
            
            for (const layer of world.allLayers) {
                if (layer !== targetLayer && Array.isArray(layer.entities)) {
                    const idx = layer.entities.findIndex(e => e.id === entity.id);
                    if (idx !== -1) {
                        layer.entities.splice(idx, 1);
                    }
                }
            }

            const alreadyInWorld = world.entities.some(e => e.id === entity.id);
            if (!alreadyInWorld) {
                world.addEntity(entity);
            }

            if (!targetLayer.entities.some(e => e.id === entity.id)) {
                targetLayer.entities.push(entity);
            }
            if (world.scriptIdMap && entity.scriptId) {
                world.scriptIdMap.set(entity.scriptId, entity);
            }
        }

        targetCollection.sort((a, b) => {
            const zA = Number(a?.zIndex ?? 0);
            const zB = Number(b?.zIndex ?? 0);
            if (zA !== zB) return zA - zB;
            const oA = Number(a?.orderIndex ?? 0);
            const oB = Number(b?.orderIndex ?? 0);
            if (oA !== oB) return oA - oB;
            return String(a?.id || "").localeCompare(String(b?.id || ""));
        });

        if (targetLayer.entities && targetLayer.entities.length > 0) {
            targetLayer.entities.sort((a, b) => {
                const zA = Number(a?.zIndex ?? 0);
                const zB = Number(b?.zIndex ?? 0);
                if (zA !== zB) return zA - zB;
                return Number(a?.orderIndex ?? 0) - Number(b?.orderIndex ?? 0);
            });
        }

        if (Config.ENGINE_MODE === "runtime") {
            this._initializeInjectedScripts(entitiesToMount, true);
        }

        return { success: true, isFirstLoad };
    }

    resetLayer(sourceSceneIdentifier = 'self', layerIdentifier = null) {
        if (!this._sceneDataCache || this._sceneDataCache.length === 0) {
            console.warn("[SceneSystem] Cannot reset layer: Scene cache is empty.");
            return false;
        }

        const world = this.game.world;
        if (!world) {
            return false;
        }

        const isSceneIdentifierEmpty = !sourceSceneIdentifier || String(sourceSceneIdentifier).trim() === '' || String(sourceSceneIdentifier).trim().toLowerCase() === 'self';
        let sourceScene = null;
        if (isSceneIdentifierEmpty) {
            const currentId = this.getCurrentSceneId();
            const currentScriptId = this.getCurrentSceneScriptId();
            sourceScene = this._sceneDataCache.find(s => 
                (s.id && s.id === currentId) || 
                (s.scriptId && currentScriptId && s.scriptId.toLowerCase() === currentScriptId.toLowerCase())
            ) || this._currentSceneData;
        } else {
            const searchSceneKey = String(sourceSceneIdentifier).trim().toLowerCase();
            sourceScene = this._sceneDataCache.find(s => 
                (s.scriptId && s.scriptId.trim().toLowerCase() === searchSceneKey) ||
                (s.id === sourceSceneIdentifier)
            );
        }

        if (!sourceScene) {
            console.warn(`[SceneSystem] Failed to reset layer: Scene '${sourceSceneIdentifier}' not found.`);
            return false;
        }

        const searchLayerKey = layerIdentifier !== null && layerIdentifier !== undefined ? String(layerIdentifier).trim().toLowerCase() : '';
        if (!searchLayerKey) {
            console.warn(`[SceneSystem] Failed to reset layer: Layer identifier is required.`);
            return false;
        }

        const allSourceLayers = [...(sourceScene.layersUI || []), ...(sourceScene.layersWorld || [])];
        const sourceLayer = allSourceLayers.find(l => 
            (l.scriptId && l.scriptId.trim().toLowerCase() === searchLayerKey) ||
            (l.id === layerIdentifier)
        );

        if (!sourceLayer) {
            console.warn(`[SceneSystem] Failed to reset layer: Layer '${layerIdentifier}' not found in scene '${sourceScene.scriptId || sourceScene.id}'.`);
            return false;
        }

        const targetScriptId = sourceLayer.scriptId || sourceLayer.id;
        const targetKey = targetScriptId.toLowerCase();

        const currentSceneId = String(this.getCurrentSceneId() || '').toLowerCase();
        const currentSceneScriptId = String(this.getCurrentSceneScriptId() || '').toLowerCase();
        const searchSceneKey = String(sourceSceneIdentifier || '').trim().toLowerCase();
        const isCurrentScene = !searchSceneKey || searchSceneKey === 'self' || searchSceneKey === currentSceneId || searchSceneKey === currentSceneScriptId;

        const allWorldLayers = world.allLayers || [];
        let activeLayer = allWorldLayers.find(l => 
            (l.scriptId && l.scriptId.toLowerCase() === targetKey) ||
            (l.id && l.id === sourceLayer.id) ||
            (l.id && l.id.toLowerCase() === targetKey)
        );

        if (!isCurrentScene && !activeLayer) {
            if (this._persistentLayers) {
                const sId = sourceScene.id || sourceScene.scriptId;
                const lId = sourceLayer.id || sourceLayer.scriptId;
                const candidateKeys = [
                    `${sId}_${lId}`,
                    sourceLayer.scriptId ? `${sId}_${sourceLayer.scriptId.toLowerCase()}` : null,
                    sourceScene.scriptId && sourceLayer.scriptId ? `${sourceScene.scriptId.toLowerCase()}_${sourceLayer.scriptId.toLowerCase()}` : null,
                    sourceLayer.scriptId ? `layer_${sourceLayer.scriptId.toLowerCase()}` : null,
                    sourceLayer.id ? `layer_${sourceLayer.id.toLowerCase()}` : null
                ].filter(Boolean);

                for (const k of candidateKeys) {
                    this._persistentLayers.delete(k);
                }

                for (const [k, p] of this._persistentLayers.entries()) {
                    if (p && p.layer) {
                        const pScriptId = (p.layer.scriptId || '').toLowerCase();
                        const pId = p.layer.id;
                        if (pId === sourceLayer.id || (sourceLayer.scriptId && pScriptId === sourceLayer.scriptId.toLowerCase())) {
                            this._persistentLayers.delete(k);
                        }
                    }
                }
            }
            return true;
        }

        const targetLayerId = activeLayer ? activeLayer.id : sourceLayer.id;

        if (this.game.entitySystem) {
            const allEntities = [...(world.entities || [])];
            const entitiesToDestroy = allEntities.filter(e => 
                e.layerId === targetLayerId || 
                (activeLayer && e.layerId === activeLayer.id) ||
                (sourceLayer.id && e.layerId === sourceLayer.id)
            );
            if (activeLayer && Array.isArray(activeLayer.entities)) {
                for (const e of activeLayer.entities) {
                    if (!entitiesToDestroy.includes(e)) {
                        entitiesToDestroy.push(e);
                    }
                }
            }
            for (const ent of entitiesToDestroy) {
                if (!ent._isDestroyed) {
                    this.game.entitySystem.destroyEntity(ent);
                }
            }
        }

        const isUI = (world && Array.isArray(world.layersUI) && world.layersUI.some(l => 
                         (l.scriptId && l.scriptId.toLowerCase() === targetKey) || 
                         (l.id && l.id.toLowerCase() === targetKey) ||
                         l.id === sourceLayer.id
                     )) ||
                     (sourceScene && Array.isArray(sourceScene.layersUI) && sourceScene.layersUI.some(l => 
                         l.id === sourceLayer.id || 
                         (l.scriptId && l.scriptId.toLowerCase() === targetKey)
                     )) ||
                     (sourceLayer.scriptId && sourceLayer.scriptId.toLowerCase().includes('ui')) ||
                     sourceLayer.section === 'ui';

        const targetCollection = isUI ? world.layersUI : world.layersWorld;

        let targetLayer = activeLayer;
        if (targetLayer) {
            targetLayer.visible = sourceLayer.visible !== false;
            targetLayer.locked = Boolean(sourceLayer.locked);
            targetLayer.active = sourceLayer.active !== false;
            targetLayer.opacity = Number(sourceLayer.opacity !== undefined ? sourceLayer.opacity : 1.0);
            targetLayer.zIndex = Number(sourceLayer.zIndex !== undefined && sourceLayer.zIndex !== null ? sourceLayer.zIndex : 0);
            targetLayer.orderIndex = Number(sourceLayer.orderIndex !== undefined && sourceLayer.orderIndex !== null ? sourceLayer.orderIndex : 0);
            targetLayer.freezeInput = Boolean(sourceLayer.freezeInput !== undefined && sourceLayer.freezeInput !== null ? sourceLayer.freezeInput : false);
            targetLayer.freezeInputType = sourceLayer.freezeInputType || 'all';
            targetLayer.entities = [];
        } else {
            targetLayer = {
                id: sourceLayer.id,
                scriptId: sourceLayer.scriptId,
                visible: sourceLayer.visible !== false,
                locked: Boolean(sourceLayer.locked),
                active: sourceLayer.active !== false,
                opacity: Number(sourceLayer.opacity !== undefined ? sourceLayer.opacity : 1.0),
                zIndex: Number(sourceLayer.zIndex !== undefined && sourceLayer.zIndex !== null ? sourceLayer.zIndex : 0),
                orderIndex: Number(sourceLayer.orderIndex !== undefined && sourceLayer.orderIndex !== null ? sourceLayer.orderIndex : 0),
                freezeInput: Boolean(sourceLayer.freezeInput !== undefined && sourceLayer.freezeInput !== null ? sourceLayer.freezeInput : false),
                freezeInputType: sourceLayer.freezeInputType || 'all',
                entities: []
            };
            targetCollection.push(targetLayer);
        }

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

        for (const entity of createdEntities) {
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

        for (const entity of createdEntities) {
            entity.layerId = targetLayer.id;
            const alreadyInWorld = world.entities.some(e => e.id === entity.id);
            if (!alreadyInWorld) {
                world.addEntity(entity);
            }
            if (!targetLayer.entities.some(e => e.id === entity.id)) {
                targetLayer.entities.push(entity);
            }
            if (world.scriptIdMap && entity.scriptId) {
                world.scriptIdMap.set(entity.scriptId, entity);
            }
        }

        if (this._persistentLayers) {
            const sId = sourceScene.id || sourceScene.scriptId;
            const lId = sourceLayer.id || sourceLayer.scriptId;
            const persistentRecord = {
                layer: targetLayer,
                entities: createdEntities
            };
            this._persistentLayers.set(`${sId}_${lId}`, persistentRecord);
            if (targetLayer.scriptId) {
                this._persistentLayers.set(`${sId}_${targetLayer.scriptId.toLowerCase()}`, persistentRecord);
                if (sourceScene.scriptId) {
                    this._persistentLayers.set(`${sourceScene.scriptId.toLowerCase()}_${targetLayer.scriptId.toLowerCase()}`, persistentRecord);
                }
                this._persistentLayers.set(`layer_${targetLayer.scriptId.toLowerCase()}`, persistentRecord);
            }
        }

        targetCollection.sort((a, b) => {
            const zA = Number(a?.zIndex ?? 0);
            const zB = Number(b?.zIndex ?? 0);
            if (zA !== zB) return zA - zB;
            const oA = Number(a?.orderIndex ?? 0);
            const oB = Number(b?.orderIndex ?? 0);
            if (oA !== oB) return oA - oB;
            return String(a?.id || "").localeCompare(String(b?.id || ""));
        });

        if (targetLayer.entities && targetLayer.entities.length > 0) {
            targetLayer.entities.sort((a, b) => {
                const zA = Number(a?.zIndex ?? 0);
                const zB = Number(b?.zIndex ?? 0);
                if (zA !== zB) return zA - zB;
                return Number(a?.orderIndex ?? 0) - Number(b?.orderIndex ?? 0);
            });
        }

        if (Config.ENGINE_MODE === "runtime") {
            this._initializeInjectedScripts(createdEntities, true);
        }

        return true;
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