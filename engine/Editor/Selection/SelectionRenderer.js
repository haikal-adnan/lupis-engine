import { calculateQuadVertices } from "../../Util/calculateQuadVertices.js";

export class SelectionRenderer {
    constructor(game) {
        this.game = game;
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
        const t = e.components.UITransform || e.components.Transform;
        if (!t) return { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5, width: 100, height: 100 };

        if (!e.parentId) {
            return {
                x: t.x, y: t.y, rotation: t.rotation || 0,
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
            pivotX: t.pivotX ?? 0.5, pivotY: t.pivotY ?? 0.5,
            width: t.width, height: t.height
        };
    }

    _calculateAbsolutePosition(e) {
        const t = e.components.UITransform || e.components.Transform;
        if (!t) return { x: 0, y: 0 };

        const globalT = this.getGlobalTransform(e);

        if (!e.components.UITransform) {
            return { x: globalT.x || 0, y: globalT.y || 0 };
        }

        const uiSettings = this.game.world.settings?.ui || { width: 1920, height: 1080 };
        const parentBounds = { x: 0, y: 0, width: uiSettings.width, height: uiSettings.height };

        const anchorX = t.anchorX ?? 0.5;
        const anchorY = t.anchorY ?? 0.5;

        return { 
            x: parentBounds.x + (parentBounds.width * anchorX) + (globalT.x || 0), 
            y: parentBounds.y + (parentBounds.height * anchorY) + (globalT.y || 0) 
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
        if (!e.visible || e.type === 'layer' || !e.components) return;
        const t = e.components.UITransform || e.components.Transform;
        if (!t) return;

        const globalT = this.getGlobalTransform(e);
        const absPos = this._calculateAbsolutePosition(e);

        const r = (globalT.rotation || 0) * (Math.PI / 180);
        const sx = globalT.scaleX ?? 1;
        const sy = globalT.scaleY ?? 1;
        const px = globalT.pivotX ?? 0.5;
        const py = globalT.pivotY ?? 0.5;

        const v = calculateQuadVertices(absPos.x, absPos.y, t.width, t.height, r, sx, sy, px, py);

        shape.drawLine(v.tl.x, v.tl.y, v.tr.x, v.tr.y, color, thickness, proj);
        shape.drawLine(v.tr.x, v.tr.y, v.br.x, v.br.y, color, thickness, proj);
        shape.drawLine(v.br.x, v.br.y, v.bl.x, v.bl.y, color, thickness, proj);
        shape.drawLine(v.bl.x, v.bl.y, v.tl.x, v.tl.y, color, thickness, proj);
    }
}