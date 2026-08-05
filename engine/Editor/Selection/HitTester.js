import { calculateQuadVertices } from "../../Util/calculateQuadVertices.js";

export class HitTester {
    constructor(game) {
        this.game = game;
    }

    _getTransform(e) {
        return e.components && (e.components.UITransform || e.components.Transform);
    }

    locked(e) {
        return e.locked || (e._editor && e._editor.locked);
    }

    _findEntityById(id) {
        const allLayers = [...(this.game.world.layersWorld || []), ...(this.game.world.layersUI || [])];
        for (const layer of allLayers) {
            if (layer.entities) {
                const found = layer.entities.find(e => String(e.id || e._id) === String(id));
                if (found) return found;
            }
        }
        return null;
    }

    getGlobalTransform(e) {
        const t = this._getTransform(e);
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

        const parentEntity = this._findEntityById(e.parentId);
        if (!parentEntity) return { ...t }; 

        const parentGlobal = this.getGlobalTransform(parentEntity);

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

    _calculateAbsolutePosition(e, parentBounds) {
        const t = this._getTransform(e);
        if (!t) return { x: 0, y: 0 };

        const globalT = this.getGlobalTransform(e);

        if (e.components.UITransform) {
            if (!parentBounds) {
                const uiSettings = this.game.world.settings?.ui || { width: 1920, height: 1080 };
                parentBounds = { x: 0, y: 0, width: uiSettings.width, height: uiSettings.height };
            }
            const anchorX = t.anchorX ?? 0.5;
            const anchorY = t.anchorY ?? 0.5;
            return {
                x: parentBounds.x + (parentBounds.width * anchorX) + (globalT.x || 0),
                y: parentBounds.y + (parentBounds.height * anchorY) + (globalT.y || 0)
            };
        }
        return { x: globalT.x || 0, y: globalT.y || 0 };
    }

    _isPointInEntity(wx, wy, e, parentBounds) {
        const t = this._getTransform(e);
        if (!t) return false;

        const globalT = this.getGlobalTransform(e);
        const absPos = this._calculateAbsolutePosition(e, parentBounds);

        const r = (globalT.rotation || 0) * (Math.PI / 180);
        const sx = globalT.scaleX ?? 1;
        const sy = globalT.scaleY ?? 1;
        const px = globalT.pivotX ?? 0.5;
        const py = globalT.pivotY ?? 0.5;
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
            if (layer.active === false || layer.visible === false || layer.locked) continue;
            
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
                if (!e.visible || this.locked(e)) continue;
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
            if (layer.active === false || layer.visible === false || layer.locked) continue;
            
            const isUILayer = layersUI.includes(layer);
            const rootBounds = isUILayer ? uiRootBounds : null;

            if (!layer.entities) continue;

            for (const e of layer.entities) {
                if (!e.visible || this.locked(e)) continue;
                if (filter && !filter(e, layer)) continue;

                const t = this._getTransform(e);
                if (!t) continue;

                const globalT = this.getGlobalTransform(e);
                const absPos = this._calculateAbsolutePosition(e, rootBounds);

                const r = (globalT.rotation || 0) * (Math.PI / 180);
                const sx = globalT.scaleX ?? 1;
                const sy = globalT.scaleY ?? 1;
                const px = globalT.pivotX ?? 0.5;
                const py = globalT.pivotY ?? 0.5;

                const v = calculateQuadVertices(absPos.x, absPos.y, t.width, t.height, r, sx, sy, px, py);

                const xs = [v.tl.x, v.tr.x, v.br.x, v.bl.x];
                const ys = [v.tl.y, v.tr.y, v.br.y, v.bl.y];

                const eLeft = Math.min(...xs);
                const eRight = Math.max(...xs);
                const eTop = Math.min(...ys);
                const eBottom = Math.max(...ys);

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

    getGlobalPosition(e) {
        const isUI = this.game.world.layersUI.some(l => l._id === e.layerId);
        let rootBounds = null;

        if (isUI) {
            const uiSettings = this.game.world.settings?.ui || { width: 1920, height: 1080 };
            rootBounds = { x: 0, y: 0, width: uiSettings.width, height: uiSettings.height };
        }

        return this._calculateAbsolutePosition(e, rootBounds);
    }

    solveLocalPosition(parentEntity, worldX, worldY) {
        return {
            x: worldX,
            y: worldY
        };
    }
}