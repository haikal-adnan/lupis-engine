export class ShapeMath {
    static getMouseLocalPosition(game, entity) {
        const tf = entity.components.Transform || entity.components.UITransform || { x: 0, y: 0, width: 100, height: 100 };
        const canvas = game.renderer.canvas;
        const camera = game.camera;
        const input = game.input;

        const worldX = (input.mouse.x - canvas.width/ 2) / camera.scale + camera.x;
        const worldY = (input.mouse.y - canvas.height / 2) / camera.scale + camera.y;

        const dx = worldX - tf.x;
        const dy = worldY - tf.y;

        const rad = -(tf.rotation || 0) * (Math.PI / 180);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const rotatedX = dx * cos - dy * sin;
        const rotatedY = dx * sin + dy * cos;

        const sx = (tf.flipX ? -1 : 1) * (tf.scaleX ?? 1);
        const sy = (tf.flipY ? -1 : 1) * (tf.scaleY ?? 1);

        return { 
            x: (rotatedX / sx) / ((tf.width || 100) / 100), 
            y: (rotatedY / sy) / ((tf.height || 100) / 100) 
        };
    }

    static getHoveredPointId(game, localPos, elements, entity) {
        const tf = entity.components.Transform || entity.components.UITransform || { width: 100, height: 100 };
        const sx = Math.abs(tf.scaleX ?? 1) * ((tf.width || 100) / 100);
        const sy = Math.abs(tf.scaleY ?? 1) * ((tf.height || 100) / 100);
        const hitRadiusWorld = 8 / (game.camera.scale || 1);

        for (let i = elements.length - 1; i >= 0; i--) {
            const el = elements[i];
            if (el.type === 'point') {
                const dxWorld = (el.x - localPos.x) * sx;
                const dyWorld = (el.y - localPos.y) * sy;
                if (Math.hypot(dxWorld, dyWorld) <= hitRadiusWorld) return el.id;
            }
        }
        return null;
    }

    static getPointsInMarquee(elements, p1, p2) {
        const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y), maxY = Math.max(p1.y, p2.y);
        return elements
            .filter(el => el.type === 'point' && el.x >= minX && el.x <= maxX && el.y >= minY && el.y <= maxY)
            .map(el => el.id);
    }

    static recalculateEntityBounds(entity, shapeComp, isDrafting) {
        if (!shapeComp.elements || shapeComp.elements.length === 0 || isDrafting) return;

        const t = entity.components.UITransform || entity.components.Transform;
        if (!t) return;

        const oldW = t.width || 100;
        const oldH = t.height || 100;

        let minAbsX = Infinity, maxAbsX = -Infinity;
        let minAbsY = Infinity, maxAbsY = -Infinity;
        let hasPoints = false;

        const pointMap = new Map();
        for (const el of shapeComp.elements) {
            if (el.type === 'point') pointMap.set(el.id, el);
        }

        const usedPointIds = new Set();
        for (const el of shapeComp.elements) {
            if (el.type === 'segment' || el.type === 'polygon') {
                if (Array.isArray(el.points)) el.points.forEach(id => usedPointIds.add(id));
            } else if (el.type === 'line') {
                if (el.p1) usedPointIds.add(el.p1);
                if (el.p2) usedPointIds.add(el.p2);
            } else if (el.type === 'circle') {
                if (el.pCenter) usedPointIds.add(el.pCenter);
                if (el.pEdge) usedPointIds.add(el.pEdge);
            }
        }

        for (const el of shapeComp.elements) {
            if (el.type === 'point') {
                const absX = el.x * (oldW / 100);
                const absY = el.y * (oldH / 100);
                const isSingle = !usedPointIds.has(el.id);
                const margin = isSingle ? 6.0 : 0.0;

                minAbsX = Math.min(minAbsX, absX - margin);
                maxAbsX = Math.max(maxAbsX, absX + margin);
                minAbsY = Math.min(minAbsY, absY - margin);
                maxAbsY = Math.max(maxAbsY, absY + margin);
                hasPoints = true;
            } else if (el.type === 'circle') {
                const pCenter = pointMap.get(el.pCenter);
                const pEdge = pointMap.get(el.pEdge);
                if (pCenter && pEdge) {
                    const cx = pCenter.x * (oldW / 100);
                    const cy = pCenter.y * (oldH / 100);
                    const ex = pEdge.x * (oldW / 100);
                    const ey = pEdge.y * (oldH / 100);
                    const r = Math.hypot(ex - cx, ey - cy);

                    minAbsX = Math.min(minAbsX, cx - r);
                    maxAbsX = Math.max(maxAbsX, cx + r);
                    minAbsY = Math.min(minAbsY, cy - r);
                    maxAbsY = Math.max(maxAbsY, cy + r);
                    hasPoints = true;
                }
            }
        }

        if (!hasPoints) return;

        let newW = Math.round(Math.max(1.0, maxAbsX - minAbsX));
        let newH = Math.round(Math.max(1.0, maxAbsY - minAbsY));

        const shiftX = (minAbsX + maxAbsX) / 2;
        const shiftY = (minAbsY + maxAbsY) / 2;

        if (Math.abs(shiftX) < 1.0 && Math.abs(shiftY) < 1.0 && 
            Math.abs(oldW - newW) < 1.0 && Math.abs(oldH - newH) < 1.0) {
            return;
        }
 
        const rad = (t.rotation || 0) * (Math.PI / 180);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const sx = (t.flipX ? -1 : 1) * (t.scaleX ?? 1);
        const sy = (t.flipY ? -1 : 1) * (t.scaleY ?? 1);

        const targetWorldX = t.x + (shiftX * sx * cos) - (shiftY * sy * sin);
        const targetWorldY = t.y + (shiftX * sx * sin) + (shiftY * sy * cos);

        t.x = Math.round(targetWorldX);
        t.y = Math.round(targetWorldY);
        t.width = newW;
        t.height = newH;
        t.overridden = true;

        const snapDiffX = t.x - targetWorldX;
        const snapDiffY = t.y - targetWorldY;

        const localSnapX = (snapDiffX * cos + snapDiffY * sin) / sx;
        const localSnapY = (-snapDiffX * sin + snapDiffY * cos) / sy;

        for (const el of shapeComp.elements) {
            if (el.type === 'point') {
                const absX = el.x * (oldW / 100);
                const absY = el.y * (oldH / 100);
                el.x = (absX - shiftX - localSnapX) / (newW / 100);
                el.y = (absY - shiftY - localSnapY) / (newH / 100);
            }
        }
    }
}