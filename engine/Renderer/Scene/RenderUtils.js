import { HexToVec4 } from "../../Util/HexToVec4.js";
import Config from "../../Core/Config.js";
import FontMath from "../../Util/FontMath.js";

export default class RenderUtils {
    /**
     * Pengurutan item berdasarkan zIndex, orderIndex, dan ID
     */
    static sortItems(items) {
        return items.sort((a, b) => {
            const zA = a.zIndex ?? 0;
            const zB = b.zIndex ?? 0;
            if (zA !== zB) return zA - zB;

            const oA = a.orderIndex ?? 0;
            const oB = b.orderIndex ?? 0;
            if (oA !== oB) return oA - oB;

            const idA = String(a.id || a._id || "");
            const idB = String(b.id || b._id || "");
            return idA.localeCompare(idB);
        });
    }

    /**
     * Mencari entity berdasarkan ID di seluruh layer World & UI
     */
    static findEntityById(world, id) {
        if (!id) return null;
        const allLayers = [...(world.layersWorld || []), ...(world.layersUI || [])];
        for (const layer of allLayers) {
            if (!layer.entities) continue;
            const found = layer.entities.find(e => String(e.id || e._id) === String(id));
            if (found) return found;
        }
        return null;
    }

    /**
     * Kalkulasi hierarki posisi, rotasi, dan skala secara rekursif
     */
    static getGlobalTransform(e, world) {
        const t = e.components && (e.components.UITransform || e.components.Transform);
        if (!t) return { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5, width: 100, height: 100 };

        if (!e.parentId) {
            return {
                x: t.x, y: t.y,
                rotation: t.rotation || 0,
                scaleX: t.scaleX ?? 1, scaleY: t.scaleY ?? 1,
                pivotX: t.pivotX ?? 0.5, pivotY: t.pivotY ?? 0.5,
                width: t.width, height: t.height
            };
        }

        const parentEntity = this.findEntityById(world, e.parentId);
        if (!parentEntity) return { ...t };

        const parentGlobal = this.getGlobalTransform(parentEntity, world);

        const parentRad = parentGlobal.rotation * (Math.PI / 180);
        const cos = Math.cos(parentRad);
        const sin = Math.sin(parentRad);

        const scaledLocalX = t.x * parentGlobal.scaleX;
        const scaledLocalY = t.y * parentGlobal.scaleY;

        const rotatedX = (scaledLocalX * cos) - (scaledLocalY * sin);
        const rotatedY = (scaledLocalX * sin) + (scaledLocalY * cos);

        return {
            x: parentGlobal.x + rotatedX,
            y: parentGlobal.y + rotatedY,
            rotation: parentGlobal.rotation + (t.rotation || 0),
            scaleX: parentGlobal.scaleX * (t.scaleX ?? 1),
            scaleY: parentGlobal.scaleY * (t.scaleY ?? 1),
            pivotX: t.pivotX ?? 0.5,
            pivotY: t.pivotY ?? 0.5,
            width: t.width, height: t.height
        };
    }

    /**
     * Menggambar garis putus-putus (Dashed Line)
     */
    static drawDashedLine(shapeRenderer, x1, y1, x2, y2, dashLen, gapLen, thickness, color, proj) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return;

        const nx = dx / len;
        const ny = dy / len;
        let dist = 0;

