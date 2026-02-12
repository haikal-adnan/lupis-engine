import { calculateQuadVertices } from "../../Util/calculateQuadVertices.js";

export class HitTester {
    constructor(game) {
        this.game = game;
    }

    getTransform(e) {
        return e.components && (e.components.UITransform || e.components.Transform);
    }

    isLocked(e) {
        return e.isLocked || (e._editor && e._editor.locked);
    }

    // --- COORDINATE UTILS ---

    _calculateAbsolutePosition(e, parentBounds) {
        const t = this.getTransform(e);
        if (!t) return { x: 0, y: 0 };

        // Jika bukan UI, gunakan World Coordinates standar
        if (!e.components.UITransform) {
            return { x: t.x, y: t.y };
        }

        // Jika UI, perlu parent bounds (screen/panel)
        if (!parentBounds) {
            const uiSettings = this.game.world.settings?.ui || { referenceWidth: 1920, referenceHeight: 1080 };
            parentBounds = { x: 0, y: 0, width: uiSettings.referenceWidth, height: uiSettings.referenceHeight };
        }

        const anchorX = t.anchorX ?? 0.5;
        const anchorY = t.anchorY ?? 0.5;

        const anchorPointX = parentBounds.x + (parentBounds.width * anchorX);
        const anchorPointY = parentBounds.y + (parentBounds.height * anchorY);

        const finalX = anchorPointX + (t.x || 0);
        const finalY = anchorPointY + (t.y || 0);

        return { x: finalX, y: finalY };
    }

    _calculateEntityBounds(e, absPos) {
        const t = this.getTransform(e);
        if (!t) return { x: 0, y: 0, width: 0, height: 0 };

        const pX = t.pivotX ?? 0.5;
        const pY = t.pivotY ?? 0.5;
        const sX = t.scaleX ?? 1;
        const sY = t.scaleY ?? 1;

        return {
            x: absPos.x - (t.width * pX * sX),
            y: absPos.y - (t.height * pY * sY),
            width: t.width * sX,
            height: t.height * sY
        };
    }

    // --- GEOMETRY UTILS ---

