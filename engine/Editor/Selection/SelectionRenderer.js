import { calculateQuadVertices } from "../../Util/calculateQuadVertices.js";

export class SelectionRenderer {
    constructor(game) {
        this.game = game;
    }

    _calculateAbsolutePosition(e) {
        const t = e.components.UITransform || e.components.Transform;
        if (!t) return { x: 0, y: 0 };

        if (!e.components.UITransform) {
            return { x: t.x || 0, y: t.y || 0 };
        }

        const uiSettings = this.game.world.settings?.ui || { referenceWidth: 1920, referenceHeight: 1080 };
        const parentBounds = { x: 0, y: 0, width: uiSettings.referenceWidth, height: uiSettings.referenceHeight };

        const anchorX = t.anchorX ?? 0.5;
        const anchorY = t.anchorY ?? 0.5;

        const anchorPointX = parentBounds.x + (parentBounds.width * anchorX);
        const anchorPointY = parentBounds.y + (parentBounds.height * anchorY);

        return { 
            x: anchorPointX + (t.x || 0), 
            y: anchorPointY + (t.y || 0) 
        };
    }

    draw(shape, proj, selectedList, hoveredEntity, marqueeBox, transformTool) {
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
            const mc = [0, 0.6, 1, 0.2]; 
            const mb = [0, 0.6, 1, 0.8]; 
            shape.drawRect(marqueeBox.x, marqueeBox.y, marqueeBox.w, marqueeBox.h, mc, proj);
            shape.drawRectStroke(marqueeBox.x, marqueeBox.y, marqueeBox.w, marqueeBox.h, mb, lineThick, proj);
        }
    }

    drawObb(shape, e, color, proj, thickness = 2) {
        if (!e.visible) return;
        
        const t = e.components.UITransform || e.components.Transform;
        if (!t) return;

        const absPos = this._calculateAbsolutePosition(e);

        const r = (t.rotation || 0) * (Math.PI / 180);
        const sx = t.scaleX ?? 1;
        const sy = t.scaleY ?? 1;
        const px = t.pivotX ?? 0.5;
        const py = t.pivotY ?? 0.5;

        const v = calculateQuadVertices(absPos.x, absPos.y, t.width, t.height, r, sx, sy, px, py);

        shape.drawLine(v.tl.x, v.tl.y, v.tr.x, v.tr.y, color, thickness, proj);
        shape.drawLine(v.tr.x, v.tr.y, v.br.x, v.br.y, color, thickness, proj);
        shape.drawLine(v.br.x, v.br.y, v.bl.x, v.bl.y, color, thickness, proj);
        shape.drawLine(v.bl.x, v.bl.y, v.tl.x, v.tl.y, color, thickness, proj);
    }
}