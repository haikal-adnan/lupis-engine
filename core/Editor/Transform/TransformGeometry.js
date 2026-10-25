import { calculateQuadVertices } from "../../Util/calculateQuadVertices.js";
import { TilemapMath } from "../../System/TilemapSystem/TilemapMath.js";
import RenderUtils from "../../Renderer/Scene/RenderUtils.js";

export class TransformGeometry {
    constructor(game, world) {
        this.game = game;
        this.world = world;
        this.handles = [];
        this.groupBounds = null;
        this.activeRotation = 0;
    }

    _getTransform(e) {
        return e?.components && (e.components.UITransform || e.components.Transform);
    }

    _getEntityDimensions(e) {
        const comps = e?.components;
        if (!comps) return { width: 0, height: 0 };
        const t = comps.UITransform || comps.Transform;

        if (comps.Tilemap) {
            const bounds = TilemapMath.getBounds(comps.Tilemap);
            return {
                width: bounds.width,
                height: bounds.height
            };
        }

        return {
            width: t?.width || 0,
            height: t?.height || 0
        };
    }

    _mid(p1, p2) {
        return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    }

    _findEntityInWorld(id) {
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
        const t = this._getTransform(e);
        const isTilemap = Boolean(e?.components?.Tilemap);
        const defaultPivotX = isTilemap ? 0 : 0.5;
        const defaultPivotY = isTilemap ? 0 : 0.5;

        if (!t) return { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, pivotX: defaultPivotX, pivotY: defaultPivotY, width: 100, height: 100 };

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

        const parentEntity = this._findEntityInWorld(e.parentId);
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

    calculateAbsolutePosition(e) {
        const t = this._getTransform(e);
        if (!t) return { x: 0, y: 0 };
        return RenderUtils.calculateAbsolutePosition(e, this.world);
    }

    computeHandles(selectedList) {
        if (!selectedList || !selectedList.length) {
            this.handles = [];
            this.groupBounds = null;
            return;
        }

        this.isSizeLocked = selectedList.some(e =>
            e?.components?.Tilemap
        );

        if (selectedList.length === 1) {
            const e = selectedList[0];
            const t = this._getTransform(e);
            if (!t) return;

            const globalT = this.getGlobalTransform(e);
            const absPos = this.calculateAbsolutePosition(e);
            const rRad = (globalT.rotation || 0) * (Math.PI / 180);

            let v;
            if (e.components?.Tilemap) {
                v = TilemapMath.getTilemapQuadVertices(
                    absPos, 
                    e.components.Tilemap, 
                    rRad, 
                    globalT.scaleX ?? 1, 
                    globalT.scaleY ?? 1
                );
            } else {
                const dims = this._getEntityDimensions(e);
                const isTilemap = Boolean(e?.components?.Tilemap);
                const px = globalT.pivotX ?? (isTilemap ? 0 : 0.5);
                const py = globalT.pivotY ?? (isTilemap ? 0 : 0.5);
                const sx = (t.flipX ? -1 : 1) * (globalT.scaleX ?? 1);
                const sy = (t.flipY ? -1 : 1) * (globalT.scaleY ?? 1);
                v = calculateQuadVertices(
                    absPos.x, absPos.y,
                    dims.width, dims.height,
                    rRad,
                    sx, sy,
                    px, py
                );
            }

            const nw = { type: "nw", x: v.tl.x, y: v.tl.y };
            const ne = { type: "ne", x: v.tr.x, y: v.tr.y };
            const sw = { type: "sw", x: v.bl.x, y: v.bl.y };
            const se = { type: "se", x: v.br.x, y: v.br.y };

            const n = { type: "n", ...this._mid(nw, ne) };
            const e_side = { type: "e", ...this._mid(ne, se) };
            const s = { type: "s", ...this._mid(sw, se) };
            const w = { type: "w", ...this._mid(nw, sw) };

            const hasText = Boolean(e?.components?.TextRenderer);
            if (hasText) {
                this.handles = [nw, ne, sw, se, e_side, w];
            } else {
                this.handles = [nw, ne, sw, se, n, e_side, s, w];
            }
            this.activeRotation = rRad;
            this.groupBounds = { type: 'obb', v };
            return;
        }

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const e of selectedList) {
            const t = this._getTransform(e);
            if (!t) continue;

            const globalT = this.getGlobalTransform(e);
            const absPos = this.calculateAbsolutePosition(e);
            const rRad = (globalT.rotation || 0) * (Math.PI / 180);

            let v;
            if (e.components?.Tilemap) {
                v = TilemapMath.getTilemapQuadVertices(
                    absPos, 
                    e.components.Tilemap, 
                    rRad, 
                    globalT.scaleX ?? 1, 
                    globalT.scaleY ?? 1
                );
            } else {
                const dims = this._getEntityDimensions(e);
                const isTilemap = Boolean(e?.components?.Tilemap);
                const px = globalT.pivotX ?? (isTilemap ? 0 : 0.5);
                const py = globalT.pivotY ?? (isTilemap ? 0 : 0.5);
                const sx = (t.flipX ? -1 : 1) * (globalT.scaleX ?? 1);
                const sy = (t.flipY ? -1 : 1) * (globalT.scaleY ?? 1);
                v = calculateQuadVertices(
                    absPos.x, absPos.y,
                    dims.width, dims.height,
                    rRad,
                    sx, sy,
                    px, py
                );
            }

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
        const scale = this.game?.camera?.scale || 1;

        const baseResizeRad = 6;
        const baseRotateRad = 15;
        const baseCapLen = 16;
        const baseCapThick = 5;
        const baseCornerRad = 4;

        let rResize = baseResizeRad / scale;
        let rRotate = baseRotateRad / scale;
        let capLen = baseCapLen / scale;
        let capThick = baseCapThick / scale;
        let rCorner = baseCornerRad / scale;

        if (this.groupBounds) {
            let objW = 100, objH = 100;
            if (this.groupBounds.type === 'aabb') {
                objW = this.groupBounds.w;
                objH = this.groupBounds.h;
            } else if (this.groupBounds.v) {
                const v = this.groupBounds.v;
                const dx1 = v.tr.x - v.tl.x;
                const dy1 = v.tr.y - v.tl.y;
                objW = Math.sqrt(dx1 * dx1 + dy1 * dy1);
                const dx2 = v.bl.x - v.tl.x;
                const dy2 = v.bl.y - v.tl.y;
                objH = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            }
            const minSide = Math.min(objW, objH);
            const maxResizeRad = minSide * 0.35;
            if (rResize > maxResizeRad) {
                const ratio = maxResizeRad / rResize;
                rResize = maxResizeRad;
                capLen *= ratio;
                capThick *= ratio;
                rCorner *= ratio;
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
            const dist = Math.hypot(dx, dy);

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
        if (!handle) return "default";
        if (handle.mode === 'rotate') {
            return "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\" style=\"fill:white; stroke:black; stroke-width:1px; font-size:24px;\"><text x=\"50%\" y=\"55%\" dominant-baseline=\"middle\" text-anchor=\"middle\">↻</text></svg>') 16 16, alias";
        }
        const map = { nw: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize", se: "nwse-resize", n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize" };
        return map[handle.type] || "default";
    }
}