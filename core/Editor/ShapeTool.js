import { GenerateUUID } from '../Util/GenerateUUID.js';
import { ShapeMath } from './Shape/ShapeMath.js';
import { ShapeOperations } from './Shape/ShapeOperations.js';
import { ShapeDraft } from './Shape/ShapeDraft.js';

export default class ShapeTool {
    constructor(game) {
        this.game = game;
        this.world = game.world;
        this.input = game.input;
        this.camera = game.camera;

        this.draft = new ShapeDraft();

        this._isPanning = false;
        this._lastPanPos = { x: 0, y: 0 };
        
        this._prevMouseDown = false;
        this._prevEnterDown = false;
        this._prevEscDown = false;
        
        this._isDragging = false;
        this._dragStartLocal = { x: 0, y: 0 };
        this._dragStartPoints = [];
        
        this._isMarquee = false;
        this._marqueeStart = { x: 0, y: 0 };
        this._marqueeEnd = { x: 0, y: 0 };
    }

    update() {
        const editors = this.world._editors;
        if (!editors) return;

        const activeTool = editors.activeTool || 'select';
        const activeId = editors.activeTabId;
        const activeTab = editors.tabs?.find(t => t.id === activeId);

        const entity = this._findEntity(activeId);
        const shapeComp = entity?.components?.ShapeRenderer;

        if (activeTab?.type !== 'shape_editor' || !shapeComp) {
            this.draft.reset(editors, shapeComp, entity);
            this._updateInputStates();
            return;
        }

        if (this.input.mouse.isDown(2)) {
            this.draft.reset(editors, shapeComp, entity);
            this._updateInputStates();
            return;
        }

        if (activeTool === 'hand' || this.input.keyboard.isDown('Space')) {
            if (this.draft.isDrafting()) {
                this.draft.reset(editors, shapeComp, entity);
            }
            this._handlePan();
            this._updateInputStates();
            return;
        }

        shapeComp.type = 'custom';
        shapeComp.elements = shapeComp.elements || [];

        const localPos = ShapeMath.getMouseLocalPosition(this.game, entity);
        const hoveredPtId = ShapeMath.getHoveredPointId(this.game, localPos, shapeComp.elements, entity);

        editors.shapeHoveredPoint = hoveredPtId;
        editors.shapeSelectedPoints = editors.shapeSelectedPoints || [];

        const isEnterPressed = this.input.keyboard.isDown('Enter') && !this._prevEnterDown;
        const isEscPressed = this.input.keyboard.isDown('Escape') && !this._prevEscDown;
        const isMouseDown = this.input.mouse.isDown(0);
        const isMousePressed = isMouseDown && !this._prevMouseDown;
        const isMouseReleased = !isMouseDown && this._prevMouseDown;

        if (isEscPressed) {
            this.draft.reset(editors, shapeComp, entity);
            this._updateInputStates();
            return;
        }

        if (isEnterPressed) {
            this.draft.commitDraftChain(entity, shapeComp, activeTool);
            this.draft.reset(editors, null, null);
            this._updateInputStates();
            return;
        }

        if (this._isDragging && isMouseDown) {
            const dx = localPos.x - this._dragStartLocal.x;
            const dy = localPos.y - this._dragStartLocal.y;
            for (const ogPt of this._dragStartPoints) {
                const el = shapeComp.elements.find(e => e.id === ogPt.id);
                if (el) {
                    el.x = ogPt.x + dx;
                    el.y = ogPt.y + dy;
                }
            }
            ShapeOperations.notifyUpdate(entity);
            this._updateInputStates();
            return;
        }

        if (this._isMarquee && isMouseDown) {
            this._marqueeEnd = { ...localPos };
            editors.shapeMarquee = { start: this._marqueeStart, end: this._marqueeEnd };
            this._updateInputStates();
            return;
        }

        if (isMouseReleased) {
            if (this._isDragging) {
                ShapeMath.recalculateEntityBounds(entity, shapeComp, this.draft.isDrafting());
                ShapeOperations.notifyUpdate(entity);
            }
            this._isDragging = false;
            
            if (this._isMarquee) {
                const ptsInside = ShapeMath.getPointsInMarquee(shapeComp.elements, this._marqueeStart, this._marqueeEnd);
                if (activeTool === 'select' || activeTool === 'move') {
                    editors.shapeSelectedPoints = ptsInside;
                } else if (activeTool === 'delete' || activeTool === 'eraser') {
                    ShapeOperations.deletePointsAndCascade(shapeComp, ptsInside);
                    ShapeMath.recalculateEntityBounds(entity, shapeComp, this.draft.isDrafting());
                    ShapeOperations.notifyUpdate(entity);
                }
                this._isMarquee = false;
                editors.shapeMarquee = null;
            }
        }

        if (isMousePressed && localPos) {
            this._handleToolClick(entity, shapeComp, activeTool, localPos, hoveredPtId, editors);
        }

        this.draft.updateGhostPreview(activeTool, localPos, editors);
        this._updateInputStates();
    }

