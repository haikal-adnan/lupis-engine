import { calculateQuadVertices } from "../../Util/calculateQuadVertices.js";

export class HitTester {
    constructor(game) {
        this.game = game;
    }

    _getTransform(e) {
        return e.components && (e.components.UITransform || e.components.Transform);
    }

    isLocked(e) {
        return e.isLocked || (e._editor && e._editor.locked);
    }

    _calculateAbsolutePosition(e, parentBounds) {
        const t = this._getTransform(e);
        if (!t) return { x: 0, y: 0 };

        if (e.components.UITransform) {
            if (!parentBounds) {
                const uiSettings = this.game.world.settings?.ui || { width: 1920, height: 1080 };
                parentBounds = { x: 0, y: 0, width: uiSettings.width, height: uiSettings.height };
            }
            const anchorX = t.anchorX ?? 0.5;
            const anchorY = t.anchorY ?? 0.5;
            return {
                x: parentBounds.x + (parentBounds.width * anchorX) + (t.x || 0),
                y: parentBounds.y + (parentBounds.height * anchorY) + (t.y || 0)
            };
        }
        return { x: t.x || 0, y: t.y || 0 };
    }

    _isPointInEntity(wx, wy, e, parentBounds) {
        const t = this._getTransform(e);
        if (!t) return false;

        const absPos = this._calculateAbsolutePosition(e, parentBounds);

        const r = (t.rotation || 0) * (Math.PI / 180);
        const sx = t.scaleX ?? 1;
        const sy = t.scaleY ?? 1;
        const px = t.pivotX ?? 0.5;
        const py = t.pivotY ?? 0.5;
        const w = t.width;
        const h = t.height;

        let dx = wx - absPos.x;
        let dy = wy - absPos.y;

        const c = Math.cos(-r);
        const s = Math.sin(-r);
        const localX = dx * c - dy * s;
        const localY = dx * s + dy * c;

        const unscaledMouseX = localX / sx;
        const unscaledMouseY = localY / sy;

        const left = -px * w;
        const right = w - (px * w);
        const top = -py * h;
        const bottom = h - (py * h);

        const minX = Math.min(left, right);
        const maxX = Math.max(left, right);
        const minY = Math.min(top, bottom);
        const maxY = Math.max(top, bottom);

        const buffer = 5;

        return (
            unscaledMouseX >= minX - buffer &&
            unscaledMouseX <= maxX + buffer &&
            unscaledMouseY >= minY - buffer &&
            unscaledMouseY <= maxY + buffer
        );
    }

    hit(world, wx, wy, px, py) {
        const filter = this.game.selection?.filter;
        
        const uiSettings = world.settings?.ui || { width: 1920, height: 1080 };
        const uiRootBounds = { x: 0, y: 0, width: uiSettings.width, height: uiSettings.height };

        const layersWorld = world.layersWorld || [];
        const layersUI = world.layersUI || [];
        const allLayers = [...layersWorld, ...layersUI];
        
        allLayers.sort((a, b) => {
             const zA = a.zIndex ?? 0;
             const zB = b.zIndex ?? 0;
             if (zA !== zB) return zB - zA; 
             return (b.orderIndex ?? 0) - (a.orderIndex ?? 0);
        });

        for (const layer of allLayers) {
            if (layer.visible === false || layer.locked) continue;
            
            const isUILayer = layersUI.includes(layer);
            const rootBounds = isUILayer ? uiRootBounds : null;

            if (!layer.entities) continue;
            
            const sortedEntities = [...layer.entities].sort((a, b) => {
                const zA = a.zIndex ?? 0;
                const zB = b.zIndex ?? 0;
                if (zA !== zB) return zB - zA;
                return (b.orderIndex ?? 0) - (a.orderIndex ?? 0);
            });

            for (const e of sortedEntities) {
                if (!e.visible || this.isLocked(e)) continue;
                if (filter && !filter(e, layer)) continue;

                if (this._isPointInEntity(wx, wy, e, rootBounds)) {
                    return e;
                }
            }
        }
        return null;
    }

    checkMarquee(world, box) {
        const results = [];
        const filter = this.game.selection?.filter;
        
        const uiSettings = world.settings?.ui || { width: 1920, height: 1080 };
        const uiRootBounds = { x: 0, y: 0, width: uiSettings.width, height: uiSettings.height };

        const layersWorld = world.layersWorld || [];
        const layersUI = world.layersUI || [];
        const allLayers = [...layersWorld, ...layersUI];

        for (const layer of allLayers) {
            if (layer.visible === false || layer.locked) continue;
            
            const isUILayer = layersUI.includes(layer);
            const rootBounds = isUILayer ? uiRootBounds : null;

            if (!layer.entities) continue;

            for (const e of layer.entities) {
                if (!e.visible || this.isLocked(e)) continue;
                if (filter && !filter(e, layer)) continue;

                const t = this._getTransform(e);
                if (!t) continue;

                const absPos = this._calculateAbsolutePosition(e, rootBounds);

                const sx = t.scaleX ?? 1;
                const sy = t.scaleY ?? 1;
                const w = (t.width || 0) * sx;
                const h = (t.height || 0) * sy;
                const px = t.pivotX ?? 0.5;
                const py = t.pivotY ?? 0.5;
                const r = (t.rotation || 0) * (Math.PI / 180);

                const minX = -px * w;
                const maxX = w - (px * w);
                const minY = -py * h;
                const maxY = h - (py * h);

                const localCorners = [
                    { x: minX, y: minY },
                    { x: maxX, y: minY }, 
                    { x: minX, y: maxY },
                    { x: maxX, y: maxY } 
                ];

                let eLeft = Infinity, eRight = -Infinity;
                let eTop = Infinity, eBottom = -Infinity;

                const cosR = Math.cos(r);
                const sinR = Math.sin(r);

                for (const pt of localCorners) {
                    const rotatedX = pt.x * cosR - pt.y * sinR + absPos.x;
                    const rotatedY = pt.x * sinR + pt.y * cosR + absPos.y;

                    eLeft = Math.min(eLeft, rotatedX);
                    eRight = Math.max(eRight, rotatedX);
                    eTop = Math.min(eTop, rotatedY);
                    eBottom = Math.max(eBottom, rotatedY);
                }

                const isOverlapping = !(
                    box.x + box.w < eLeft ||  
                    box.x > eRight ||        
                    box.y + box.h < eTop ||  
                    box.y > eBottom         
                );

                if (isOverlapping) {
                    results.push(e);
                }
            }
        }
        
        return results; 
    }
}