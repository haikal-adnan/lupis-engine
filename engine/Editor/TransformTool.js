import Config from "../Core/Config.js";
import { ApplyResizeToEntity } from "../Util/ApplyResizeToEntity.js";
import { bus } from "../Util/EventBus.js";
import { TransformGeometry } from "./Transform/TransformGeometry.js";
import { TransformRenderer } from "./Transform/TransformRenderer.js";
import { TransformOperator } from "./Transform/TransformOperator.js";

export default class TransformTool {
    constructor(selectionTool, world, game, canvas, renderer, input) {
        this.selection = selectionTool;
        this.selection.attachTransform(this);

        this.world = world;
        this.game = game;
        this.canvas = canvas;
        this.input = input;

        this.active = Config.EDITOR.TRANSFORM;

        this.geometry = new TransformGeometry(game, world);
        this.drawer = new TransformRenderer(game, selectionTool);
        this.operator = new TransformOperator(world, game, input);

        this.draggingMove = false;
        this.draggingResize = false;
        this.draggingRotate = false;
        this.resizeType = null;
        
        this.startWorld = { x: 0, y: 0 };
        this.rotateCenter = { x: 0, y: 0 };
        this.rotateStartAngle = 0;
        this.entityStartRotation = 0;
        
        this.moveStartData = null;
        this.resizeEntityStarts = null;
        this.initialState = [];
    }

    _getTransform(e) {
        return e.components && (e.components.UITransform || e.components.Transform);
    }

    _isInteractive(e) {
        if (e.active === false) return false;
        const locked = e.locked || (e._editor && e._editor.locked === true);
        if (locked) return false;

        const parentLayer = this._findLayerOfEntity(e);
        if (parentLayer && (parentLayer.active === false || parentLayer.visible === false || parentLayer.locked)) {
            return false;
        }

        const { activeTabId, tabs } = this.world._editors || {};
        const activeTab = tabs?.find(t => t.id === activeTabId);
        
        const isUIMode = activeTab?.type === 'ui';
        const isSceneMode = activeTabId === 'scene' || !activeTabId;

        const isEntityUI = this._isEntityInUILayer(e);

        if (isUIMode) { 
            if (!isEntityUI) return false; 
        }
        else if (isSceneMode) { 
            if (isEntityUI) return false; 
        }

        return true;
    }

    _findLayerOfEntity(targetEntity) {
        const allLayers = [...(this.world.layersWorld || []), ...(this.world.layersUI || [])];
        for (const layer of allLayers) {
            if (layer.entities && layer.entities.some(e => String(e._id || e.id) === String(targetEntity._id || targetEntity.id))) {
                return layer;
            }
        }
        return null;
    }

    _isEntityInUILayer(targetEntity) {
        const uiLayers = this.world.layersUI || [];
        for (const layer of uiLayers) {
            if (layer.entities && layer.entities.some(e => String(e._id || e.id) === String(targetEntity._id || targetEntity.id))) {
                return true;
            }
        }
        return false;
    }

    _findEntityInWorld(id) {
        const allLayers = [...(this.world.layersWorld || []), ...(this.world.layersUI || [])];
        for (const layer of allLayers) {
            if (layer.entities) {
                const found = layer.entities.find(e => String(e.id || e._id) === String(id));
                if (found) return found;
            }
        }
        return null;
    }

    toWorld(px, py) {
        return this.selection.toWorld(px, py);
    }

    computeHandles() {
        const interactables = this.selection.selectedList.filter(e => this._isInteractive(e));
        this.geometry.computeHandles(interactables);
    }

    getHoverHandle(px, py) { 
        const w = this.toWorld(px, py);
        return this.geometry.getHoverHandle(w.x, w.y); 
    }

    getCursor(handle) { return this.geometry.getCursor(handle); }

    _createSnapshot() {
        const validList = this.selection.selectedList.filter(e => this._isInteractive(e));
        return validList.map(e => ({
            _id: e._id || e.id,
            components: JSON.parse(JSON.stringify(e.components)),
            active: e.active,
            visible: e.visible,
            _editor: e._editor ? JSON.parse(JSON.stringify(e._editor)) : {}
        }));
    }

    _applyState(list) {
        const affected = [];
        list.forEach(s => {
            const ent = this._findEntityInWorld(s._id);
            if (ent) {
                ent.components = JSON.parse(JSON.stringify(s.components));
                ent.active = s.active;
                ent.visible = s.visible;
                if(s._editor) ent._editor = JSON.parse(JSON.stringify(s._editor));
                ApplyResizeToEntity(ent, this.world);
                affected.push(ent);
            }
        });
        if (affected.length) {
            this.selection.selectedList = affected;
            bus.emit("entity:modified", list);
        }
    }

