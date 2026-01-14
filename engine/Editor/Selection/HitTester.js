import { calculateQuadVertices } from "../../Util/calculateQuadVertices.js";

export class HitTester {
    constructor(game) {
        this.game = game;
    }

    getTransform(e) {
        return e.components && e.components.Transform;
    }

    isLocked(e) {
        return e._editor && e._editor.locked;
    }

    getAABB(e) {
        const t = this.getTransform(e);
        if (!t) return { x: 0, y: 0, w: 0, h: 0 };

        const r = t.rotation || 0;
        const sx = t.scaleX ?? 1;
        const sy = t.scaleY ?? 1;
        const px = t.pivotX ?? 0.5;
        const py = t.pivotY ?? 0.5;

        const v = calculateQuadVertices(t.x, t.y, t.width, t.height, r, sx, sy, px, py);
        const xs = [v.tl.x, v.tr.x, v.bl.x, v.br.x];
        const ys = [v.tl.y, v.tr.y, v.bl.y, v.br.y];

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    isPointInEntity(wx, wy, e) {
        const t = this.getTransform(e);
        if (!t) return false;

        const r = t.rotation || 0;
        const sx = t.scaleX ?? 1;
        const sy = t.scaleY ?? 1;
        const px = t.pivotX ?? 0.5;
        const py = t.pivotY ?? 0.5;
        const w = t.width;
        const h = t.height;

        let dx = wx - t.x;
        let dy = wy - t.y;

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

        const buffer = 5 / Math.abs(this.game.camera.scale || 1);

        return (
            unscaledMouseX >= minX - buffer &&
            unscaledMouseX <= maxX + buffer &&
            unscaledMouseY >= minY - buffer &&
            unscaledMouseY <= maxY + buffer
        );
    }

    _hitTestRecursive(entities, wx, wy) {
        for (let i = entities.length - 1; i >= 0; i--) {
            const e = entities[i];
            if (!e.visible || this.isLocked(e)) continue;

            if (e.children && e.children.length > 0) {
                const childHit = this._hitTestRecursive(e.children, wx, wy);
                if (childHit) return childHit;
            }

            if (e.type !== 'group') {
                if (this.isPointInEntity(wx, wy, e)) {
                    return e;
                }
            }
        }
        return null;
    }

    hit(world, wx, wy) {
        for (let li = world.layers.length - 1; li >= 0; li--) {
            const layer = world.layers[li];
            if (!layer.visible || layer.locked) continue;

            const found = this._hitTestRecursive(layer.entities, wx, wy);
            if (found) return found;
        }
        return null;
    }

    _checkMarqueeRecursive(entities, box, list) {
        for (const e of entities) {
            if (!e.visible || this.isLocked(e)) continue;

            if (e.type === 'group') {
                if (e.children?.length) this._checkMarqueeRecursive(e.children, box, list);
                continue;
            }

            const t = this.getTransform(e);
            if (t) {
                const b = this.getAABB(e);
                const overlap =
                    b.x < box.x + box.w &&
                    b.x + b.w > box.x &&
                    b.y < box.y + box.h &&
                    b.y + b.h > box.y;
                if (overlap) list.push(e);
            }

            if (e.children?.length) this._checkMarqueeRecursive(e.children, box, list);
        }
    }

    checkMarquee(world, box) {
        const list = [];
        for (const layer of world.layers) {
            if (!layer.visible || layer.locked) continue;
            this._checkMarqueeRecursive(layer.entities, box, list);
        }
        return list;
    }
}