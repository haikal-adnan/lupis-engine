import { calculateQuadVertices } from "../../Util/calculateQuadVertices.js";

export class TransformGeometry {
    constructor(game, world) {
        this.game = game;
        this.world = world; 
        this.handles = [];
        this.groupBounds = null;
        this.activeRotation = 0;
    }

    _getTransform(e) {
        return e.components && (e.components.UITransform || e.components.Transform);
    }

    _mid(p1, p2) {
        return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    }

    calculateAbsolutePosition(e) {
        const t = this._getTransform(e);
        if (!t) return { x: 0, y: 0 };

        if (!e.components.UITransform) {
            return { x: t.x, y: t.y };
        }

        const uiSettings = this.world.settings?.ui || { width: 1920, height: 1080 };
        const parentBounds = { x: 0, y: 0, width: uiSettings.width, height: uiSettings.height };

        const anchorX = t.anchorX ?? 0.5;
        const anchorY = t.anchorY ?? 0.5;
        const anchorPointX = parentBounds.x + (parentBounds.width * anchorX);
        const anchorPointY = parentBounds.y + (parentBounds.height * anchorY);

        return { 
            x: anchorPointX + (t.x || 0), 
            y: anchorPointY + (t.y || 0) 
        };
    }

    computeHandles(selectedList) {
        if (!selectedList || !selectedList.length) {
            this.handles = [];
            this.groupBounds = null;
            return;
        }

        this.isSizeLocked = false;
        if (selectedList && selectedList.length > 0) {
            this.isSizeLocked = selectedList.some(e => 
                e.components?.TextRenderer?.autoFit || 
                e.components?.Tilemap?.autoFit
            );
        }

        if (selectedList.length === 1) {
            const e = selectedList[0];
            const t = this._getTransform(e);
            if (!t) return;

            const absPos = this.calculateAbsolutePosition(e);
            const rRad = (t.rotation || 0) * (Math.PI / 180);
            
            const v = calculateQuadVertices(absPos.x, absPos.y, t.width, t.height, rRad, t.scaleX??1, t.scaleY??1, t.pivotX??0.5, t.pivotY??0.5);

            const nw = { type: "nw", x: v.tl.x, y: v.tl.y };
            const ne = { type: "ne", x: v.tr.x, y: v.tr.y };
            const sw = { type: "sw", x: v.bl.x, y: v.bl.y };
            const se = { type: "se", x: v.br.x, y: v.br.y };

            const n = { type: "n", ...this._mid(nw, ne) };
            const e_side = { type: "e", ...this._mid(ne, se) };
            const s = { type: "s", ...this._mid(sw, se) };
            const w = { type: "w", ...this._mid(nw, sw) };

            this.handles = [nw, ne, sw, se, n, e_side, s, w];
            this.activeRotation = rRad; 
            this.groupBounds = { type: 'obb', v };
            return;
        }

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const e of selectedList) {
            const t = this._getTransform(e);
            if (!t) continue;
            
            const absPos = this.calculateAbsolutePosition(e);
            const rRad = (t.rotation || 0) * (Math.PI / 180);
            const v = calculateQuadVertices(absPos.x, absPos.y, t.width, t.height, rRad, t.scaleX??1, t.scaleY??1, t.pivotX??0.5, t.pivotY??0.5);
            
            const xs = [v.tl.x, v.tr.x, v.bl.x, v.br.x];
            const ys = [v.tl.y, v.tr.y, v.bl.y, v.br.y];

            minX = Math.min(minX, ...xs);
            maxX = Math.max(maxX, ...xs);
            minY = Math.min(minY, ...ys);
            maxY = Math.max(maxY, ...ys);
        }

        this.groupBounds = { type: 'aabb', x: minX, y: minY, w: maxX - minX, h: maxY - minY };

        const nw = { type: "nw", x: minX, y: minY };
        const ne = { type: "ne", x: maxX, y: minY };
        const sw = { type: "sw", x: minX, y: maxY };
        const se = { type: "se", x: maxX, y: maxY };

        const n = { type: "n", ...this._mid(nw, ne) };
        const e_side = { type: "e", ...this._mid(ne, se) };
        const s = { type: "s", ...this._mid(sw, se) };
        const w = { type: "w", ...this._mid(nw, sw) };

        this.handles = [nw, ne, sw, se, n, e_side, s, w];
        this.activeRotation = 0; 
    }

    computeGroupBounds() {
        if (!this.groupBounds) return null;
        if (this.groupBounds.type === 'aabb') return this.groupBounds;
        if (this.groupBounds.type === 'obb') {
            const v = this.groupBounds.v;
            const xs = [v.tl.x, v.tr.x, v.bl.x, v.br.x];
            const ys = [v.tl.y, v.tr.y, v.bl.y, v.br.y];
            return {
                x: Math.min(...xs), y: Math.min(...ys),
                w: Math.max(...xs) - Math.min(...xs),
                h: Math.max(...ys) - Math.min(...ys)
            };
        }
        return null;
    }

    getHandleSizes() {
        const scale = this.game.camera.scale || 1;
        
        const baseResizeRad = 10;
        const baseRotateRad = 30;
        const baseCapLen = 24;
        const baseCapThick = 6;
        const baseCornerRad = 5;

        let rResize = baseResizeRad / scale;
        let rRotate = baseRotateRad / scale;
        let capLen = baseCapLen / scale;
        let capThick = baseCapThick / scale;
        let rCorner = baseCornerRad / scale;

        if (this.groupBounds) {
            let objW = 100, objH = 100;
            if (this.groupBounds.type === 'aabb') {
                objW = this.groupBounds.w; objH = this.groupBounds.h;
            } else if (this.groupBounds.v) {
                const v = this.groupBounds.v;
                const dx1 = v.tr.x - v.tl.x; const dy1 = v.tr.y - v.tl.y;
                objW = Math.sqrt(dx1*dx1 + dy1*dy1);
                const dx2 = v.bl.x - v.tl.x; const dy2 = v.bl.y - v.tl.y;
                objH = Math.sqrt(dx2*dx2 + dy2*dy2);
            }
            const minSide = Math.min(objW, objH);
            const maxResizeRad = minSide * 0.35;
            if (rResize > maxResizeRad) {
                const ratio = maxResizeRad / rResize;
                rResize = maxResizeRad;
                capLen *= ratio; capThick *= ratio; rCorner *= ratio;
            }
            const maxRotateRad = minSide * 0.45;
            if (rRotate > maxRotateRad) rRotate = maxRotateRad;
            if (rRotate < rResize) rRotate = rResize * 1.1; 
        }
        return { rResize, rRotate, capLen, capThick, rCorner };
    }

    getHoverHandle(wx, wy) {
        const sizes = this.getHandleSizes();
        for (const h of this.handles) {
            const dx = wx - h.x;
            const dy = wy - h.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist <= sizes.rResize && !this.isSizeLocked) {
                return { ...h, mode: 'resize', type: h.type };
            }
            if (h.type.length === 2 && dist <= sizes.rRotate) {
                return { ...h, mode: 'rotate', type: h.type };
            }
        }
        return null;
    }

    getCursor(handle) {
        if (handle.mode === 'rotate') return "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\" style=\"fill:white; stroke:black; stroke-width:1px; font-size:24px;\"><text x=\"50%\" y=\"55%\" dominant-baseline=\"middle\" text-anchor=\"middle\">↻</text></svg>') 16 16, alias";
        const map = { nw: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize", se: "nwse-resize", n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize" };
        return map[handle.type];
    }
}