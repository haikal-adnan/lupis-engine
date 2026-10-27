import { ApplyResizeToEntity } from "../../Util/ApplyResizeToEntity.js";

export class TransformEngine {
    constructor(world) {
        this.world = world;
    }

    getTransform(e) {
        return e?.components && (e.components.UITransform || e.components.Transform);
    }

    findEntityInWorld(id) {
        const allLayers = [...(this.world?.layersWorld || []), ...(this.world?.layersUI || [])];
        for (const layer of allLayers) {
            if (layer?.entities) {
                const found = layer.entities.find(e => String(e.id) === String(id));
                if (found) return found;
            }
        }
        return null;
    }

    getGlobalTransform(e) {
        const t = this.getTransform(e);
        const isTilemap = Boolean(e?.components?.Tilemap);
        const defaultPivotX = isTilemap ? 0 : 0.5;
        const defaultPivotY = isTilemap ? 0 : 0.5;

        if (!t) return { 
            x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, 
            pivotX: defaultPivotX, pivotY: defaultPivotY, width: 100, height: 100 
        };

        if (!e.parentId) {
            return {
                x: t.x || 0,
                y: t.y || 0,
                rotation: t.rotation || 0,
                scaleX: t.scaleX ?? 1,
                scaleY: t.scaleY ?? 1,
                pivotX: t.pivotX ?? defaultPivotX,
                pivotY: t.pivotY ?? defaultPivotY,
                width: t.width || 0,
                height: t.height || 0
            };
        }

        const parentEntity = this.findEntityInWorld(e.parentId);
        if (!parentEntity) {
            return {
                x: t.x || 0,
                y: t.y || 0,
                rotation: t.rotation || 0,
                scaleX: t.scaleX ?? 1,
                scaleY: t.scaleY ?? 1,
                pivotX: t.pivotX ?? defaultPivotX,
                pivotY: t.pivotY ?? defaultPivotY,
                width: t.width || 0,
                height: t.height || 0
            };
        }

        const parentGlobal = this.getGlobalTransform(parentEntity);
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
            pivotX: t.pivotX ?? defaultPivotX,
            pivotY: t.pivotY ?? defaultPivotY,
            width: t.width || 0,
            height: t.height || 0
        };
    }

    applyTranslation(entity, startX, startY, dx, dy) {
        const t = this.getTransform(entity);
        if (!t) return false;

        let localDx = dx;
        let localDy = dy;

        if (entity.parentId) {
            const parentEntity = this.findEntityInWorld(entity.parentId);
            if (parentEntity) {
                const parentGlobal = this.getGlobalTransform(parentEntity);
                const invRad = -parentGlobal.rotation * (Math.PI / 180);
                const cos = Math.cos(invRad);
                const sin = Math.sin(invRad);

                const rotatedDx = (dx * cos) - (dy * sin);
                const rotatedDy = (dx * sin) + (dy * cos);

                const pScaleX = parentGlobal.scaleX !== 0 ? parentGlobal.scaleX : 1;
                const pScaleY = parentGlobal.scaleY !== 0 ? parentGlobal.scaleY : 1;

                localDx = rotatedDx / pScaleX;
                localDy = rotatedDy / pScaleY;
            }
        }

        const newX = Math.round(startX + localDx);
        const newY = Math.round(startY + localDy);

        if (t.x !== newX || t.y !== newY) {
            t.x = newX;
            t.y = newY;
            return true;
        }
        return false;
    }

    applyRotation(entity, targetDeg) {
        const t = this.getTransform(entity);
        if (!t) return false;

        const newRotation = Math.round((targetDeg % 360 + 360) % 360);
        if (t.rotation !== newRotation) {
            t.rotation = newRotation;
            t.overridden = true;
            return true;
        }
        return false;
    }

    applyResize(entity, item, localDx, localDy, resizeType, shouldSnap = false, gridSize = 32, lockRatio = null) {
        const t = this.getTransform(entity);
        if (!t) return false;

        const isRatioLocked = lockRatio !== null 
            ? Boolean(lockRatio) 
            : Boolean(t.isRatioLocked || item.isRatioLocked);

        const globalT = this.getGlobalTransform(entity);
        const safeScaleX = Math.abs(globalT.scaleX) < 0.001 ? 0.001 : Math.abs(globalT.scaleX);
        const safeScaleY = Math.abs(globalT.scaleY) < 0.001 ? 0.001 : Math.abs(globalT.scaleY);

        if (entity.components?.TextRenderer) {
            const isCorner = resizeType.length === 2;
            const isSideW = resizeType === 'e' || resizeType === 'w';

            if (isCorner) {
                let dVisualW = resizeType.includes('w') ? -localDx : localDx;
                let dVisualH = resizeType.includes('n') ? -localDy : localDy;
                let anchorX = resizeType.includes('w') ? 1 : 0;
                let anchorY = resizeType.includes('n') ? 1 : 0;

                const initialVisualW = item.w * safeScaleX;
                const initialVisualH = item.h * safeScaleY;
                const denom = (initialVisualW * initialVisualW) + (initialVisualH * initialVisualH);
                let deltaS = denom > 0 
                    ? ((dVisualW * initialVisualW) + (dVisualH * initialVisualH)) / denom 
                    : 0;
                let s = Math.max(0.1, 1 + deltaS);

                const startFontSize = item.fontSize || entity.components.TextRenderer.fontSize || 24;
                const newFontSize = Math.max(6, Math.round(startFontSize * s));
                const newW = Math.max(10, Math.round(item.w * s));

                entity.components.TextRenderer.fontSize = newFontSize;
                t.width = newW;
                ApplyResizeToEntity(entity, this.world, true);
                const newH = t.height;

                const dW_Visual = (newW - item.w) * safeScaleX;
                const dH_Visual = (newH - item.h) * safeScaleY;
                const px = t.pivotX ?? 0.5;
                const py = t.pivotY ?? 0.5;

                let shiftX_World = dW_Visual * (px - anchorX);
                let shiftY_World = dH_Visual * (py - anchorY);

                const rRad = (globalT.rotation || 0) * (Math.PI / 180);
                const wc = Math.cos(rRad), ws = Math.sin(rRad);
                const worldDx = shiftX_World * wc - shiftY_World * ws;
                const worldDy = shiftX_World * ws + shiftY_World * wc;

                let localShiftX = worldDx;
                let localShiftY = worldDy;

                if (entity.parentId) {
                    const parentEntity = this.findEntityInWorld(entity.parentId);
                    if (parentEntity) {
                        const parentGlobal = this.getGlobalTransform(parentEntity);
                        const invRad = -parentGlobal.rotation * (Math.PI / 180);
                        const pCos = Math.cos(invRad);
                        const pSin = Math.sin(invRad);
                        const rotDx = (worldDx * pCos) - (worldDy * pSin);
                        const rotDy = (worldDx * pSin) + (worldDy * pCos);
                        const pScaleX = parentGlobal.scaleX !== 0 ? parentGlobal.scaleX : 1;
                        const pScaleY = parentGlobal.scaleY !== 0 ? parentGlobal.scaleY : 1;
                        localShiftX = rotDx / pScaleX;
                        localShiftY = rotDy / pScaleY;
                    }
                }

                const newX = Math.round(item.x + localShiftX);
                const newY = Math.round(item.y + localShiftY);

                t.x = newX;
                t.y = newY;
                t.overridden = true;
                return { changed: true, newW: t.width, newH: t.height };
            } else if (isSideW) {
                let dVisualW = resizeType === 'w' ? -localDx : localDx;
                let anchorX = resizeType === 'w' ? 1 : 0;

                let rawVisualW = (item.w * safeScaleX) + dVisualW;
                if (shouldSnap) {
                    rawVisualW = Math.round(rawVisualW / (gridSize * safeScaleX)) * (gridSize * safeScaleX);
                }
                const newW = Math.max(10, Math.round(rawVisualW / safeScaleX));

                t.width = newW;
                ApplyResizeToEntity(entity, this.world, true);
                const newH = t.height;

                const dW_Visual = (newW - item.w) * safeScaleX;
                const px = t.pivotX ?? 0.5;
                let shiftX_World = dW_Visual * (px - anchorX);
                let shiftY_World = 0;

                const rRad = (globalT.rotation || 0) * (Math.PI / 180);
                const wc = Math.cos(rRad), ws = Math.sin(rRad);
                const worldDx = shiftX_World * wc - shiftY_World * ws;
                const worldDy = shiftX_World * ws + shiftY_World * wc;

                let localShiftX = worldDx;
                let localShiftY = worldDy;

                if (entity.parentId) {
                    const parentEntity = this.findEntityInWorld(entity.parentId);
                    if (parentEntity) {
                        const parentGlobal = this.getGlobalTransform(parentEntity);
                        const invRad = -parentGlobal.rotation * (Math.PI / 180);
                        const pCos = Math.cos(invRad);
                        const pSin = Math.sin(invRad);
                        const rotDx = (worldDx * pCos) - (worldDy * pSin);
                        const rotDy = (worldDx * pSin) + (worldDy * pCos);
                        const pScaleX = parentGlobal.scaleX !== 0 ? parentGlobal.scaleX : 1;
                        const pScaleY = parentGlobal.scaleY !== 0 ? parentGlobal.scaleY : 1;
                        localShiftX = rotDx / pScaleX;
                        localShiftY = rotDy / pScaleY;
                    }
                }

                const newX = Math.round(item.x + localShiftX);
                const newY = Math.round(item.y + localShiftY);

                t.x = newX;
                t.y = newY;
                t.overridden = true;
                return { changed: true, newW: t.width, newH: t.height };
            }
        }

        let dVisualW = 0, dVisualH = 0;
        let anchorX = null, anchorY = null;

        if (resizeType.includes('w')) { dVisualW = -localDx; anchorX = 1; }
        if (resizeType.includes('e')) { dVisualW = localDx; anchorX = 0; }
        if (resizeType.includes('n')) { dVisualH = -localDy; anchorY = 1; }
        if (resizeType.includes('s')) { dVisualH = localDy; anchorY = 0; }

        let rawVisualW = (item.w * safeScaleX) + dVisualW;
        let rawVisualH = (item.h * safeScaleY) + dVisualH;

        if (isRatioLocked && item.w > 0 && item.h > 0) {
            const baseRatio = item.w / item.h;
            const initialVisualW = item.w * safeScaleX;
            const initialVisualH = item.h * safeScaleY;

            const isCorner = resizeType.length === 2;
            const isHorizontalEdge = resizeType === 'e' || resizeType === 'w';
            const isVerticalEdge = resizeType === 's' || resizeType === 'n';

            if (isHorizontalEdge) {
                anchorY = 0.5;
                if (shouldSnap) {
                    let snapW = gridSize;
                    if (entity.components?.Tilemap) {
                        snapW = (entity.components.Tilemap.tileWidth || gridSize) * safeScaleX;
                    }
                    rawVisualW = Math.round(rawVisualW / snapW) * snapW;
                }
                const rawW = rawVisualW / safeScaleX;
                const rawH = Math.abs(rawW) / baseRatio;
                rawVisualH = rawH * safeScaleY;
            } else if (isVerticalEdge) {
                anchorX = 0.5;
                if (shouldSnap) {
                    let snapH = gridSize;
                    if (entity.components?.Tilemap) {
                        snapH = (entity.components.Tilemap.tileHeight || gridSize) * safeScaleY;
                    }
                    rawVisualH = Math.round(rawVisualH / snapH) * snapH;
                }
                const rawH = rawVisualH / safeScaleY;
                const rawW = Math.abs(rawH) * baseRatio;
                rawVisualW = rawW * safeScaleX;
            } else if (isCorner) {
                const denom = (initialVisualW * initialVisualW) + (initialVisualH * initialVisualH);
                let deltaS = denom > 0 
                    ? ((dVisualW * initialVisualW) + (dVisualH * initialVisualH)) / denom 
                    : 0;
                let s = 1 + deltaS;

                rawVisualW = initialVisualW * s;
                rawVisualH = initialVisualH * s;

                if (shouldSnap) {
                    let snapW = gridSize;
                    let snapH = gridSize;
                    if (entity.components?.Tilemap) {
                        snapW = (entity.components.Tilemap.tileWidth || gridSize) * safeScaleX;
                        snapH = (entity.components.Tilemap.tileHeight || gridSize) * safeScaleY;
                    }

                    if (Math.abs(dVisualW / initialVisualW) >= Math.abs(dVisualH / initialVisualH)) {
                        rawVisualW = Math.round(rawVisualW / snapW) * snapW;
                        s = initialVisualW !== 0 ? rawVisualW / initialVisualW : 1;
                        rawVisualH = initialVisualH * s;
                    } else {
                        rawVisualH = Math.round(rawVisualH / snapH) * snapH;
                        s = initialVisualH !== 0 ? rawVisualH / initialVisualH : 1;
                        rawVisualW = initialVisualW * s;
                    }
                }
            }
        } else {
            if (shouldSnap) {
                let snapW = gridSize;
                let snapH = gridSize;

                if (entity.components?.Tilemap) {
                    const tileW = entity.components.Tilemap.tileWidth || gridSize;
                    const tileH = entity.components.Tilemap.tileHeight || gridSize;
                    snapW = tileW * safeScaleX;
                    snapH = tileH * safeScaleY;
                }

                if (resizeType.includes('w') || resizeType.includes('e')) {
                    rawVisualW = Math.round(rawVisualW / snapW) * snapW;
                }
                if (resizeType.includes('n') || resizeType.includes('s')) {
                    rawVisualH = Math.round(rawVisualH / snapH) * snapH;
                }
            }
        }

        let rawW = rawVisualW / safeScaleX;
        let rawH = rawVisualH / safeScaleY;

        const startFlipX = item.flipX ?? false;
        const startFlipY = item.flipY ?? false;

        const newFlipX = (rawW < 0) ? !startFlipX : startFlipX;
        const newFlipY = (rawH < 0) ? !startFlipY : startFlipY;

        let newW = Math.max(1, Math.round(Math.abs(rawW)));
        let newH = Math.max(1, Math.round(Math.abs(rawH)));

        if (isRatioLocked && item.w > 0 && item.h > 0) {
            const baseRatio = item.w / item.h;
            if (resizeType === 'e' || resizeType === 'w') {
                newH = Math.max(1, Math.round(newW / baseRatio));
            } else if (resizeType === 's' || resizeType === 'n') {
                newW = Math.max(1, Math.round(newH * baseRatio));
            } else if (resizeType.length === 2) {
                const initialVisualW = item.w * safeScaleX;
                const initialVisualH = item.h * safeScaleY;
                if (Math.abs(dVisualW / initialVisualW) >= Math.abs(dVisualH / initialVisualH)) {
                    newH = Math.max(1, Math.round(newW / baseRatio));
                } else {
                    newW = Math.max(1, Math.round(newH * baseRatio));
                }
            }
        }

        // FIX: Calculate continuous dW_Visual & dH_Visual from initial rawVisualW/H
        // to prevent position offset jumping when crossing zero point (flip)
        const dW_Visual = (rawW < 0 ? -newW : newW) - item.w;
        const dH_Visual = (rawH < 0 ? -newH : newH) - item.h;

        const isTilemap = Boolean(entity?.components?.Tilemap);
        const defaultPivotX = isTilemap ? 0 : 0.5;
        const defaultPivotY = isTilemap ? 0 : 0.5;
        const px = t.pivotX ?? defaultPivotX;
        const py = t.pivotY ?? defaultPivotY;

        let shiftX_World = 0, shiftY_World = 0;
        if (anchorX !== null) shiftX_World = (dW_Visual * safeScaleX) * (px - anchorX);
        if (anchorY !== null) shiftY_World = (dH_Visual * safeScaleY) * (py - anchorY);

        const rRad = (globalT.rotation || 0) * (Math.PI / 180);
        const wc = Math.cos(rRad);
        const ws = Math.sin(rRad);

        const worldDx = shiftX_World * wc - shiftY_World * ws;
        const worldDy = shiftX_World * ws + shiftY_World * wc;

        let localShiftX = worldDx;
        let localShiftY = worldDy;

        if (entity.parentId) {
            const parentEntity = this.findEntityInWorld(entity.parentId);
            if (parentEntity) {
                const parentGlobal = this.getGlobalTransform(parentEntity);
                const invRad = -parentGlobal.rotation * (Math.PI / 180);
                const pCos = Math.cos(invRad);
                const pSin = Math.sin(invRad);

                const rotDx = (worldDx * pCos) - (worldDy * pSin);
                const rotDy = (worldDx * pSin) + (worldDy * pCos);

                const pScaleX = parentGlobal.scaleX !== 0 ? parentGlobal.scaleX : 1;
                const pScaleY = parentGlobal.scaleY !== 0 ? parentGlobal.scaleY : 1;

                localShiftX = rotDx / pScaleX;
                localShiftY = rotDy / pScaleY;
            }
        }

        const newX = Math.round(item.x + localShiftX);
        const newY = Math.round(item.y + localShiftY);

        if (t.width !== newW || t.height !== newH || t.x !== newX || t.y !== newY || t.flipX !== newFlipX || t.flipY !== newFlipY) {
            t.flipX = newFlipX;
            t.flipY = newFlipY;
            t.width = newW;
            t.height = newH;
            t.scaleX = Math.abs(t.scaleX ?? 1);
            t.scaleY = Math.abs(t.scaleY ?? 1);
            t.x = newX;
            t.y = newY;
            t.overridden = true;

            ApplyResizeToEntity(entity, this.world);
            return { changed: true, newW, newH };
        }

        return { changed: false, newW, newH };
    }
}