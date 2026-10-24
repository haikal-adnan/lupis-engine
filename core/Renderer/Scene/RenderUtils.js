import { HexToVec4 } from "../../Util/HexToVec4.js";
import Config from "../../Core/Config.js";
import FontMath from "../../Util/FontMath.js";

export default class RenderUtils {
    static getHierarchicalOrder(entities) {
        if (!Array.isArray(entities) || entities.length === 0) return [];

        const entityMap = new Map();
        const childrenMap = new Map();
        const rootEntities = [];

        for (const e of entities) {
            if (!e) continue;
            entityMap.set(String(e.id), e);
        }

        for (const e of entities) {
            if (!e) continue;
            const parentId = e.parentId ? String(e.parentId) : null;
            if (parentId && entityMap.has(parentId)) {
                if (!childrenMap.has(parentId)) {
                    childrenMap.set(parentId, []);
                }
                childrenMap.get(parentId).push(e);
            } else {
                rootEntities.push(e);
            }
        }

        const compareSiblings = (a, b) => {
            const zA = a?.zIndex ?? 0;
            const zB = b?.zIndex ?? 0;
            if (zA !== zB) return zA - zB;

            const oA = a?.orderIndex ?? 0;
            const oB = b?.orderIndex ?? 0;
            if (oA !== oB) return oA - oB;

            const idA = String(a?.id || "");
            const idB = String(b?.id || "");
            return idA.localeCompare(idB);
        };

        rootEntities.sort(compareSiblings);

        const result = [];
        const visited = new Set();

        const traverse = (node) => {
            const nodeId = String(node.id);
            if (visited.has(nodeId)) return;
            visited.add(nodeId);

            const children = childrenMap.get(nodeId) || [];
            children.sort(compareSiblings);

            const parentZ = node.zIndex ?? 0;
            const behindChildren = [];
            const frontChildren = [];

            for (const child of children) {
                const childZ = child.zIndex ?? 0;
                if (childZ < parentZ) {
                    behindChildren.push(child);
                } else {
                    frontChildren.push(child);
                }
            }

            for (const child of behindChildren) {
                traverse(child);
            }

            result.push(node);

            for (const child of frontChildren) {
                traverse(child);
            }
        };

        for (const root of rootEntities) {
            traverse(root);
        }

        for (const e of entities) {
            if (e && !visited.has(String(e.id))) {
                result.push(e);
            }
        }

        return result;
    }

    static sortItems(items) {
        if (!Array.isArray(items) || items.length === 0) return items;

        const hasHierarchy = items.some(item => item && item.parentId);
        if (hasHierarchy) {
            const sorted = this.getHierarchicalOrder(items);
            items.splice(0, items.length, ...sorted);
            return items;
        }

        return items.sort((a, b) => {
            const zA = Number(a?.zIndex ?? 0);
            const zB = Number(b?.zIndex ?? 0);
            if (zA !== zB) return zA - zB;

            const oA = Number(a?.orderIndex ?? 0);
            const oB = Number(b?.orderIndex ?? 0);
            if (oA !== oB) return oA - oB;

            const idA = String(a?.id || "");
            const idB = String(b?.id || "");
            return idA.localeCompare(idB);
        });
    }

    static findEntityById(world, id) {
        if (!id) return null;
        if (Array.isArray(world?.entities)) {
            const foundInWorld = world.entities.find(e => String(e.id) === String(id));
            if (foundInWorld) return foundInWorld;
        }
        const allLayers = [...(world?.layersWorld || []), ...(world?.layersUI || [])];
        for (const layer of allLayers) {
            if (!layer?.entities) continue;
            const found = layer.entities.find(e => String(e.id) === String(id));
            if (found) return found;
        }
        return null;
    }

