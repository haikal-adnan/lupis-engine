import { bus } from '../../Util/EventBus.js';
import { GenerateUUID } from '../../Util/GenerateUUID.js';

export class ShapeOperations {
    static findOrCreatePoint(shapeComp, localPos, hitId) {
        if (hitId) return hitId;
        const newId = 'pt_' + GenerateUUID();
        shapeComp.elements.push({
            id: newId, 
            type: 'point', 
            x: localPos.x, 
            y: localPos.y
        });
        return newId;
    }

    static deletePointsAndCascade(shapeComp, idsToDelete) {
        if (idsToDelete.length === 0) return;

        shapeComp.elements = shapeComp.elements.filter(e => !idsToDelete.includes(e.id));

        const newElements = [];
        for (const el of shapeComp.elements) {
            if (el.type === 'segment') {
                const remaining = el.points.filter(pid => !idsToDelete.includes(pid));
                if (remaining.length >= 2) newElements.push({ ...el, points: remaining });
            } else if (el.type === 'polygon') {
                const affected = el.points.some(pid => idsToDelete.includes(pid));
                if (!affected) newElements.push(el);
            } else if (el.type === 'line') {
                if (!idsToDelete.includes(el.p1) && !idsToDelete.includes(el.p2)) newElements.push(el);
            } else if (el.type === 'circle') {
                if (!idsToDelete.includes(el.pCenter) && !idsToDelete.includes(el.pEdge)) newElements.push(el);
            } else {
                newElements.push(el);
            }
        }
        shapeComp.elements = newElements;
    }

    static notifyUpdate(entity) {
        entity.isDirty = true;
        bus.emit('entity:modified', [entity]);

        const shapeComp = entity.components?.ShapeRenderer;
        const transformComp = entity.components?.UITransform || entity.components?.Transform;
        const entityId = entity.id;

        if (shapeComp) {
            bus.emit('editor:entity:patch-component', {
                entityId,
                componentName: 'ShapeRenderer',
                updates: { elements: shapeComp.elements }
            });
        }

        if (transformComp) {
            bus.emit('editor:entity:patch-component', {
                entityId,
                componentName: entity.components?.UITransform ? 'UITransform' : 'Transform',
                updates: {
                    x: transformComp.x,
                    y: transformComp.y,
                    width: transformComp.width,
                    height: transformComp.height
                }
            });
        }
    }
}