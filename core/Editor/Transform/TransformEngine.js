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
        if (!t) return { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };

        if (!e.parentId) {
            return {
                x: t.x || 0,
                y: t.y || 0,
                rotation: t.rotation || 0,
                scaleX: t.scaleX ?? 1,
                scaleY: t.scaleY ?? 1
            };
        }

        const parentEntity = this.findEntityInWorld(e.parentId);
        if (!parentEntity) return { ...t };

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
            scaleY: parentGlobal.scaleY * (t.scaleY ?? 1)
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

    applyResize(entity, item, localDx, localDy, resizeType, shouldSnap = false, gridSize = 32) {
        const t = this.getTransform(entity);
        if (!t) return false;

        const globalT = this.getGlobalTransform(entity);
        const safeScaleX = Math.abs(globalT.scaleX) < 0.001 ? 0.001 : Math.abs(globalT.scaleX);
        const safeScaleY = Math.abs(globalT.scaleY) < 0.001 ? 0.001 : Math.abs(globalT.scaleY);

        let dVisualW = 0, dVisualH = 0;
        let anchorX = null, anchorY = null;

        if (resizeType.includes('w')) { dVisualW = -localDx; anchorX = 1; }
        if (resizeType.includes('e')) { dVisualW = localDx; anchorX = 0; }
        if (resizeType.includes('n')) { dVisualH = -localDy; anchorY = 1; }
        if (resizeType.includes('s')) { dVisualH = localDy; anchorY = 0; }

        let rawVisualW = (item.w * safeScaleX) + dVisualW;
        let rawVisualH = (item.h * safeScaleY) + dVisualH;

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

        let rawW = rawVisualW / safeScaleX;
        let rawH = rawVisualH / safeScaleY;

        const startFlipX = item.flipX ?? false;
        const startFlipY = item.flipY ?? false;

        const newFlipX = (rawW < 0) ? !startFlipX : startFlipX;
        const newFlipY = (rawH < 0) ? !startFlipY : startFlipY;

        const newW = Math.max(1, Math.round(Math.abs(rawW)));
        const newH = Math.max(1, Math.round(Math.abs(rawH)));

        // FIX: Hitung dW_Visual & dH_Visual secara kontinu dari rawVisualW/H awal
        // agar offset posisi tidak melompat ketika melewati titik nol (flip)
        const dW_Visual = (rawW < 0 ? -newW : newW) - item.w;
        const dH_Visual = (rawH < 0 ? -newH : newH) - item.h;

        let shiftX_World = 0, shiftY_World = 0;
        if (anchorX !== null) shiftX_World = (dW_Visual * safeScaleX) * ((t.pivotX ?? 0.5) - anchorX);
        if (anchorY !== null) shiftY_World = (dH_Visual * safeScaleY) * ((t.pivotY ?? 0.5) - anchorY);

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