        while (dist < len) {
            const segmentLen = Math.min(dashLen, len - dist);
            shapeRenderer.drawLine(
                x1 + nx * dist, y1 + ny * dist,
                x1 + nx * (dist + segmentLen), y1 + ny * (dist + segmentLen),
                color, thickness, proj
            );
            dist += dashLen + gapLen;
        }
    }

    /**
     * Single Source of Truth untuk pemanggilan ShapeRenderer
     */
    static drawShape(shapeRenderer, opt, t, proj, world, entityId) {
        if (!opt) return;

        if (opt.type === "custom") {
            const activeTabId = world._editors?.activeTabId;
            const activeTab = world._editors?.tabs?.find(tb => tb.id === activeTabId);
            const isEditingThisEntity = activeTab?.type === 'shape_editor' && String(entityId) === String(activeTabId);

            shapeRenderer.drawCustomShape(
                opt.elements, t.x, t.y, t.width, t.height,
                proj, t.rotation, t.scaleX, t.scaleY, t.pivotX, t.pivotY,
                opt.flipX, opt.flipY,
                isEditingThisEntity ? world._editors : null,
                opt 
            );
            return;
        }

        if (opt.type === "rectStroke") {
            shapeRenderer.drawParametricShape(
                "rectangle", t.x, t.y, t.width, t.height,
                [0, 0, 0, 0], opt.color, false, opt.thickness || 2, 0, 4,
                proj, t.rotation, t.scaleX, t.scaleY, t.pivotX, t.pivotY, opt.flipX, opt.flipY
            );
            return;
        }

        const color = opt.color || "#0066FF";
        const outlineColor = opt.outlineColor || "#0066FF";
        const parsedFill = Array.isArray(color) ? color : HexToVec4(color);
        const parsedOutline = Array.isArray(outlineColor) ? outlineColor : HexToVec4(outlineColor);

        const fillCol = [...parsedFill.slice(0, 3), parsedFill[3] * (opt.fillOpacity ?? 0.3)];
        const strokeCol = [...parsedOutline.slice(0, 3), parsedOutline[3] * (opt.outlineOpacity ?? 1.0)];

        shapeRenderer.drawParametricShape(
            opt.type, t.x, t.y, t.width, t.height,
            fillCol, strokeCol, opt.isFilled ?? true, opt.outlineWidth ?? 2,
            opt.cornerRadius ?? 0, opt.sides ?? 4,
            proj, t.rotation, t.scaleX, t.scaleY, t.pivotX, t.pivotY, opt.flipX, opt.flipY
        );
    }

    /**
     * Eksekusi antrean render dengan Batch Flushing otomatis saat tipe perender berganti
     */
    static executeRenderQueue(renderQueue, renderers, proj, world) {
        if (!renderQueue || renderQueue.length === 0) return;

        let currentType = null;
        for (const item of renderQueue) {
            if (currentType && currentType !== item.type) {
                renderers[currentType].flush();
            }
            currentType = item.type;

            if (item.type === "image") {
                renderers.image.draw(item.texture, item.frame, item.transformData, item.options, proj);
            } else if (item.type === "shape") {
                this.drawShape(renderers.shape, item.shapeOptions, item.transformData, proj, world, item.entityId);
            } else if (item.type === "text") {
                const opt = item.textOptions;
                const t = item.transformData;
                renderers.text.drawText(
                    opt.font, opt.text, t.x, t.y, t.width, t.height,
                    opt.fontSize, opt.color, proj, t.rotation, t.scaleX, t.scaleY,
                    t.pivotX, t.pivotY, opt.opacity, opt.flipX, opt.flipY, opt
                );
            }
        }

        if (currentType) {
            renderers[currentType].flush();
        }
    }

    /**
     * Memproses komponen SpriteRenderer dari Entity
     */
    static processSprite(comps, currentOpacity, flipX, flipY, rawT, world, renderQueue, trans) {
        const s = comps.SpriteRenderer;
        const a = (s.opacity ?? 1) * currentOpacity;

        if (a <= 0) return;

        let finalAssetId = s.assetId;
        let finalX = s.sourceX ?? 0;
        let finalY = s.sourceY ?? 0;
        let finalW = s.sourceWidth ?? 0;
        let finalH = s.sourceHeight ?? 0;
        let finalFlipX = flipX;

        const animator = comps.SpriteAnimator;
        if (animator && animator.active) {
            const clip = Array.isArray(animator.clips)
                ? animator.clips.find(c => c.id === animator.currentClip && c.type === 'clip')
                : null;

            if (clip && clip.assetId && clip.frames && clip.frames.length > 0) {
                let animData = null;

                if (Config.ENGINE_MODE === 'runtime' && animator.isPlaying && animator._runtimeData) {
                    animData = animator._runtimeData;
                } else {
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

        if (!texture) {
            useCheckerboard = true;
            if (finalW === 0) finalW = rawT.width || 64;
            if (finalH === 0) finalH = rawT.height || 64;
        }

        renderQueue.push({
            type: "image",
            texture,
            frame: { x: finalX, y: finalY, w: finalW, h: finalH },
            transformData: trans,
            options: {
                flipX: finalFlipX,
                flipY,
                opacity: a,
                useCheckerboard,
                filterMode: s.filterMode || "pixelated",
                useSDF: s.useSDF || false
            }
        });
    }

    /**
     * Memproses komponen ShapeRenderer dari Entity
     */
    static processShape(comps, currentOpacity, flipX, flipY, entityId, renderQueue, trans) {
        const s = comps.ShapeRenderer;
        const globalA = (s.opacity ?? 1) * currentOpacity;

        if (globalA > 0 && Array.isArray(s.elements) && s.elements.length > 0) {
            renderQueue.push({
                type: "shape",
                entityId,
                transformData: trans,
                shapeOptions: {
                    type: "custom",
                    elements: s.elements,
                    globalOpacity: globalA,
                    isFilled: s.isFilled ?? true,
                    color: s.color || "#0066FF",
                    fillOpacity: s.fillOpacity ?? 0.3,
                    outlineWidth: s.outlineWidth ?? 2,
                    outlineColor: s.outlineColor || "#0066FF",
                    outlineOpacity: s.outlineOpacity ?? 1.0,
                    flipX, flipY
                }
            });
        }
    }

    /**
     * Memproses komponen TextRenderer dari Entity
     */
    static processText(comps, currentOpacity, flipX, flipY, rawT, world, renderQueue, trans) {
        const tx = comps.TextRenderer;
        const a = (tx.opacity ?? 1) * currentOpacity;
        let font = world.assets.fonts[tx.assetId];
        if (!font?.ready) font = world.assets.fonts["system_default"];

        if (a <= 0 || !font) return;

        const textOptions = {
            text: tx.value ?? "",
            fontSize: tx.fontSize || 24,
            color: HexToVec4(tx.color || "#FFFFFF"),
            font, opacity: a, flipX, flipY,
            align: tx.align || "left",
            maxWidth: tx.maxWidth || 0,
            maxLine: tx.maxLine || 0,
            lineSpacing: tx.lineSpacing || 1.2,
            letterSpacing: tx.letterSpacing || 0,
            overflow: tx.overflow || "wrap",
            smoothing: tx.smoothing ?? 0.5,
            bias: tx.bias ?? 0,
            outlineWidth: tx.outlineWidth || 0,
            outlineColor: HexToVec4(tx.outlineColor || "#000000"),
            shadowEnabled: tx.shadowEnabled || false,
            shadowColor: HexToVec4(tx.shadowColor || "#000000"),
            shadowOpacity: tx.shadowOpacity ?? 0.5,
            shadowOffset: { x: tx.shadowOffsetX ?? 2, y: tx.shadowOffsetY ?? -2 },
            shadowBlur: tx.shadowBlur ?? 0.5
        };

        if (tx.autoFit) {
            const measurement = FontMath.measureText(font, textOptions.text, textOptions.fontSize, textOptions);
            if (rawT.width !== measurement.boundsWidth || rawT.height !== measurement.boundsHeight) {
                rawT.width = measurement.boundsWidth;
                rawT.height = measurement.boundsHeight;
                trans.width = rawT.width;
                trans.height = rawT.height;
            }
        }

        renderQueue.push({
            type: "text",
            transformData: trans,
            textOptions
        });
    }

    /**
     * Memproses Collider Debug Wireframe untuk Editor Mode
     */
    static processColliderDebug(comps, globalT, trans, renderQueue, solidColor, triggerColor) {
        if (Config.ENGINE_MODE !== 'editor' || !comps.Collider || !Array.isArray(comps.Collider.data)) return;

        const tRotRad = trans.rotation;
        const cosT = Math.cos(tRotRad);
        const sinT = Math.sin(tRotRad);

        for (let i = 0; i < comps.Collider.data.length; i++) {
            const c = comps.Collider.data[i];
            if (!c.enabled) continue;

            const cW = (c.autoFit ? globalT.width : c.width) * Math.abs(globalT.scaleX ?? 1);
            const cH = (c.autoFit ? globalT.height : c.height) * Math.abs(globalT.scaleY ?? 1);
            const pX = c.pivotX ?? 0.5;
            const pY = c.pivotY ?? 0.5;

            const localTlX = -globalT.width * Math.abs(globalT.scaleX ?? 1) * (globalT.pivotX ?? 0.5) + (c.offsetX || 0) * Math.abs(globalT.scaleX ?? 1);
            const localTlY = -globalT.height * Math.abs(globalT.scaleY ?? 1) * (globalT.pivotY ?? 0.5) + (c.offsetY || 0) * Math.abs(globalT.scaleY ?? 1);

            const localPx = localTlX + cW * pX;
            const localPy = localTlY + cH * pY;

            const worldPx = trans.x + localPx * cosT - localPy * sinT;
            const worldPy = trans.y + localPx * sinT + localPy * cosT;

            const totalRot = c.autoFit ? tRotRad : tRotRad + ((c.rotation || 0) * (Math.PI / 180));

            const debugTrans = {
                x: worldPx, y: worldPy, width: cW, height: cH,
                rotation: totalRot, scaleX: 1, scaleY: 1,
                pivotX: pX, pivotY: pY
            };

            renderQueue.push({
                type: "shape",
                transformData: debugTrans,
                shapeOptions: {
                    type: "rectStroke",
                    color: c.type === 'trigger' ? triggerColor : solidColor,
                    thickness: 2, opacity: 1.0, flipX: false, flipY: false
                }
            });
        }
    }
}