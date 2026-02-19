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
                const uiSettings = this.game.world.settings?.ui || { referenceWidth: 1920, referenceHeight: 1080 };
                parentBounds = { x: 0, y: 0, width: uiSettings.referenceWidth, height: uiSettings.referenceHeight };
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
        
        const uiSettings = world.settings?.ui || { referenceWidth: 1920, referenceHeight: 1080 };
        const uiRootBounds = { x: 0, y: 0, width: uiSettings.referenceWidth, height: uiSettings.referenceHeight };

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
        
        const uiSettings = world.settings?.ui || { referenceWidth: 1920, referenceHeight: 1080 };
        const uiRootBounds = { x: 0, y: 0, width: uiSettings.referenceWidth, height: uiSettings.referenceHeight };

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

                // 1. Dapatkan posisi absolut
                const absPos = this._calculateAbsolutePosition(e, rootBounds);

                // 2. Ambil data transform (scale, ukuran asli, pivot, dan rotasi)
                const sx = t.scaleX ?? 1;
                const sy = t.scaleY ?? 1;
                const w = (t.width || 0) * sx;
                const h = (t.height || 0) * sy;
                const px = t.pivotX ?? 0.5;
                const py = t.pivotY ?? 0.5;
                const r = (t.rotation || 0) * (Math.PI / 180);

                // 3. Hitung keempat sudut entity berdasarkan pivot (titik acuan lokal)
                const minX = -px * w;
                const maxX = w - (px * w);
                const minY = -py * h;
                const maxY = h - (py * h);

                const localCorners = [
                    { x: minX, y: minY }, // Kiri atas
                    { x: maxX, y: minY }, // Kanan atas
                    { x: minX, y: maxY }, // Kiri bawah
                    { x: maxX, y: maxY }  // Kanan bawah
                ];

                // 4. Transformasikan sudut tersebut dengan rotasi dan posisi absolut
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

                // 5. Cek AABB overlap: apakah kotak entity tumpang tindih dengan kotak marquee?
                const isOverlapping = !(
                    box.x + box.w < eLeft ||   // Marquee berada di kiri entity
                    box.x > eRight ||          // Marquee berada di kanan entity
                    box.y + box.h < eTop ||    // Marquee berada di atas entity
                    box.y > eBottom            // Marquee berada di bawah entity
                );

                if (isOverlapping) {
                    results.push(e);
                }
            }
        }
        
        return results; 
    }
}