    _handleToolClick(entity, shapeComp, activeTool, localPos, hitId, editors) {
        if (['select', 'move', 'delete', 'eraser'].includes(activeTool)) {
            if (hitId) {
                if (activeTool === 'delete' || activeTool === 'eraser') {
                    ShapeOperations.deletePointsAndCascade(shapeComp, [hitId]);
                    ShapeMath.recalculateEntityBounds(entity, shapeComp, this.draft.isDrafting());
                    ShapeOperations.notifyUpdate(entity);
                } else {
                    if (!editors.shapeSelectedPoints.includes(hitId)) {
                        editors.shapeSelectedPoints = [hitId];
                    }
                    this._isDragging = true;
                    this._dragStartLocal = { ...localPos };
                    
                    this._dragStartPoints = editors.shapeSelectedPoints
                        .map(id => shapeComp.elements.find(el => el.id === id))
                        .filter(Boolean)
                        .map(e => ({ id: e.id, x: Number(e.x), y: Number(e.y) }));
                }
            } else {
                this._isMarquee = true;
                this._marqueeStart = { ...localPos };
                this._marqueeEnd = { ...localPos };
                if (!['delete', 'eraser'].includes(activeTool)) editors.shapeSelectedPoints = [];
            }
            return;
        }

        if (activeTool === 'point') {
            ShapeOperations.findOrCreatePoint(shapeComp, localPos, hitId);
            ShapeMath.recalculateEntityBounds(entity, shapeComp, this.draft.isDrafting());
            ShapeOperations.notifyUpdate(entity);
            return;
        }

        if (activeTool === 'line' || activeTool === 'circle') {
            const ptId = ShapeOperations.findOrCreatePoint(shapeComp, localPos, hitId);
            if (!this.draft.startPointId) {
                this.draft.startPointId = ptId;
            } else if (this.draft.startPointId !== ptId) {
                if (activeTool === 'line') {
                    shapeComp.elements.push({
                        id: 'line_' + GenerateUUID(),
                        type: 'line',
                        p1: this.draft.startPointId,
                        p2: ptId
                    });
                } else {
                    shapeComp.elements.push({
                        id: 'circ_' + GenerateUUID(),
                        type: 'circle',
                        pCenter: this.draft.startPointId,
                        pEdge: ptId
                    });
                }
                this.draft.startPointId = null;
                ShapeMath.recalculateEntityBounds(entity, shapeComp, this.draft.isDrafting());
                ShapeOperations.notifyUpdate(entity);
            }
            return;
        }

        if (activeTool === 'segment' || activeTool === 'polygon') {
            if (activeTool === 'polygon' && this.draft.draftPointIds.length >= 3 && hitId && hitId === this.draft.draftPointIds[0]) {
                this.draft.commitDraftChain(entity, shapeComp, activeTool);
                this.draft.reset(editors, null, null);
                return;
            }

            if (activeTool === 'segment' && this.draft.draftPointIds.length > 0 && hitId === this.draft.draftPointIds[this.draft.draftPointIds.length - 1]) {
                this.draft.commitDraftChain(entity, shapeComp, activeTool);
                this.draft.reset(editors, null, null);
                return;
            }

            const ptId = ShapeOperations.findOrCreatePoint(shapeComp, localPos, hitId);
            this.draft.draftPointIds.push(ptId);

            ShapeOperations.notifyUpdate(entity);
            return;
        }
    }

    _handlePan() {
        if (this.input.mouse.isDown(0)) {
            if (!this._isPanning) {
                this._isPanning = true;
                this._lastPanPos = { x: this.input.mouse.x, y: this.input.mouse.y };
            } else {
                const dx = this.input.mouse.x - this._lastPanPos.x;
                const dy = this.input.mouse.y - this._lastPanPos.y;
                this.camera.x -= dx / this.camera.scale;
                this.camera.y -= dy / this.camera.scale;
                this._lastPanPos = { x: this.input.mouse.x, y: this.input.mouse.y };
            }
        } else {
            this._isPanning = false;
        }
    }

    _updateInputStates() {
        this._prevMouseDown = this.input.mouse.isDown(0);
        this._prevEnterDown = this.input.keyboard.isDown('Enter');
        this._prevEscDown = this.input.keyboard.isDown('Escape');
    }

    _findEntity(activeId) {
        const allLayers = [...(this.world.layersWorld || []), ...(this.world.layersUI || [])];
        for (const layer of allLayers) {
            if (!layer.entities) continue;
            for (const e of layer.entities) {
                if (e.id === activeId) return e;
            }
        }
        return null;
    }
}