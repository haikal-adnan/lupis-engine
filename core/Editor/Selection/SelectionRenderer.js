import { calculateQuadVertices } from "../../Util/calculateQuadVertices.js";
import { TilemapMath } from "../../Editor/Tilemap/TilemapMath.js";
import RenderUtils from "../../Renderer/Scene/RenderUtils.js";

export class SelectionRenderer {
    constructor(game, transformEngine) {
        this.game = game;
        this.engine = transformEngine;
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

    _calculateAbsolutePosition(e) {
        const t = this.engine.getTransform(e);
        if (!t) return { x: 0, y: 0 };
        return RenderUtils.calculateAbsolutePosition(e, this.game.world);
    }

    draw(shape, proj, selectedList, hoveredEntity, marqueeBox) {
        const scale = this.game.camera.scale || 1;
        const lineThick = 2 / scale;

        if (hoveredEntity && !selectedList.includes(hoveredEntity)) {
            const hoverColor = [1, 1, 1, 0.5];
            this.drawObb(shape, hoveredEntity, hoverColor, proj, 1 / scale);
        }

        const selectColor = [0, 0.6, 1, 1];
        for (const e of selectedList) {
            this.drawObb(shape, e, selectColor, proj, lineThick);
        }

        if (marqueeBox) {
            const mc = [0, 0.6, 1, 0.15];
            const mb = [0, 0.6, 1, 0.8];

            const x1 = marqueeBox.x;
            const y1 = marqueeBox.y;
            const x2 = marqueeBox.x + marqueeBox.w;
            const y2 = marqueeBox.y + marqueeBox.h;

            const quad = [
                { x: x1, y: y1 },
                { x: x2, y: y1 },
                { x: x2, y: y2 },
                { x: x1, y: y2 }
            ];

            if (shape._fillConvexPolygon) {
                shape._fillConvexPolygon(quad, mc);
            }

            shape.drawLine(x1, y1, x2, y1, mb, lineThick, proj);
            shape.drawLine(x2, y1, x2, y2, mb, lineThick, proj);
            shape.drawLine(x2, y2, x1, y2, mb, lineThick, proj);
            shape.drawLine(x1, y2, x1, y1, mb, lineThick, proj);
        }
    }

    drawObb(shape, e, color, proj, thickness = 2) {
        if (!e || !e.visible || e.type === 'layer' || !e.components) return;
        const t = this.engine.getTransform(e);
        if (!t) return;

        const globalT = this.engine.getGlobalTransform(e);
        const absPos = this._calculateAbsolutePosition(e);
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
            const isTilemap = Boolean(e.components?.Tilemap);
            const px = globalT.pivotX ?? (isTilemap ? 0 : 0.5);
            const py = globalT.pivotY ?? (isTilemap ? 0 : 0.5);
            const sx = (t.flipX ? -1 : 1) * (globalT.scaleX ?? 1);
            const sy = (t.flipY ? -1 : 1) * (globalT.scaleY ?? 1);
            v = calculateQuadVertices(absPos.x, absPos.y, dims.width, dims.height, rRad, sx, sy, px, py);
        }

        shape.drawLine(v.tl.x, v.tl.y, v.tr.x, v.tr.y, color, thickness, proj);
        shape.drawLine(v.tr.x, v.tr.y, v.br.x, v.br.y, color, thickness, proj);
        shape.drawLine(v.br.x, v.br.y, v.bl.x, v.bl.y, color, thickness, proj);
        shape.drawLine(v.bl.x, v.bl.y, v.tl.x, v.tl.y, color, thickness, proj);
    }
}