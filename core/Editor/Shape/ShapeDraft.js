import { GenerateUUID } from '../../Util/GenerateUUID.js';
import { ShapeOperations } from './ShapeOperations.js';
import { ShapeMath } from './ShapeMath.js';

export class ShapeDraft {
    constructor() {
        this.draftPointIds = [];
        this.startPointId = null;
    }

    isDrafting() {
        return this.draftPointIds.length > 0 || this.startPointId !== null;
    }

    commitDraftChain(entity, shapeComp, activeTool) {
        if (this.draftPointIds.length < 2) return;

        if (activeTool === 'segment') {
            shapeComp.elements.push({
                id: 'seg_' + GenerateUUID(),
                type: 'segment',
                points: [...this.draftPointIds]
            });
        } else if (activeTool === 'polygon' && this.draftPointIds.length >= 3) {
            shapeComp.elements.push({
                id: 'poly_' + GenerateUUID(),
                type: 'polygon',
                points: [...this.draftPointIds]
            });
        }

        const savedDrafts = [...this.draftPointIds];
        this.draftPointIds = [];
        ShapeMath.recalculateEntityBounds(entity, shapeComp, false);
        this.draftPointIds = savedDrafts;

        ShapeOperations.notifyUpdate(entity);
    }

    reset(editors, shapeComp = null, entity = null) {
        const cancelPointIds = [...this.draftPointIds];
        if (this.startPointId) cancelPointIds.push(this.startPointId);

        this.draftPointIds = [];
        this.startPointId = null;
        if (editors) editors.shapeDraftState = null;

        if (shapeComp && cancelPointIds.length > 0) {
            ShapeOperations.deletePointsAndCascade(shapeComp, cancelPointIds);
            if (entity) {
                ShapeMath.recalculateEntityBounds(entity, shapeComp, false);
                ShapeOperations.notifyUpdate(entity);
            }
        }
    }

    updateGhostPreview(activeTool, localPos, editors) {
        if (['line', 'circle'].includes(activeTool)) {
            editors.shapeDraftState = this.startPointId ? {
                tool: activeTool,
                points: [this.startPointId],
                mouseLocal: localPos
            } : null;
        } else if (['segment', 'polygon'].includes(activeTool)) {
            editors.shapeDraftState = this.draftPointIds.length > 0 ? {
                tool: activeTool,
                points: [...this.draftPointIds],
                mouseLocal: localPos
            } : null;
        } else {
            editors.shapeDraftState = null;
        }
    }
}