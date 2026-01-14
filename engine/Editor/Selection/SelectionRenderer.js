import { calculateQuadVertices } from "../../Util/calculateQuadVertices.js";

export class SelectionRenderer {
    constructor(game) {
        this.game = game;
        this.outlineColor = [0, 0.55, 1, 1];
    }

    getTransform(e) {
        return e.components && e.components.Transform;
    }

    draw(shape, proj, selectedList, hovered, marqueeBox, transformTool) {
        this.drawHover(shape, proj, hovered, selectedList, transformTool);
        this.drawSelected(shape, proj, selectedList);
        
        if (transformTool) transformTool.draw(shape, proj);
        
        if (marqueeBox) this.drawMarquee(shape, proj, marqueeBox);
    }

    drawObb(shape, e, color, proj) {
        const t = this.getTransform(e);
        if (!t) return;

        const r = t.rotation || 0;
        const sx = t.scaleX ?? 1;
        const sy = t.scaleY ?? 1;
        const px = t.pivotX ?? 0.5;
        const py = t.pivotY ?? 0.5;

        const v = calculateQuadVertices(t.x, t.y, t.width, t.height, r, sx, sy, px, py);
        const strokeT = 2 / this.game.camera.scale;

        shape.drawLine(v.tl.x, v.tl.y, v.tr.x, v.tr.y, color, strokeT, proj);
        shape.drawLine(v.tr.x, v.tr.y, v.br.x, v.br.y, color, strokeT, proj);
        shape.drawLine(v.br.x, v.br.y, v.bl.x, v.bl.y, color, strokeT, proj);
        shape.drawLine(v.bl.x, v.bl.y, v.tl.x, v.tl.y, color, strokeT, proj);
    }

    drawSelected(shape, proj, list) {
        if (!list.length) return;
        const c = this.outlineColor;
        for (const e of list) {
            if (e.type === 'group') continue;
            this.drawObb(shape, e, c, proj);
        }
    }

    drawHover(shape, proj, hovered, selectedList, transformTool) {
        const c = [
            this.outlineColor[0],
            this.outlineColor[1],
            this.outlineColor[2],
            0.5
        ];

        if (hovered && !selectedList.includes(hovered)) {
            if (hovered.type !== 'group') {
                this.drawObb(shape, hovered, c, proj);
            }
        }
    }

    drawMarquee(shape, proj, b) {
        const camScale = this.game.camera.scale || 1;
        const thickness = 1 / camScale;
        const c = this.outlineColor;
        const fill = [c[0], c[1], c[2], 0.1];

        shape.drawRect(b.x, b.y, b.w, b.h, fill, proj);

        if (shape.drawRectStroke) {
            shape.drawRectStroke(
                b.x, b.y, b.w, b.h,
                c, thickness, proj,
                0, 1, 1, 0, 0, 1
            );
        } else {
            shape.drawLine(b.x, b.y, b.x + b.w, b.y, c, thickness, proj);
            shape.drawLine(b.x + b.w, b.y, b.x + b.w, b.y + b.h, c, thickness, proj);
            shape.drawLine(b.x + b.w, b.y + b.h, b.x, b.y + b.h, c, thickness, proj);
            shape.drawLine(b.x, b.y + b.h, b.x, b.y, c, thickness, proj);
        }
    }
}