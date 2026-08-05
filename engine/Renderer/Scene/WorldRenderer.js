import Config from "../../Core/Config.js";
import RenderUtils from "./RenderUtils.js";

export default class WorldRenderer { 
    constructor(image, text, shape, game, tilemapRenderer) {
        this.game = game;
        this.renderer = { image, text, shape };
        this.tilemapRenderer = tilemapRenderer;
        this.renderQueue = [];
        
        this.boundsColor = [0.7, 0, 1, 0.6];
        this.colliderColorSolid = [0, 1, 0, 0.8]; 
        this.colliderColorTrigger = [1, 1, 0, 0.8]; 
    }

    render(world, proj, alpha = 1.0, isUIMode = false) {
        const { activeTabId, tabs, tilemapContext } = world._editors || {};
        const activeTab = tabs?.find(t => t.id === activeTabId);
        const isIsolationMode = activeTab?.type === "tilemap";

        if (world.gridRenderer && !isIsolationMode && !isUIMode) {
            this._flushAll();
            world.gridRenderer(this.renderer.shape, proj);
            this.renderer.shape.flush();
        }

        if (Config.ENGINE_MODE === 'editor' && !isIsolationMode) {
            this._renderWorldBounds(world, proj);
        }

        this.renderQueue.length = 0;
        this._collectRenderables(world, activeTabId, isIsolationMode, isUIMode, tilemapContext, proj);
        RenderUtils.executeRenderQueue(this.renderQueue, this.renderer, proj, world);

        if (isIsolationMode) {
            const activeEntity = RenderUtils.findEntityById(world, activeTabId);
            if (activeEntity && activeEntity.components.Tilemap) {
                this._flushAll();
                const gl = this.game.renderer.gl;
                gl.disable(gl.DEPTH_TEST);
                this.tilemapRenderer.renderOnlyGizmos(activeEntity, world, proj);
                this._flushAll();
                gl.enable(gl.DEPTH_TEST);
            }
        }
    }

    _collectRenderables(world, activeTabId, isIsolationMode, isUIMode, tilemapContext, proj) {
        const isEditor = Config.ENGINE_MODE === 'editor';
        const layers = [...(world.layersWorld || []), ...(world.layersUI || [])]; 
        RenderUtils.sortItems(layers);

        for (let li = 0; li < layers.length; li++) {
            const layer = layers[li];
            if (layer.active === false || layer.visible === false || !layer.entities) continue;

            const isUILayer = layer.scriptId === 'ui' || (layer.name && layer.name.includes('UI'));
            if (!isEditor && isUILayer) continue;

            const layerOpacity = layer.opacity ?? 1.0; 
            const allEntities = [...layer.entities];
            RenderUtils.sortItems(allEntities);

            for (const e of allEntities) {
                const isEntityUI = e.type === 'ui' || e.type === 'ui_entity' || e.components.UITransform || isUILayer;
                if (!isEditor && isEntityUI) continue;

                let entityVisualOpacity = layerOpacity; 

                if (isIsolationMode && e.id !== activeTabId) {
                    if (tilemapContext && !tilemapContext.showOthers) continue;
                    if (tilemapContext) entityVisualOpacity *= tilemapContext.opacity; 
                }
                
                if (isEditor && isUIMode) {
                    if (!isEntityUI) {
                        entityVisualOpacity *= 0.3; 
                    }
                }

                this._processEntity(e, world, proj, entityVisualOpacity);
            }
        }
    }

    _processEntity(e, world, proj, parentOpacity = 1.0) {
        if (e.active === false || e.visible === false) return;

        const currentOpacity = (e.opacity ?? 1) * parentOpacity;
        const comps = e.components;
        if (!comps) return;

        if (comps.Tilemap && this.tilemapRenderer) {
            const tm = comps.Tilemap;
            const t = comps.UITransform || comps.Transform;
            
            if (t && tm.autoFit) {
                const targetW = (tm.width || 0) * (tm.tileWidth || 0);
                const targetH = (tm.height || 0) * (tm.tileHeight || 0);
                
                if (t.width !== targetW || t.height !== targetH) {
                    t.width = targetW;
                    t.height = targetH;
                }
            }

            RenderUtils.executeRenderQueue(this.renderQueue, this.renderer, proj, world);
            this.renderQueue.length = 0;
            this.tilemapRenderer.renderEntity(e, world, proj, currentOpacity);
            return;
        }

        const rawT = comps.UITransform || comps.Transform;
        
        if (rawT) {
            const globalT = RenderUtils.getGlobalTransform(e, world);

            let drawX = globalT.x || 0;
            let drawY = globalT.y || 0;

            if (comps.UITransform) {
                const uiSettings = world.settings?.ui || { width: 1920, height: 1080 };
                const parentW = uiSettings.width;
                const parentH = uiSettings.height;
                const anchorX = rawT.anchorX ?? 0.5;
                const anchorY = rawT.anchorY ?? 0.5;

                drawX = (parentW * anchorX) + (globalT.x || 0);
                drawY = (parentH * anchorY) + (globalT.y || 0);
            }

            const trans = {
                x: drawX, 
                y: drawY, 
                width: globalT.width, 
                height: globalT.height,
                rotation: (globalT.rotation || 0) * (Math.PI / 180),
                scaleX: globalT.scaleX ?? 1, 
                scaleY: globalT.scaleY ?? 1,
                pivotX: globalT.pivotX ?? 0.5, 
                pivotY: globalT.pivotY ?? 0.5
            };

            const flipX = rawT.flipX || false;
            const flipY = rawT.flipY || false;
            const entityId = e.id || e._id;

            if (comps.SpriteRenderer) {
                RenderUtils.processSprite(comps, currentOpacity, flipX, flipY, rawT, world, this.renderQueue, trans);
            }

            if (comps.ShapeRenderer) {
                RenderUtils.processShape(comps, currentOpacity, flipX, flipY, entityId, this.renderQueue, trans);
            }

            RenderUtils.processColliderDebug(comps, globalT, trans, this.renderQueue, this.colliderColorSolid, this.colliderColorTrigger);

            if (comps.TextRenderer) {
                RenderUtils.processText(comps, currentOpacity, flipX, flipY, rawT, world, this.renderQueue, trans);
            }
        }
    }

    _renderWorldBounds(world, proj) {
        const bounds = world.settings?.worldBounds;
        if (!bounds || !bounds.active) return;
        const { x1, y1, x2, y2 } = bounds;
        const scale = this.game.camera.scale || 1;
        const dashLen = 40 / scale;
        const gapLen = 20 / scale;
        const thickness = 4 / scale;
        const shape = this.renderer.shape;

        RenderUtils.drawDashedLine(shape, x1, y1, x2, y1, dashLen, gapLen, thickness, this.boundsColor, proj);
        RenderUtils.drawDashedLine(shape, x2, y1, x2, y2, dashLen, gapLen, thickness, this.boundsColor, proj);
        RenderUtils.drawDashedLine(shape, x2, y2, x1, y2, dashLen, gapLen, thickness, this.boundsColor, proj);
        RenderUtils.drawDashedLine(shape, x1, y2, x1, y1, dashLen, gapLen, thickness, this.boundsColor, proj);
        shape.flush();
    }

    _flushAll() {
        this.renderer.image.flush();
        this.renderer.shape.flush();
        this.renderer.text.flush();
    }
}