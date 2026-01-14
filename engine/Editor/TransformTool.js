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
        this.input = input;

        this.active = Config.EDITOR.TRANSFORM;

        this.geometry = new TransformGeometry(game);
        this.drawer = new TransformRenderer(game, selectionTool);
        this.operator = new TransformOperator(world, game, input);

        this.draggingMove = false;
        this.draggingResize = false;
        this.draggingRotate = false;
        this.resizeType = null;

        this.rotateStartAngle = 0;
        this.entityStartRotation = 0;
        this.rotateCenter = { x: 0, y: 0 };
        this.startWorld = { x: 0, y: 0 };

        this.moveStartData = null;
        this.resizeEntityStarts = null;
        this.initialState = [];
    }

    _getTransform(e) {
        return e.components && e.components.Transform;
    }

    toWorld(px, py) {
        return this.selection.toWorld(px, py);
    }

    computeHandles() {
        this.geometry.computeHandles(this.selection.selectedList);
    }

    computeGroupBounds() {
        this.computeHandles();
        return this.geometry.computeGroupBounds();
    }

    getHoverHandle(px, py) {
        const w = this.toWorld(px, py);
        return this.geometry.getHoverHandle(w.x, w.y);
    }

    getCursor(handle) {
        return this.geometry.getCursor(handle);
    }

    _createSnapshot() {
        return this.selection.selectedList.map(e => {
            return {
                _id: e._id || e.id,
                components: JSON.parse(JSON.stringify(e.components)),
                active: e.active,
                visible: e.visible
            };
        });
    }

    _applyState(list) {
        const world = this.world;
        const affected = [];
        const findEntity = (id) => {
            for (const layer of world.layers) {
                const found = layer.entities.find(e => (e._id || e.id) === id);
                if (found) return found;
            }
            return null;
        };

        list.forEach(s => {
            const ent = findEntity(s._id);
            if (ent) {
                ent.components = JSON.parse(JSON.stringify(s.components));
                ent.active = s.active;
                ent.visible = s.visible;
                ApplyResizeToEntity(ent, world);
                affected.push(ent);
            }
        });

        if (affected.length) {
            this.selection.selectedList = affected;
            bus.emit("entity:modified", list);
        }
    }

    beginMove(px, py, isTouch) {
        const list = this.selection.selectedList;
        if (!list.length) return;

        this.initialState = this._createSnapshot();
        if (this.selection.calculateViewportInsets) this.selection.calculateViewportInsets();

        const p = this.toWorld(px, py);
        this.startWorld = p;

        this.draggingMove = true;
        this.draggingResize = false;
        this.draggingRotate = false;

        this.moveStartData = list.map(e => {
            const t = this._getTransform(e);
            return {
                e,
                x: t.x,
                y: t.y
            };
        });
    }

    beginResize(handle, px, py) {
        const list = this.selection.selectedList;
        if (!list.length) return;

        this.initialState = this._createSnapshot();
        if (this.selection.calculateViewportInsets) this.selection.calculateViewportInsets();

        const p = this.toWorld(px, py);

        if (handle.mode === 'rotate') {
            this.draggingRotate = true;
            this.draggingResize = false;
            this.draggingMove = false;

            const e = list[0];
            const t = this._getTransform(e);
            this.rotateCenter = { x: t.x, y: t.y };
            this.rotateStartAngle = Math.atan2(p.y - t.y, p.x - t.x);
            this.entityStartRotation = t.rotation || 0;
        } else {
            this.draggingResize = true;
            this.draggingRotate = false;
            this.draggingMove = false;
            this.resizeType = handle.type;
            this.startWorld = p;

            this.resizeEntityStarts = list.map(e => {
                const t = this._getTransform(e);
                return {
                    e,
                    x: t.x, y: t.y,
                    w: t.width, h: t.height,
                    r: t.rotation || 0,
                    sx: t.scaleX ?? 1, sy: t.scaleY ?? 1
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

        this.computeHandles();

        if (this.selection.autoPanVel) {
            this.selection.autoPanVel.x = 0;
            this.selection.autoPanVel.y = 0;
        }

        if (wasInteracting) {
            const finalState = this._createSnapshot();
            const startState = this.initialState;

            const command = {
                name: "Transform Entity",
                undo: () => this._applyState(startState),
                redo: () => this._applyState(finalState)
            };
            if (this.game.history) this.game.history.push(command);

            if (this.selection.selectedList.length > 0) {
                bus.emit("entity:modified", this.selection.selectedList);
            }
        }
    }

    update() {
        if (!this.active) return;
        const list = this.selection.selectedList;
        if (!list.length) return;

        const p = this.input.getPointer();
        const worldP = this.toWorld(p.x, p.y);

        if (this.selection.applyPointerAutoPan) {
            this.selection.applyPointerAutoPan(p.x, p.y);
        }

        if (this.draggingMove) {
            this.operator.move(worldP, this.startWorld, this.moveStartData, list);
        } 
        else if (this.draggingResize) {
            this.operator.resize(worldP, this.startWorld, this.resizeType, this.resizeEntityStarts, list);
        } 
        else if (this.draggingRotate) {
            this.operator.rotate(worldP, this.rotateCenter, this.rotateStartAngle, this.entityStartRotation, list);
        }

        if (this.selection.updateAutoPan) this.selection.updateAutoPan();
        if (!p.down) this.resetDrag();
    }

    draw(shape, proj) {
        if (!this.active) return;
        this.geometry.computeHandles(this.selection.selectedList);
        this.drawer.draw(shape, proj, this.geometry);
    }
}