    beginMove(px, py, isTouch) {
        const validEntities = this.selection.selectedList.filter(e => this._isInteractive(e));
        if (!validEntities.length) return;

        this.initialState = this._createSnapshot();
        
        this.startWorld = this.toWorld(px, py);
        this.draggingMove = true;
        this.draggingResize = false;
        this.draggingRotate = false;

        this.moveStartData = validEntities.map(e => {
            const t = this._getTransform(e);
            return { e, x: t.x, y: t.y };
        });
    }

    beginResize(handle, px, py) {
        const validEntities = this.selection.selectedList.filter(e => this._isInteractive(e));
        if (!validEntities.length) return;

        this.initialState = this._createSnapshot();
        this.startWorld = this.toWorld(px, py);

        if (handle.mode === 'rotate') {
            this.draggingRotate = true;
            this.draggingResize = false;
            this.draggingMove = false;
            
            const bounds = this.geometry.computeGroupBounds(); 
            const cx = bounds ? bounds.x + bounds.w / 2 : this.startWorld.x;
            const cy = bounds ? bounds.y + bounds.h / 2 : this.startWorld.y;
            
            this.rotateCenter = { x: cx, y: cy };
            this.rotateStartAngle = Math.atan2(this.startWorld.y - cy, this.startWorld.x - cx);
            
            if (validEntities.length === 1) {
                const t = this._getTransform(validEntities[0]);
                this.entityStartRotation = t.rotation || 0;
            } else {
                this.resizeEntityStarts = validEntities.map(e => {
                     const t = this._getTransform(e);
                     return { e, startRotation: t.rotation || 0, startX: t.x, startY: t.y };
                });
            }
        } else {
            this.draggingResize = true;
            this.draggingRotate = false;
            this.draggingMove = false;
            this.resizeType = handle.type;

            this.resizeEntityStarts = validEntities.map(e => {
                const t = this._getTransform(e);
                let sx = t.scaleX ?? 1, sy = t.scaleY ?? 1;
                let fx = Boolean(t.flipX), fy = Boolean(t.flipY);

                if (sx < 0) { sx *= -1; fx = !fx; }
                if (sy < 0) { sy *= -1; fy = !fy; }

                return {
                    e, x: t.x, y: t.y, w: t.width, h: t.height, r: t.rotation || 0,
                    sx, sy, flipX: fx, flipY: fy
                };
            });
        }
    }

    resetDrag() {
        const wasInteracting = this.draggingMove || this.draggingResize || this.draggingRotate;
        this.draggingMove = false;
        this.draggingResize = false;
        this.draggingRotate = false;
        this.resizeType = null;
        this.moveStartData = null;
        this.resizeEntityStarts = null;
        
        this.computeHandles();
        
        if (wasInteracting) {
            const finalState = this._createSnapshot();
            if (JSON.stringify(finalState) !== JSON.stringify(this.initialState)) {
                 const command = {
                    name: "Transform Entity",
                    undo: () => this._applyState(this.initialState),
                    redo: () => this._applyState(finalState)
                 };
                 if (this.game.history) this.game.history.push(command);
                 bus.emit("entity:modified", this.selection.selectedList);
            }
        }
    }

    update() {
        if (!this.active) return;
        const list = this.selection.selectedList;
        if (!list.length) return;

        const { activeTabId, tabs } = this.world._editors || {};
        const activeTab = tabs?.find(t => t.id === activeTabId);
        const isUIMode = activeTab?.type === 'ui';

        const p = this.input.getPointer();
        const worldP = this.toWorld(p.x, p.y);

        if (this.draggingMove && this.moveStartData) {
            this.operator.move(worldP, this.startWorld, this.moveStartData, list, isUIMode);
        } 
        else if (this.draggingResize && this.resizeEntityStarts) {
            this.operator.resize(worldP, this.startWorld, this.resizeType, this.resizeEntityStarts, list, isUIMode);
        } 
        else if (this.draggingRotate) {
             if (this.resizeEntityStarts) {
                 this.operator.rotateMulti(worldP, this.rotateCenter, this.rotateStartAngle, this.resizeEntityStarts, list, isUIMode);
             } else {
                 this.operator.rotateSingle(worldP, this.rotateCenter, this.rotateStartAngle, this.entityStartRotation, list, isUIMode);
             }
        }
        
        if (!p.down) this.resetDrag();
    }

    draw(shape, proj) {
        if (!this.active) return;
        this.computeHandles();
        this.drawer.draw(shape, proj, this.geometry);
    }
}