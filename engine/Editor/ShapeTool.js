import { bus } from '../Util/EventBus.js';
import { GenerateUUID } from '../Util/GenerateUUID.js';

export default class ShapeTool {
    constructor(game) {
        this.game = game;
        this.world = game.world;
        this.input = game.input;
        this.camera = game.camera;

        this._isPanning = false;
        this._lastPanPos = { x: 0, y: 0 };
        
        this._draftPointIds = [];
        this._startPointId = null;
        
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
            this._resetDraft(editors, shapeComp, entity);
            this._updateInputStates();
            return;
        }

        if (this.input.mouse.isDown(2)) {
            this._resetDraft(editors, shapeComp, entity);
            this._updateInputStates();
            return;
        }

        if (activeTool === 'hand' || this.input.keyboard.isDown('Space')) {
            if (this._draftPointIds.length > 0 || this._startPointId) {
                this._resetDraft(editors, shapeComp, entity);
            }
            this._handlePan();
            this._updateInputStates();
            return;
        }

        shapeComp.type = 'custom';
        shapeComp.elements = shapeComp.elements || [];

        const localPos = this._getMouseLocalPosition(entity);
        const hoveredPtId = this._getHoveredPointId(localPos, shapeComp.elements, entity);

        editors.shapeHoveredPoint = hoveredPtId;
        editors.shapeSelectedPoints = editors.shapeSelectedPoints || [];

        const isEnterPressed = this.input.keyboard.isDown('Enter') && !this._prevEnterDown;
        const isEscPressed = this.input.keyboard.isDown('Escape') && !this._prevEscDown;
        const isMouseDown = this.input.mouse.isDown(0);
        const isMousePressed = isMouseDown && !this._prevMouseDown;
        const isMouseReleased = !isMouseDown && this._prevMouseDown;

        if (isEscPressed) {
            this._resetDraft(editors, shapeComp, entity);
            this._updateInputStates();
            return;
        }

        if (isEnterPressed) {
            this._commitDraftChain(entity, shapeComp, activeTool);
            this._resetDraft(editors, null, null);
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
            this._notifyUpdate(entity);
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
                this._recalculateEntityBounds(entity, shapeComp);
                this._notifyUpdate(entity);
            }
            this._isDragging = false;
            