    getAABB(e) {
        const absPos = this._calculateAbsolutePosition(e, null); 
        
        const t = this.getTransform(e);
        const r = (t.rotation || 0) * (Math.PI / 180);
        const sx = t.scaleX ?? 1;
        const sy = t.scaleY ?? 1;
        const px = t.pivotX ?? 0.5;
        const py = t.pivotY ?? 0.5;

        const v = calculateQuadVertices(absPos.x, absPos.y, t.width, t.height, r, sx, sy, px, py);
        const xs = [v.tl.x, v.tr.x, v.bl.x, v.br.x];
        const ys = [v.tl.y, v.tr.y, v.bl.y, v.br.y];

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    isPointInEntity(wx, wy, e, parentBounds) {
        const t = this.getTransform(e);
        if (!t) return false;

        const absPos = this._calculateAbsolutePosition(e, parentBounds);

        // Transform logic (Rotation, Scale, Pivot)
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

        const scaleFactor = Math.abs(this.game.camera.scale || 1);
        const buffer = 5 / scaleFactor; // Hit tolerance

        return (
            unscaledMouseX >= minX - buffer &&
            unscaledMouseX <= maxX + buffer &&
            unscaledMouseY >= minY - buffer &&
            unscaledMouseY <= maxY + buffer
        );
    }

    // --- MAIN HIT TEST LOGIC ---

    _hitTestRecursive(entities, wx, wy, layer, filter, parentBounds) {
        // Iterate backwards (Top to Bottom visually)
        // Entities terakhir di array digambar paling depan, jadi di-cek duluan.
        
        // Sorting internal (Temporary) untuk memastikan hit test akurat sesuai Z-Index
        // Idealnya array entities sudah sorted, tapi kita sort lagi untuk safety di hit test
        const sortedEntities = [...entities].sort((a, b) => {
             const zA = a.zIndex ?? 0;
             const zB = b.zIndex ?? 0;
             if (zA !== zB) return zA - zB;
             return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
        });

        for (let i = sortedEntities.length - 1; i >= 0; i--) {
            const e = sortedEntities[i];
            
            if (!e.visible || this.isLocked(e)) continue;
            if (filter && !filter(e, layer)) continue;

            const absPos = this._calculateAbsolutePosition(e, parentBounds);
            const myBoundsForChildren = this._calculateEntityBounds(e, absPos);

            // Cek Children dulu (biasanya di atas parent)
            if (e.children && e.children.length > 0) {
                const childHit = this._hitTestRecursive(e.children, wx, wy, layer, filter, myBoundsForChildren);
                if (childHit) return childHit;
            }

            // Cek diri sendiri
            if (e.type !== 'group') {
                if (this.isPointInEntity(wx, wy, e, parentBounds)) {
                    return e;
                }
            }
        }
        return null;
    }

    hit(world, wx, wy, px, py) {
        const filter = this.game.selection?.filter;
        
        const uiSettings = world.settings?.ui || { referenceWidth: 1920, referenceHeight: 1080 };
        const uiRootBounds = {
            x: 0, y: 0,
            width: uiSettings.referenceWidth,
            height: uiSettings.referenceHeight
        };

        // Combine Layers
        const allLayers = [...(world.layersUI || []), ...(world.layersWorld || [])];
        
        // Sort Layers (UI diatas World, High Z diatas Low Z)
        // Hit test dari DEPAN ke BELAKANG -> Sort Descending
        allLayers.sort((a, b) => {
             const zA = a.zIndex ?? 0;
             const zB = b.zIndex ?? 0;
             if (zA !== zB) return zB - zA; // Descending
             return (b.orderIndex ?? 0) - (a.orderIndex ?? 0); // Descending
        });

        for (let li = 0; li < allLayers.length; li++) {
            const layer = allLayers[li];
            
            if (layer.visible === false || layer.locked) continue;

            const isUILayer = layer.scriptId === 'ui' || layer.name === 'UI' || (layer._id && layer._id.includes('ui'));
            const rootBounds = isUILayer ? uiRootBounds : null;

            const found = this._hitTestRecursive(layer.entities, wx, wy, layer, filter, rootBounds);
            
            if (found) return found;
        }
        return null;
    }

    _checkMarqueeRecursive(entities, box, list, layer, filter, parentBounds) {
        for (const e of entities) {
            if (!e.visible || this.isLocked(e)) continue;
            if (filter && !filter(e, layer)) continue;

            const absPos = this._calculateAbsolutePosition(e, parentBounds);
            const myBoundsForChildren = this._calculateEntityBounds(e, absPos);

            if (e.type === 'group') {
                if (e.children?.length) this._checkMarqueeRecursive(e.children, box, list, layer, filter, myBoundsForChildren);
                continue;
            }

            const t = this.getTransform(e);
            if (t) {
                const r = (t.rotation || 0) * (Math.PI / 180);
                const sx = t.scaleX ?? 1;
                const sy = t.scaleY ?? 1;
                const px = t.pivotX ?? 0.5;
                const py = t.pivotY ?? 0.5;

                const v = calculateQuadVertices(absPos.x, absPos.y, t.width, t.height, r, sx, sy, px, py);
                const xs = [v.tl.x, v.tr.x, v.bl.x, v.br.x];
                const ys = [v.tl.y, v.tr.y, v.bl.y, v.br.y];
                
                const b = { 
                    x: Math.min(...xs), y: Math.min(...ys), 
                    w: Math.max(...xs) - Math.min(...xs), 
                    h: Math.max(...ys) - Math.min(...ys) 
                };

                const overlap =
                    b.x < box.x + box.w &&
                    b.x + b.w > box.x &&
                    b.y < box.y + box.h &&
                    b.y + b.h > box.y;
                
                if (overlap) list.push(e);
            }

            if (e.children?.length) this._checkMarqueeRecursive(e.children, box, list, layer, filter, myBoundsForChildren);
        }
    }

    checkMarquee(world, box) {
        const filter = this.game.selection?.filter;
        const list = [];
        
        const uiSettings = world.settings?.ui || { referenceWidth: 1920, referenceHeight: 1080 };
        const uiRootBounds = { x: 0, y: 0, width: uiSettings.referenceWidth, height: uiSettings.referenceHeight };

        const allLayers = [...(world.layersWorld || []), ...(world.layersUI || [])];

        for (const layer of allLayers) {
            if (layer.visible === false || layer.locked) continue;
            
            const isUILayer = layer.scriptId === 'ui' || layer.name === 'UI' || (layer._id && layer._id.includes('ui'));
            const rootBounds = isUILayer ? uiRootBounds : null;

            this._checkMarqueeRecursive(layer.entities, box, list, layer, filter, rootBounds);
        }
        return list;
    }
}