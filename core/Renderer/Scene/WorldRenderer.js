import Config from "../../Core/Config.js";
import RenderUtils from "./RenderUtils.js";
import { TilemapMath } from "../../Editor/Tilemap/TilemapMath.js";

export default class WorldRenderer { 
    constructor(image, text, shape, game, tilemapRenderer) {
        this.game = game;
        this.renderer = { image, text, shape };
        this.tilemapRenderer = tilemapRenderer;
        this.renderQueue = [];
        
        this.boundsColor = [0.7, 0, 1, 0.6];
        this.colliderColorSolid = [0, 1, 0, 0.8]; 
        this.colliderColorTrigger = [1, 1, 0, 0.8]; 
        this.colliderColorHitbox = [1, 0.15, 0.15, 0.85];
        this.colliderColorHurtbox = [0, 0.75, 1, 0.85]; 
    }

    render(world, proj, alpha = 1.0, isUIMode = false) {
        const { activeTabId, tabs, tilemapContext } = world?._editors || {};
        const activeTab = tabs?.find(t => t.id === activeTabId);
        const isIsolationMode = activeTab?.type === "tilemap";

        if (world?._editors) {
            world._editors.isIsolationMode = isIsolationMode;
        }

        if (world?.gridRenderer && !isIsolationMode && !isUIMode) {
            this._flushAll();
            world.gridRenderer(this.renderer.shape, proj);
            this.renderer.shape?.flush();
        }

        const isWorldActive = world?.settings?.world?.active !== false && world?.settings?.world?.visible !== false;

        if (Config.ENGINE_MODE === 'editor' && !isIsolationMode && isWorldActive) {
            this._renderWorldBounds(world, proj);
        }

        this.renderQueue.length = 0;
        this._collectRenderables(world, activeTabId, isIsolationMode, isUIMode, tilemapContext, proj);
        RenderUtils.executeRenderQueue(this.renderQueue, this.renderer, proj, world);

        if (isIsolationMode) {
            const activeEntity = RenderUtils.findEntityById(world, activeTabId);
            if (activeEntity?.components?.Tilemap) {
                this._flushAll();
                const gl = this.game?.renderer?.gl;
                if (gl) gl.disable(gl.DEPTH_TEST);
                this.tilemapRenderer?.renderOnlyGizmos(activeEntity, world, proj);
                this._flushAll();
                if (gl) gl.enable(gl.DEPTH_TEST);
            }
        }
    }

    _collectRenderables(world, activeTabId, isIsolationMode, isUIMode, tilemapContext, proj) {
        const isEditor = Config.ENGINE_MODE === 'editor';
        const isWorldActive = world?.settings?.world?.active !== false && world?.settings?.world?.visible !== false;
        const isUIActive = world?.settings?.ui?.active !== false && world?.settings?.ui?.visible !== false;
        const layers = [...(world?.layersWorld || []), ...(world?.layersUI || [])]; 
        RenderUtils.sortItems(layers);

        for (let li = 0; li < layers.length; li++) {
            const layer = layers[li];
            if (!layer || layer.active === false || layer.visible === false || !layer.entities) continue;

            const isUILayer = layer.scriptId === 'ui' || layer.scriptId?.toLowerCase().includes('ui') || (world?.layersUI?.includes(layer));
            if (isUILayer && !isUIActive) continue;
            if (!isUILayer && !isWorldActive) continue;
            if (!isEditor && isUILayer) continue;

            const layerOpacity = layer.opacity ?? 1.0; 
            const allEntities = RenderUtils.getHierarchicalOrder(layer.entities);

            for (const e of allEntities) {
                const isEntityUI = e?.type === 'ui' || e?.type === 'ui_entity' || e?.components?.UITransform || isUILayer;
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
        if (!e || !RenderUtils.isEntityEffectivelyActive(e, world) || !RenderUtils.isEntityEffectivelyVisible(e, world)) return;

        const currentOpacity = (e.opacity ?? 1) * parentOpacity;
        const comps = e.components;
        if (!comps) return;

        const rawT = comps.UITransform || comps.Transform;
        
        if (rawT) {
            const globalT = RenderUtils.getGlobalTransform(e, world);

            if (comps.Tilemap && this.tilemapRenderer) {
                const tm = comps.Tilemap;
                const bounds = TilemapMath.getBounds(tm);
                
                if (rawT.width !== bounds.width || rawT.height !== bounds.height) {
                    rawT.width = bounds.width;
                    rawT.height = bounds.height;
                }

                RenderUtils.executeRenderQueue(this.renderQueue, this.renderer, proj, world);
                this.renderQueue.length = 0;

                this.tilemapRenderer.renderEntity(e, world, proj, currentOpacity);
                return;
            }

            const absT = RenderUtils.calculateAbsoluteTransform(e, world);

            const trans = {
                x: absT.x, 
                y: absT.y, 
                width: absT.width || 0, 
                height: absT.height || 0,
                rotation: (absT.rotation || 0) * (Math.PI / 180),
                scaleX: absT.scaleX ?? 1, 
                scaleY: absT.scaleY ?? 1,
                pivotX: absT.pivotX ?? 0.5, 
                pivotY: absT.pivotY ?? 0.5
            };

            const flipX = rawT.flipX || false;
            const flipY = rawT.flipY || false;
            const entityId = e.id;

            if (comps.SpriteRenderer) {
                RenderUtils.processSprite(comps, currentOpacity, flipX, flipY, rawT, world, this.renderQueue, trans);
            }

            if (comps.ShapeRenderer) {
                RenderUtils.processShape(comps, currentOpacity, flipX, flipY, entityId, this.renderQueue, trans);
            }

            RenderUtils.processColliderDebug(comps, globalT, trans, this.renderQueue, this.colliderColorSolid, this.colliderColorTrigger, this.colliderColorHitbox, this.colliderColorHurtbox, world?.settings?.colliders);

            if (comps.TextRenderer) {
                RenderUtils.processText(comps, currentOpacity, flipX, flipY, rawT, world, this.renderQueue, trans);
            }
        }
    }

    _renderWorldBounds(world, proj) {
        const bounds = world?.settings?.worldBounds;
        if (!bounds || !bounds.active) return;
        const { x1, y1, x2, y2 } = bounds;
        const scale = this.game?.camera?.scale || 1;
        const dashLen = 40 / scale;
        const gapLen = 20 / scale;
        const thickness = 4 / scale;
        const shape = this.renderer.shape;

        RenderUtils.drawDashedLine(shape, x1, y1, x2, y1, dashLen, gapLen, thickness, this.boundsColor, proj);
        RenderUtils.drawDashedLine(shape, x2, y1, x2, y2, dashLen, gapLen, thickness, this.boundsColor, proj);
        RenderUtils.drawDashedLine(shape, x2, y2, x1, y2, dashLen, gapLen, thickness, this.boundsColor, proj);
        RenderUtils.drawDashedLine(shape, x1, y2, x1, y1, dashLen, gapLen, thickness, this.boundsColor, proj);
        shape?.flush();
    }

    _flushAll() {
        this.renderer.image?.flush();
        this.renderer.shape?.flush();
        this.renderer.text?.flush();
    }
}