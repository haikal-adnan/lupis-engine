import { HexToVec4 } from "../../Util/HexToVec4.js";
import Config from "../../Core/Config.js";

export default class UIRenderer {
    constructor(image, shape, text, game) {
        this.renderer = { image, shape, text };
        this.game = game;
        this.renderQueue = [];
        this.borderColor = HexToVec4("#00aaff");
        this.dashedColor = [0, 0.66, 1, 0.5];
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

    render(world, proj, isSceneMode = false) {
        const isEditor = Config.ENGINE_MODE === "editor";
        const uiSettings = world.settings?.ui || { 
            active: true, width: 1920, height: 1080, showUIBorder: true 
        };

        if (!uiSettings.active) return;

        if (isEditor) {
            if (isSceneMode && uiSettings.showUIBorder) {
                this._renderDashedBorder(proj, uiSettings.width, uiSettings.height);
            } else if (!isSceneMode) {
                this._renderWorkspaceGizmos(proj, uiSettings.width, uiSettings.height);
            }
        }

        const rootBounds = { x: 0, y: 0, width: uiSettings.width, height: uiSettings.height };
        this.renderQueue.length = 0;
        this._collectUIEntities(world, proj, rootBounds);
        this._executeRenderQueue(proj);
    }

    _collectUIEntities(world, proj, rootBounds) {
        const layers = [...(world.layersUI || [])];
        this._sortItems(layers);

        for (const layer of layers) {
            if (layer.active === false || !layer.visible || !layer.entities) continue;
            
            const allEntities = [...layer.entities];
            this._sortItems(allEntities);
            
            for (const entity of allEntities) {
                this._processUIEntity(entity, world, proj, 1.0, rootBounds);
            }
        }
    }

    _processUIEntity(e, world, proj, parentOpacity, parentBounds) {
        if (e.active === false || e.visible === false) return;

        const comps = e.components;
        if (!comps) return;

        const t = comps.UITransform || comps.Transform;
        if (!t) return;

        const anchorX = t.anchorX ?? 0.5;
        const anchorY = t.anchorY ?? 0.5;
        const anchorPointX = parentBounds.x + (parentBounds.width * anchorX);
        const anchorPointY = parentBounds.y + (parentBounds.height * anchorY);

        const trans = {
            x: anchorPointX + (t.x || 0),
            y: anchorPointY + (t.y || 0),
            width: t.width || 0,
            height: t.height || 0,
            rotation: (t.rotation || 0) * (Math.PI / 180),
            scaleX: t.scaleX ?? 1,
            scaleY: t.scaleY ?? 1,
            pivotX: t.pivotX ?? 0.5,
            pivotY: t.pivotY ?? 0.5
        };

        const currentOpacity = (e.opacity ?? 1) * parentOpacity;
        const flipX = t.flipX || false;
        const flipY = t.flipY || false;

        if (comps.SpriteRenderer) {
            const s = comps.SpriteRenderer;
            const a = (s.opacity ?? 1) * currentOpacity;
            
            if (a > 0) {
                let finalAssetId = s.assetId;
                let finalX = s.sourceX ?? 0;
                let finalY = s.sourceY ?? 0;
                let finalW = s.sourceWidth ?? 0;
                let finalH = s.sourceHeight ?? 0;
                let finalFlipX = flipX;

                const animator = comps.SpriteAnimator;
                if (animator && animator.isActive) {
                    // FIX: Pengecekan Array.isArray
                    const clip = Array.isArray(animator.clips) ? animator.clips.find(c => c.id === animator.currentClip && c.type === 'clip') : null;
                    
                    if (clip && clip.assetId && clip.frames && clip.frames.length > 0) {
                        let animData = null;

                        if (Config.ENGINE_MODE === 'runtime' && animator.isPlaying && animator._runtimeData) {
                            animData = animator._runtimeData;
                        } 
                        else {
                            const manualIndex = clip.frameIndex || 0;
                            const safeIndex = Math.max(0, Math.min(manualIndex, clip.frames.length - 1)); 

                            const frameId = clip.frames[safeIndex];
                            const sourceRect = clip.sources?.[frameId];
                            
                            if (sourceRect) {
                                animData = {
                                    assetId: clip.assetId,
                                    x: sourceRect.x,
                                    y: sourceRect.y,
                                    w: sourceRect.w,
                                    h: sourceRect.h,
                                    flipX: clip.flipX || false
                                };
                            }
                        }

                        if (animData) {
                            finalAssetId = animData.assetId;
                            finalX = animData.x;
                            finalY = animData.y;
                            finalW = animData.w;
                            finalH = animData.h;
                            finalFlipX = finalFlipX !== animData.flipX; 
                        }
                    }
                }

                let texture = null;
                let useCheckerboard = false;

                if (finalAssetId && finalAssetId !== "") {
                    texture = world.assets.textures[finalAssetId];
                }

                // Cek apakah tekstur benar-benar ada
                if (!texture) {
                    useCheckerboard = true;
                    if (finalW === 0) finalW = t.width || 64;
                    if (finalH === 0) finalH = t.height || 64;
                }

                this.renderQueue.push({
                    type: "image",
                    texture: texture,
                    frame: { x: finalX, y: finalY, w: finalW, h: finalH },
                    transformData: trans,
                    options: { flipX: finalFlipX, flipY, opacity: a, useCheckerboard }
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
                if (tx.autoFit) {
                    const measurement = this.renderer.text.measureText(font, tx.value ?? "", tx.fontSize || 24);
                    
                    if (t.width !== measurement.boundsWidth || t.height !== measurement.boundsHeight) {
                        t.width = measurement.boundsWidth;
                        t.height = measurement.boundsHeight;
                        
                        trans.width = t.width;
                        trans.height = t.height;
                    }
                }

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

    _executeRenderQueue(proj) {
        if (this.renderQueue.length === 0) return;
        let currentType = null;
        for (const item of this.renderQueue) {
            if (currentType && currentType !== item.type) this.renderer[currentType].flush();
            currentType = item.type;
            if (item.type === "image") {
                this.renderer.image.draw(item.texture, item.frame, item.transformData, item.options, proj);
            } else if (item.type === "shape") {
                this._drawShape(item.shapeOptions, item.transformData, proj);
            } else if (item.type === "text") {
                const { text, font, fontSize, color, opacity, flipX, flipY } = item.textOptions;
                const t = item.transformData;
                this.renderer.text.drawText(
                    font, text, t.x, t.y, t.width, t.height, fontSize, color, proj, 
                    t.rotation, t.scaleX, t.scaleY, t.pivotX, t.pivotY, opacity, flipX, flipY
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

    _renderWorkspaceGizmos(proj, w, h) {
        this.renderer.shape.drawRectStroke(0, 0, w, h, this.borderColor, 4, proj);
        this.renderer.shape.flush();
    }

    _renderDashedBorder(proj, width, height) {
        const scale = this.game.camera.scale || 1;
        const dashLen = 20 / scale;
        const gapLen = 10 / scale;
        this._drawDashedLine(0, 0, width, 0, dashLen, gapLen, proj);
        this._drawDashedLine(width, 0, width, height, dashLen, gapLen, proj);
        this._drawDashedLine(width, height, 0, height, dashLen, gapLen, proj);
        this._drawDashedLine(0, height, 0, 0, dashLen, gapLen, proj);
        this.renderer.shape.flush();
    }

    _drawDashedLine(x1, y1, x2, y2, dashLen, gapLen, proj) {
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
                this.dashedColor, 2 / (this.game.camera.scale || 1), proj
            );
            dist += dashLen + gapLen;
        }
    }
}