    static calculateAbsoluteTransform(e, world) {
        if (!e) return { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5, width: 0, height: 0 };
        const comps = e.components;
        const isUI = Boolean(comps?.UITransform);
        const t = comps && (comps.UITransform || comps.Transform);
        const isTilemap = Boolean(comps?.Tilemap);
        const defaultPivotX = isTilemap ? 0 : 0.5;
        const defaultPivotY = isTilemap ? 0 : 0.5;

        if (!t) {
            return {
                x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1,
                pivotX: defaultPivotX, pivotY: defaultPivotY, width: 0, height: 0
            };
        }

        const localX = t.x || 0;
        const localY = t.y || 0;
        const localRot = t.rotation || 0;
        const localScaleX = t.scaleX ?? 1;
        const localScaleY = t.scaleY ?? 1;
        const pivotX = t.pivotX ?? defaultPivotX;
        const pivotY = t.pivotY ?? defaultPivotY;
        const width = t.width || 0;
        const height = t.height || 0;

        const uiSettings = world?.settings?.ui || { width: 1920, height: 1080 };
        const canvasW = uiSettings.width ?? 1920;
        const canvasH = uiSettings.height ?? 1080;

        if (!e.parentId) {
            if (isUI) {
                const anchorX = t.anchorX ?? 0.5;
                const anchorY = t.anchorY ?? 0.5;
                return {
                    x: (canvasW * anchorX) + localX,
                    y: (canvasH * anchorY) + localY,
                    rotation: localRot,
                    scaleX: localScaleX,
                    scaleY: localScaleY,
                    pivotX, pivotY,
                    width, height
                };
            }
            return {
                x: localX,
                y: localY,
                rotation: localRot,
                scaleX: localScaleX,
                scaleY: localScaleY,
                pivotX, pivotY,
                width, height
            };
        }

        const parentEntity = this.findEntityById(world, e.parentId);
        if (!parentEntity) {
            if (isUI) {
                const anchorX = t.anchorX ?? 0.5;
                const anchorY = t.anchorY ?? 0.5;
                return {
                    x: (canvasW * anchorX) + localX,
                    y: (canvasH * anchorY) + localY,
                    rotation: localRot,
                    scaleX: localScaleX,
                    scaleY: localScaleY,
                    pivotX, pivotY,
                    width, height
                };
            }
            return {
                x: localX,
                y: localY,
                rotation: localRot,
                scaleX: localScaleX,
                scaleY: localScaleY,
                pivotX, pivotY,
                width, height
            };
        }

        const parentAbs = this.calculateAbsoluteTransform(parentEntity, world);

        let anchorOffsetX = 0;
        let anchorOffsetY = 0;

        if (isUI) {
            const anchorX = t.anchorX ?? 0.5;
            const anchorY = t.anchorY ?? 0.5;
            const parentW = parentAbs.width || 0;
            const parentH = parentAbs.height || 0;
            const parentPivotX = parentAbs.pivotX ?? 0.5;
            const parentPivotY = parentAbs.pivotY ?? 0.5;

            const childW = width || 0;
            const childH = height || 0;
            const childPivotX = pivotX ?? 0.5;
            const childPivotY = pivotY ?? 0.5;

            anchorOffsetX = parentW * (anchorX - parentPivotX) + childW * (childPivotX - anchorX);
            anchorOffsetY = parentH * (anchorY - parentPivotY) + childH * (childPivotY - anchorY);
        }

        const localPosWithAnchorX = anchorOffsetX + localX;
        const localPosWithAnchorY = anchorOffsetY + localY;

        const parentRad = (parentAbs.rotation || 0) * (Math.PI / 180);
        const cos = Math.cos(parentRad);
        const sin = Math.sin(parentRad);

        const scaledLocalX = localPosWithAnchorX * (parentAbs.scaleX ?? 1);
        const scaledLocalY = localPosWithAnchorY * (parentAbs.scaleY ?? 1);

        const rotatedX = (scaledLocalX * cos) - (scaledLocalY * sin);
        const rotatedY = (scaledLocalX * sin) + (scaledLocalY * cos);

        return {
            x: parentAbs.x + rotatedX,
            y: parentAbs.y + rotatedY,
            rotation: (parentAbs.rotation || 0) + localRot,
            scaleX: (parentAbs.scaleX ?? 1) * localScaleX,
            scaleY: (parentAbs.scaleY ?? 1) * localScaleY,
            pivotX, pivotY,
            width, height
        };
    }

