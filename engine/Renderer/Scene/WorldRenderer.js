import { HexToVec4 } from "../../Util/HexToVec4.js";
import Config from "../../Core/Config.js";

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

    _sortItems(items) {
        return items.sort((a, b) => {
            const zA = a.zIndex ?? 0;
            const zB = b.zIndex ?? 0;
            if (zA !== zB) return zA - zB;
            
            const oA = a.orderIndex ?? 0;
            const oB = b.orderIndex ?? 0;
            if (oA !== oB) return oA - oB;

            const idA = a.id || a._id || "";
            const idB = b.id || b._id || "";
            return idA.localeCompare(idB);
        });
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
        this._executeRenderQueue(proj);

        if (isIsolationMode) {
            const activeEntity = this._findEntityById(world, activeTabId);
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
        const layers = [...(world.layersWorld || []), ...(world.layersUI || [])]; 
        this._sortItems(layers);

        for (let li = 0; li < layers.length; li++) {
            const layer = layers[li];
            if (layer.visible === false) continue;
            if (!layer.entities) continue;

            const rootEntities = layer.entities.filter(e => !e.parentId);
            this._sortItems(rootEntities);

            for (const e of rootEntities) {
                if (e.type === 'ui' || e.type === 'ui_entity') continue;

                let entityVisualOpacity = 1.0;
                if (isIsolationMode && e.id !== activeTabId) {
                    if (tilemapContext && !tilemapContext.showOthers) continue;
                    if (tilemapContext) entityVisualOpacity = tilemapContext.opacity;
                }
                if (isUIMode) entityVisualOpacity = 0.3;

                this._processEntityRecursive(e, world, proj, entityVisualOpacity);
            }
        }
    }

    _processEntityRecursive(e, world, proj, parentOpacity = 1.0) {
        if (e.active === false || e.visible === false) return;

        const comps = e.components;
        if (!comps) return;

        const currentOpacity = (e.opacity ?? 1) * parentOpacity;

        if (comps.Tilemap && this.tilemapRenderer) {
            this._executeRenderQueue(proj);
            this.renderQueue.length = 0;
            this.tilemapRenderer.renderEntity(e, world, proj, currentOpacity);
        } else {
            const t = comps.Transform;
            if (t) {
                const trans = {
                    x: t.x, y: t.y, width: t.width, height: t.height,
                    rotation: (t.rotation || 0) * (Math.PI / 180),
                    scaleX: t.scaleX ?? 1, scaleY: t.scaleY ?? 1,
                    pivotX: t.pivotX ?? 0.5, pivotY: t.pivotY ?? 0.5
                };
                const flipX = t.flipX || false;
                const flipY = t.flipY || false;

                if (comps.SpriteRenderer) {
                    const s = comps.SpriteRenderer;
                    const a = (s.opacity ?? 1) * currentOpacity;
                    if (a > 0) {
                        const texture = world.assets.textures[s.assetId];
                        this.renderQueue.push({
                            type: "image",
                            texture: texture,
                            frame: { x: s.sourceX ?? 0, y: s.sourceY ?? 0, w: s.sourceWidth ?? 0, h: s.sourceHeight ?? 0 },
                            transformData: trans,
                            options: { flipX, flipY, opacity: a }
                        });
                    }
                }

                if (comps.ShapeRenderer) {
                    const s = comps.ShapeRenderer;
                    const a = (s.opacity ?? 1) * currentOpacity;
                    if (a > 0) {
                        this.renderQueue.push({
                            type: "shape",
                            transformData: trans,
                            shapeOptions: {
                                type: s.type || "rectangle",
                                color: HexToVec4(s.color || "#FFFFFF"),
                                thickness: s.thickness || 1,
                                x2: s.x2, y2: s.y2, opacity: a, flipX, flipY
                            }
                        });
                    }
                }

                if (comps.TextRenderer) {
                    const tx = comps.TextRenderer;
                    const a = (tx.opacity ?? 1) * currentOpacity;
                    let font = world.assets.fonts[tx.assetId];
                    if (!font?.ready) font = world.assets.fonts["system_default"];
                    if (a > 0 && font) {
                        this.renderQueue.push({
                            type: "text",
                            transformData: trans,
                            textOptions: {
                                text: tx.value ?? "",
                                fontSize: tx.fontSize || 24,
                                color: HexToVec4(tx.color || "#FFFFFF"),
                                font, opacity: a, flipX, flipY
                            }
                        });
                    }
                }
            }
        }

        if (e.children && e.children.length > 0) {
            const sortedChildren = [...e.children];
            this._sortItems(sortedChildren);
            for (const child of sortedChildren) {
                this._processEntityRecursive(child, world, proj, currentOpacity);
            }
        }
    }

    _findEntityById(world, id) {
        const allLayers = [...(world.layersWorld || []), ...(world.layersUI || [])];
        for (const layer of allLayers) {
            if (!layer.entities) continue;
            for (const e of layer.entities) {
                if (e.id === id) return e;
                const found = this._findInChildren(e, id);
                if (found) return found;
            }
        }
        return null;
    }

    _findInChildren(entity, id) {
        if (!entity.children) return null;
        for (const child of entity.children) {
            if (child.id === id) return child;
            const found = this._findInChildren(child, id);
            if (found) return found;
        }
        return null;
    }

    _renderWorldBounds(world, proj) {
        const bounds = world.settings?.worldBounds;
        if (!bounds || !bounds.active) return;
        const { x1, y1, x2, y2 } = bounds;
        const scale = this.game.camera.scale || 1;
        const dashLen = 40 / scale;
        const gapLen = 20 / scale;
        const thickness = 4 / scale;
        this._drawDashedLine(x1, y1, x2, y1, dashLen, gapLen, thickness, proj);
        this._drawDashedLine(x2, y1, x2, y2, dashLen, gapLen, thickness, proj);
        this._drawDashedLine(x2, y2, x1, y2, dashLen, gapLen, thickness, proj);
        this._drawDashedLine(x1, y2, x1, y1, dashLen, gapLen, thickness, proj);
        this.renderer.shape.flush();
    }

    _drawDashedLine(x1, y1, x2, y2, dashLen, gapLen, thickness, proj) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return;
        const nx = dx / len;
        const ny = dy / len;
        let dist = 0;
        while (dist < len) {
            const segmentLen = Math.min(dashLen, len - dist);
            this.renderer.shape.drawLine(
                x1 + nx * dist, y1 + ny * dist,
                x1 + nx * (dist + segmentLen), y1 + ny * (dist + segmentLen),
                this.boundsColor, thickness, proj
            );
            dist += dashLen + gapLen;
        }
    }

    _executeRenderQueue(proj) {
        if (this.renderQueue.length === 0) return;
        let currentType = null;
        for (const item of this.renderQueue) {
            if (currentType && currentType !== item.type) {
                this.renderer[currentType].flush();
            }
            currentType = item.type;
            if (item.type === "image") {
                this.renderer.image.draw(item.texture, item.frame, item.transformData, item.options, proj);
            } else if (item.type === "shape") {
                this._drawShape(item.shapeOptions, item.transformData, proj);
            } else if (item.type === "text") {
                const { text, font, fontSize, color, opacity, flipX, flipY } = item.textOptions;
                const t = item.transformData;
                this.renderer.text.drawText(
                    font, text, t.x, t.y, t.width, t.height, 
                    fontSize, color, proj, t.rotation, t.scaleX, t.scaleY, 
                    t.pivotX, t.pivotY, opacity, flipX, flipY
                );
            }
        }
        if (currentType) this.renderer[currentType].flush();
    }

    _drawShape(opt, t, proj) {
        const shape = this.renderer.shape;
        const fx = opt.flipX || false;
        const fy = opt.flipY || false;
        if (opt.type === "rectangle") {
            shape.drawRect(t.x, t.y, t.width, t.height, opt.color, proj, t.rotation, t.scaleX, t.scaleY, t.pivotX, t.pivotY, opt.opacity, fx, fy);
        } else if (opt.type === "rectStroke") {
            shape.drawRectStroke(t.x, t.y, t.width, t.height, opt.color, opt.thickness, proj, t.rotation, t.scaleX, t.scaleY, t.pivotX, t.pivotY, opt.opacity, fx, fy);
        } else if (opt.type === "circle") {
            const radius = (t.width / 2) * ((Math.abs(t.scaleX) + Math.abs(t.scaleY)) / 2);
            shape.drawCircle(t.x, t.y, radius, opt.color, 32, proj);
        } else if (opt.type === "line") {
            shape.drawLine(t.x, t.y, opt.x2, opt.y2, opt.color, opt.thickness, proj);
        }
    }

    _flushAll() {
        this.renderer.image.flush();
        this.renderer.shape.flush();
        this.renderer.text.flush();
    }
}