            if (this._isMarquee) {
                const ptsInside = this._getPointsInMarquee(shapeComp.elements, this._marqueeStart, this._marqueeEnd);
                if (activeTool === 'select' || activeTool === 'move') {
                    editors.shapeSelectedPoints = ptsInside;
                } else if (activeTool === 'delete' || activeTool === 'eraser') {
                    this._deletePointsAndCascade(shapeComp, ptsInside);
                    this._recalculateEntityBounds(entity, shapeComp);
                    this._notifyUpdate(entity);
                }
                this._isMarquee = false;
                editors.shapeMarquee = null;
            }
        }

        if (isMousePressed && localPos) {
            this._handleToolClick(entity, shapeComp, activeTool, localPos, hoveredPtId, editors);
        }

        this._updateGhostPreview(activeTool, localPos, shapeComp, editors);
        this._updateInputStates();
    }

    _recalculateEntityBounds(entity, shapeComp) {
        if (!shapeComp.elements || shapeComp.elements.length === 0) return;
        
        if (this._draftPointIds.length > 0 || this._startPointId) {
            return;
        }

        const t = entity.components.UITransform || entity.components.Transform;
        if (!t) return;

        const oldW = t.width || 100;
        const oldH = t.height || 100;

        let minAbsX = Infinity, maxAbsX = -Infinity;
        let minAbsY = Infinity, maxAbsY = -Infinity;
        let hasPoints = false;

        const pointMap = new Map();
        for (const el of shapeComp.elements) {
            if (el.type === 'point') {
                pointMap.set(el.id, el);
            }
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
            } 
            else if (el.type === 'circle') {
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

        // 1. Bulatkan Lebar dan Tinggi Bounding Box (Integer)
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

        // 2. Hitung target asli (dengan koma) untuk koordinat world
        const targetWorldX = t.x + (shiftX * sx * cos) - (shiftY * sy * sin);
        const targetWorldY = t.y + (shiftX * sx * sin) + (shiftY * sy * cos);

        // 3. Bulatkan X dan Y agar koordinat transformasinya bebas koma (Integer)
        t.x = Math.round(targetWorldX);
        t.y = Math.round(targetWorldY);
        t.width = newW;
        t.height = newH;
        t.overridden = true;

        // 4. Hitung selisih "Snap/Pembulatan" agar node tidak bergeser secara visual
        const snapDiffX = t.x - targetWorldX;
        const snapDiffY = t.y - targetWorldY;

        // Kembalikan ke rotasi dan skala lokal 
        const localSnapX = (snapDiffX * cos + snapDiffY * sin) / sx;
        const localSnapY = (-snapDiffX * sin + snapDiffY * cos) / sy;

        // 5. Update titik lokal
        for (const el of shapeComp.elements) {
            if (el.type === 'point') {
                const absX = el.x * (oldW / 100);
                const absY = el.y * (oldH / 100);
                
                // Tambahkan localSnapX & Y agar mengompensasi pembulatan t.x dan t.y
                el.x = (absX - shiftX - localSnapX) / (newW / 100);
                el.y = (absY - shiftY - localSnapY) / (newH / 100);
            }
        }
    }

    _updateInputStates() {
        this._prevMouseDown = this.input.mouse.isDown(0);
        this._prevEnterDown = this.input.keyboard.isDown('Enter');
        this._prevEscDown = this.input.keyboard.isDown('Escape');
    }

    _getHoveredPointId(localPos, elements, entity) {
        // Ambil komponen transform untuk mengetahui skala asli Bounding Box di World
        const tf = entity.components.Transform || entity.components.UITransform || { width: 100, height: 100 };
        
        // Hitung pengali skala dari local ke world
        const sx = Math.abs(tf.scaleX ?? 1) * ((tf.width || 100) / 100);
        const sy = Math.abs(tf.scaleY ?? 1) * ((tf.height || 100) / 100);
        
        // Radius akurasi mouse dipatok ke 8 pixel absolut (disesuaikan dengan zoom kamera)
        const hitRadiusWorld = 8 / (this.camera.scale || 1);

        for (let i = elements.length - 1; i >= 0; i--) {
            const el = elements[i];
            if (el.type === 'point') {
                // Kembalikan jarak lokal ke jarak dunia (world space) untuk dikalkulasi
                const dxWorld = (el.x - localPos.x) * sx;
                const dyWorld = (el.y - localPos.y) * sy;
                
                // Cek jarak absolutnya
                if (Math.hypot(dxWorld, dyWorld) <= hitRadiusWorld) return el.id;
            }
        }
        return null;
    }

    _getPointsInMarquee(elements, p1, p2) {
        const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y), maxY = Math.max(p1.y, p2.y);
        return elements
            .filter(el => el.type === 'point' && el.x >= minX && el.x <= maxX && el.y >= minY && el.y <= maxY)
            .map(el => el.id);
    }

    _findOrCreatePoint(shapeComp, localPos, hitId) {
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

    _handleToolClick(entity, shapeComp, activeTool, localPos, hitId, editors) {
        if (['select', 'move', 'delete', 'eraser'].includes(activeTool)) {
            if (hitId) {
                if (activeTool === 'delete' || activeTool === 'eraser') {
                    this._deletePointsAndCascade(shapeComp, [hitId]);
                    this._recalculateEntityBounds(entity, shapeComp);
                    this._notifyUpdate(entity);
                } else {
                    if (!editors.shapeSelectedPoints.includes(hitId)) {
                        editors.shapeSelectedPoints = [hitId];
                    }
                    this._isDragging = true;
                    this._dragStartLocal = { ...localPos };
                    this._dragStartPoints = editors.shapeSelectedPoints
                        .map(id => shapeComp.elements.find(el => el.id === id))
                        .filter(Boolean)
                        .map(e => ({ id: e.id, x: e.x, y: e.y }));
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
            this._findOrCreatePoint(shapeComp, localPos, hitId);
            this._recalculateEntityBounds(entity, shapeComp);
            this._notifyUpdate(entity);
            return;
        }

        if (activeTool === 'line' || activeTool === 'circle') {
            const ptId = this._findOrCreatePoint(shapeComp, localPos, hitId);
            if (!this._startPointId) {
                this._startPointId = ptId;
            } else if (this._startPointId !== ptId) {
                if (activeTool === 'line') {
                    shapeComp.elements.push({
                        id: 'line_' + GenerateUUID(),
                        type: 'line',
                        p1: this._startPointId,
                        p2: ptId
                    });
                } else {
                    shapeComp.elements.push({
                        id: 'circ_' + GenerateUUID(),
                        type: 'circle',
                        pCenter: this._startPointId,
                        pEdge: ptId
                    });
                }
                this._startPointId = null;
                this._recalculateEntityBounds(entity, shapeComp);
                this._notifyUpdate(entity);
            }
            return;
        }

        if (activeTool === 'segment' || activeTool === 'polygon') {
            if (activeTool === 'polygon' && this._draftPointIds.length >= 3 && hitId && hitId === this._draftPointIds[0]) {
                this._commitDraftChain(entity, shapeComp, activeTool);
                this._resetDraft(editors, null, null);
                return;
            }

            // Segment berhenti jika user mengklik titik (node) yang terakhir kali ditambahkan
            if (activeTool === 'segment' && this._draftPointIds.length > 0 && hitId === this._draftPointIds[this._draftPointIds.length - 1]) {
                this._commitDraftChain(entity, shapeComp, activeTool);
                this._resetDraft(editors, null, null);
                return;
            }

            const ptId = this._findOrCreatePoint(shapeComp, localPos, hitId);
            this._draftPointIds.push(ptId);

            // Menghapus batas auto-commit untuk segment agar bisa disambung terus menerus
            this._notifyUpdate(entity);
            return;
        }
    }

    _commitDraftChain(entity, shapeComp, activeTool) {
        if (this._draftPointIds.length < 2) return;

        if (activeTool === 'segment') {
            shapeComp.elements.push({
                id: 'seg_' + GenerateUUID(),
                type: 'segment',
                points: [...this._draftPointIds]
            });
        } 
        else if (activeTool === 'polygon' && this._draftPointIds.length >= 3) {
            shapeComp.elements.push({
                id: 'poly_' + GenerateUUID(),
                type: 'polygon',
                points: [...this._draftPointIds]
            });
        }
        
        const savedDrafts = [...this._draftPointIds];
        this._draftPointIds = [];
        this._recalculateEntityBounds(entity, shapeComp);
        this._draftPointIds = savedDrafts;
        
        this._notifyUpdate(entity);
    }

    _deletePointsAndCascade(shapeComp, idsToDelete) {
        if (idsToDelete.length === 0) return;

        shapeComp.elements = shapeComp.elements.filter(e => !idsToDelete.includes(e.id));

        const newElements = [];
        for (const el of shapeComp.elements) {
            if (el.type === 'segment') {
                const remaining = el.points.filter(pid => !idsToDelete.includes(pid));
                if (remaining.length >= 2) newElements.push({ ...el, points: remaining });
            } 
            else if (el.type === 'polygon') {
                const affected = el.points.some(pid => idsToDelete.includes(pid));
                if (!affected) newElements.push(el);
            } 
            else if (el.type === 'line') {
                if (!idsToDelete.includes(el.p1) && !idsToDelete.includes(el.p2)) newElements.push(el);
            } 
            else if (el.type === 'circle') {
                if (!idsToDelete.includes(el.pCenter) && !idsToDelete.includes(el.pEdge)) newElements.push(el);
            } 
            else {
                newElements.push(el);
            }
        }
        shapeComp.elements = newElements;
    }

    _updateGhostPreview(activeTool, localPos, shapeComp, editors) {
        if (['line', 'circle'].includes(activeTool)) {
            editors.shapeDraftState = this._startPointId ? {
                tool: activeTool,
                points: [this._startPointId],
                mouseLocal: localPos
            } : null;
        } else if (['segment', 'polygon'].includes(activeTool)) {
            editors.shapeDraftState = this._draftPointIds.length > 0 ? {
                tool: activeTool,
                points: [...this._draftPointIds],
                mouseLocal: localPos
            } : null;
        } else {
            editors.shapeDraftState = null;
        }
    }

    _resetDraft(editors, shapeComp = null, entity = null) {
        const cancelPointIds = [...this._draftPointIds];
        if (this._startPointId) cancelPointIds.push(this._startPointId);

        this._draftPointIds = [];
        this._startPointId = null;
        if (editors) editors.shapeDraftState = null;

        if (shapeComp && cancelPointIds.length > 0) {
            this._deletePointsAndCascade(shapeComp, cancelPointIds);
            if (entity) {
                this._recalculateEntityBounds(entity, shapeComp);
                this._notifyUpdate(entity);
            }
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

    _notifyUpdate(entity) {
        entity.isDirty = true;
        bus.emit('entity:modified', [entity]);

        const shapeComp = entity.components?.ShapeRenderer;
        const transformComp = entity.components?.UITransform || entity.components?.Transform;
        const entityId = entity._id || entity.id;

        if (shapeComp) {
            bus.emit('editor:entity:patch-component', {
                entityId: entityId,
                componentName: 'ShapeRenderer',
                updates: { elements: shapeComp.elements }
            });
        }

        if (transformComp) {
            bus.emit('editor:entity:patch-component', {
                entityId: entityId,
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

    _getMouseLocalPosition(entity) {
        const tf = entity.components.Transform || entity.components.UITransform || { x: 0, y: 0, width: 100, height: 100 };
        const canvas = this.game.renderer.canvas;

        const worldX = (this.input.mouse.x - canvas.width / 2) / this.camera.scale + this.camera.x;
        const worldY = (this.input.mouse.y - canvas.height / 2) / this.camera.scale + this.camera.y;

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

    _findEntity(activeId) {
        const allLayers = [...(this.world.layersWorld || []), ...(this.world.layersUI || [])];
        for (const layer of allLayers) {
            if (!layer.entities) continue;
            for (const e of layer.entities) {
                if (e.id === activeId || e._id === activeId) return e;
            }
        }
        return null;
    }
}