    static calculateAbsolutePosition(e, world) {
        const absT = this.calculateAbsoluteTransform(e, world);
        return { x: absT.x, y: absT.y };
    }

    static getGlobalTransform(e, world) {
        const t = e?.components && (e.components.UITransform || e.components.Transform);
        if (!t) return { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5, width: 100, height: 100 };

        if (!e.parentId) {
            return {
                x: t.x || 0, y: t.y || 0,
                rotation: t.rotation || 0,
                scaleX: t.scaleX ?? 1, scaleY: t.scaleY ?? 1,
                pivotX: t.pivotX ?? 0.5, pivotY: t.pivotY ?? 0.5,
                width: t.width || 0, height: t.height || 0
            };
        }

        const parentEntity = this.findEntityById(world, e.parentId);
        if (!parentEntity) return { ...t };

        const parentGlobal = this.getGlobalTransform(parentEntity, world);

        const parentRad = parentGlobal.rotation * (Math.PI / 180);
        const cos = Math.cos(parentRad);
        const sin = Math.sin(parentRad);

        const scaledLocalX = (t.x || 0) * parentGlobal.scaleX;
        const scaledLocalY = (t.y || 0) * parentGlobal.scaleY;

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
            width: t.width || 0, height: t.height || 0
        };
    }

    static drawDashedLine(shapeRenderer, x1, y1, x2, y2, dashLen, gapLen, thickness, color, proj) {
        if (!shapeRenderer) return;
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

    static drawShape(shapeRenderer, opt, t, proj, world, entityId) {
        if (!opt || !shapeRenderer) return;

        if (opt.type === "custom") {
            const activeTabId = world?._editors?.activeTabId;
            const activeTab = world?._editors?.tabs?.find(tb => tb.id === activeTabId);
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
                [0, 0, 0, 0], opt.color, false, opt.thickness || 2, opt.cornerRadius || 0, 4,
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

    static executeRenderQueue(renderQueue, renderers, proj, world) {
        if (!renderQueue || renderQueue.length === 0 || !renderers) return;

        let currentType = null;
        for (const item of renderQueue) {
            if (currentType && currentType !== item.type) {
                renderers[currentType]?.flush();
            }
            currentType = item.type;

            if (item.type === "image") {
                renderers.image?.draw(item.texture, item.frame, item.transformData, item.options, proj);
            } else if (item.type === "shape") {
                this.drawShape(renderers.shape, item.shapeOptions, item.transformData, proj, world, item.entityId);
            } else if (item.type === "text") {
                const opt = item.textOptions;
                const t = item.transformData;
                renderers.text?.drawText(
                    opt.font, opt.text, t.x, t.y, t.width, t.height,
                    opt.fontSize, opt.color, proj, t.rotation, t.scaleX, t.scaleY,
                    t.pivotX, t.pivotY, opt.opacity, opt.flipX, opt.flipY, opt
                );
            }
        }

        if (currentType) {
            renderers[currentType]?.flush();
        }
    }

    static processSprite(comps, currentOpacity, flipX, flipY, rawT, world, renderQueue, trans) {
        const s = comps?.SpriteRenderer;
        if (!s) return;
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
            texture = world?.assets?.textures?.[finalAssetId];
        }

        if (!texture) {
            useCheckerboard = true;
            if (finalW === 0) finalW = rawT?.width || 64;
            if (finalH === 0) finalH = rawT?.height || 64;
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

    static processShape(comps, currentOpacity, flipX, flipY, entityId, renderQueue, trans) {
        const s = comps?.ShapeRenderer;
        if (!s) return;
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

    static processText(comps, currentOpacity, flipX, flipY, rawT, world, renderQueue, trans) {
        const tx = comps?.TextRenderer;
        if (!tx) return;
        const a = (tx.opacity ?? 1) * currentOpacity;
        let font = world?.assets?.fonts?.[tx.assetId];
        if (!font?.ready) font = world?.assets?.fonts?.["system_default"];

        if (a <= 0 || !font) return;

        const textOptions = {
            text: tx.value ?? "",
            fontSize: Number(tx.fontSize) || 24,
            color: HexToVec4(tx.color || "#FFFFFF"),
            font, opacity: a, flipX, flipY,
            align: tx.align || "left",
            alignLine: tx.alignLine || tx.alignV || tx.verticalAlign || "top",
            width: rawT?.width || 100,
            maxLine: Math.max(1, Number(tx.maxLine) || 1),
            autoLine: tx.autoLine !== false,
            lineSpacing: Number(tx.lineSpacing) || 1.2,
            letterSpacing: Number(tx.letterSpacing) || 0,
            overflow: tx.overflow || "wrap",
            outlineWidth: tx.outlineWidth || 0,
            outlineColor: HexToVec4(tx.outlineColor || "#000000"),
            shadowEnabled: tx.shadowEnabled || false,
            shadowColor: HexToVec4(tx.shadowColor || "#000000"),
            shadowOpacity: tx.shadowOpacity ?? 0.5,
            shadowOffset: { x: tx.shadowOffsetX ?? 2, y: tx.shadowOffsetY ?? -2 },
            shadowBlur: tx.shadowBlur ?? 0.5
        };

        if (rawT) {
            const measurement = FontMath.measureText(font, textOptions.text, textOptions.fontSize, textOptions);
            const newH = measurement.boundsHeight > 0 ? Math.ceil(measurement.boundsHeight) : Math.ceil(textOptions.fontSize);
            const hasCustomVAlign = tx.alignLine === 'mid' || tx.alignLine === 'bottom' || tx.alignLine === 'center' || tx.alignLine === 'middle';
            if (!hasCustomVAlign && tx.autoLine !== false) {
                if (rawT.height !== newH) {
                    rawT.height = newH;
                    trans.height = rawT.height;
                }
            }
            textOptions.measurement = measurement;
        }

        renderQueue.push({
            type: "text",
            transformData: trans,
            textOptions
        });
    }

    static processColliderDebug(comps, globalT, trans, renderQueue, solidColor, triggerColor, hitboxColor, hurtboxColor, collidersConfig) {
        if (Config.ENGINE_MODE !== 'editor' || !comps?.Collider || !Array.isArray(comps.Collider.data)) return;

        const isFlippedX = Boolean(globalT.flipX);
        const tRotRad = (trans.rotation || 0) * (isFlippedX ? -1 : 1);
        const cosT = Math.cos(tRotRad);
        const sinT = Math.sin(tRotRad);

        const defHitboxColor = hitboxColor || [1, 0.15, 0.15, 0.85];
        const defHurtboxColor = hurtboxColor || [0, 0.75, 1, 0.85];

        for (let i = 0; i < comps.Collider.data.length; i++) {
            const c = comps.Collider.data[i];
            if (!c || !c.enabled) continue;

            const cType = c.type || 'solid';
            if (collidersConfig) {
                if (cType === 'solid' && collidersConfig.solid === false) continue;
                if (cType === 'trigger' && collidersConfig.trigger === false) continue;
                if (cType === 'hitbox' && collidersConfig.hitbox === false) continue;
                if (cType === 'hurtbox' && collidersConfig.hurtbox === false) continue;
            }

            const scaleX = Math.abs(globalT.scaleX ?? 1);
            const scaleY = Math.abs(globalT.scaleY ?? 1);

            const cW = (c.autoFit ? globalT.width : c.width) * scaleX;
            const cH = (c.autoFit ? globalT.height : c.height) * scaleY;
            let pX = c.pivotX ?? 0.5;
            let pY = c.pivotY ?? 0.5;

            const localTlX = -globalT.width * scaleX * (globalT.pivotX ?? 0.5) + (c.offsetX || 0) * scaleX;
            const localTlY = -globalT.height * scaleY * (globalT.pivotY ?? 0.5) + (c.offsetY || 0) * scaleY;

            let localPx = localTlX + cW * pX;
            let localPy = localTlY + cH * pY;

            const shouldFlipX = isFlippedX && (c.autoFlipX !== false);
            if (shouldFlipX) {
                localPx = -localPx;
                pX = 1 - pX;
            }

            const isLockRot = Boolean(c.lockWorldRotation);
            const worldPx = isLockRot ? (trans.x + localPx) : (trans.x + localPx * cosT - localPy * sinT);
            const worldPy = isLockRot ? (trans.y + localPy) : (trans.y + localPx * sinT + localPy * cosT);

            let totalRot = isLockRot 
                ? ((c.rotation || 0) * (Math.PI / 180) * (shouldFlipX ? -1 : 1)) 
                : (c.autoFit ? tRotRad : tRotRad + (((c.rotation || 0) * (Math.PI / 180)) * (shouldFlipX ? -1 : 1)));

            const cRadius = Math.max(0, Math.min(
                (Number(c.cornerRadius) || 0) * Math.min(scaleX, scaleY),
                cW * 0.5,
                cH * 0.5
            ));

            const debugTrans = {
                x: worldPx, y: worldPy, width: cW, height: cH,
                rotation: totalRot, scaleX: 1, scaleY: 1,
                pivotX: pX, pivotY: pY
            };

            let strokeColor = solidColor;
            if (c.type === 'trigger') strokeColor = triggerColor;
            else if (c.type === 'hitbox') strokeColor = defHitboxColor;
            else if (c.type === 'hurtbox') strokeColor = defHurtboxColor;

            renderQueue.push({
                type: "shape",
                transformData: debugTrans,
                shapeOptions: {
                    type: "rectStroke",
                    color: strokeColor,
                    thickness: 2, opacity: 1.0, flipX: false, flipY: false,
                    cornerRadius: cRadius
                }
            });
        }
    }

    static isEntityEffectivelyActive(entity, world) {
        if (!entity || entity.active === false) return false;
        const allEntities = world?.entities || [];
        let current = entity;
        while (current.parentId) {
            current = allEntities.find(e => String(e.id) === String(current.parentId));
            if (!current) break;
            if (current.active === false) return false;
        }
        if (entity.layerId && world) {
            const allLayers = [...(world.layersWorld || []), ...(world.layersUI || [])];
            const layer = allLayers.find(l => String(l.id) === String(entity.layerId));
            if (layer && layer.active === false) return false;
        }
        return true;
    }

    static isEntityEffectivelyVisible(entity, world) {
        if (!entity || entity.visible === false) return false;
        const allEntities = world?.entities || [];
        let current = entity;
        while (current.parentId) {
            current = allEntities.find(e => String(e.id) === String(current.parentId));
            if (!current) break;
            if (current.visible === false) return false;
        }
        if (entity.layerId && world) {
            const allLayers = [...(world.layersWorld || []), ...(world.layersUI || [])];
            const layer = allLayers.find(l => String(l.id) === String(entity.layerId));
            if (layer && layer.visible === false) return false;
        }
        return true;
    }

    static isEntityEffectivelyLocked(entity, world) {
        if (!entity) return false;
        if (Boolean(entity.locked || (entity._editor && entity._editor.locked))) return true;
        const allEntities = world?.entities || [];
        let current = entity;
        while (current.parentId) {
            current = allEntities.find(e => String(e.id) === String(current.parentId));
            if (!current) break;
            if (Boolean(current.locked || (current._editor && current._editor.locked))) return true;
        }
        if (entity.layerId && world) {
            const allLayers = [...(world.layersWorld || []), ...(world.layersUI || [])];
            const layer = allLayers.find(l => String(l.id) === String(entity.layerId));
            if (layer && Boolean(layer.locked)) return true;
        }
        return false;
    }
}