import Config from "../Core/Config.js";
import { ApplyResizeToEntity } from "../Util/ApplyResizeToEntity.js";
import { bus } from "../Util/EventBus.js";
import { TransformGeometry } from "./Transform/TransformGeometry.js";
import { TransformRenderer } from "./Transform/TransformRenderer.js";
import { TransformMediator } from "./Transform/TransformMediator.js";
import { UISmartGuides } from "./Transform/UISmartGuides.js";
import RenderUtils from "../Renderer/Scene/RenderUtils.js";

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
        this.smartGuides = new UISmartGuides(world, game, this.geometry);
        this.mediator = new TransformMediator(world, game, input, this.smartGuides);

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

    _isInteractive(e) {
        if (!e) return false;
        if (!RenderUtils.isEntityEffectivelyActive(e, this.world) || !RenderUtils.isEntityEffectivelyVisible(e, this.world)) return false;
        if (RenderUtils.isEntityEffectivelyLocked(e, this.world)) return false;

        const parentLayer = this._findLayerOfEntity(e);
        if (parentLayer && (parentLayer.active === false || parentLayer.visible === false || parentLayer.locked)) {
            return false;
        }

        const { activeTabId, tabs } = this.world?._editors || {};
        const activeTab = tabs?.find(t => t.id === activeTabId);

        const isUIMode = activeTab?.type === 'ui';
        const isSceneMode = activeTabId === 'scene' || !activeTabId;

        const isEntityUI = this._isEntityInUILayer(e);

        if (isUIMode) {
            if (!isEntityUI) return false;
        } else if (isSceneMode) {
            if (isEntityUI) return false;
        }

        return true;
    }

    _findLayerOfEntity(targetEntity) {
        const allLayers = [...(this.world?.layersWorld || []), ...(this.world?.layersUI || [])];
        for (const layer of allLayers) {
            if (layer?.entities && layer.entities.some(e => String(e.id) === String(targetEntity.id))) {
                return layer;
            }
        }
        return null;
    }

    _isEntityInUILayer(targetEntity) {
        const uiLayers = this.world?.layersUI || [];
        for (const layer of uiLayers) {
            if (layer?.entities && layer.entities.some(e => String(e.id) === String(targetEntity.id))) {
                return true;
            }
        }
        return false;
    }

    _getTopLevelEntities(entities) {
        return entities.filter(e => {
            let curr = this.mediator.engine.findEntityInWorld(e.parentId);
            while (curr) {
                if (entities.some(sel => String(sel.id) === String(curr.id))) return false;
                curr = this.mediator.engine.findEntityInWorld(curr.parentId);
            }
            return true;
        });
    }

    toWorld(px, py) {
        return this.selection.toWorld(px, py);
    }

    computeHandles() {
        const interactables = (this.selection?.selectedList || []).filter(e => this._isInteractive(e));
        this.geometry.computeHandles(interactables);
    }

    getHoverHandle(px, py) {
        const w = this.toWorld(px, py);
        return this.geometry.getHoverHandle(w.x, w.y);
    }

    getCursor(handle) {
        return this.geometry.getCursor(handle);
    }

    _createSnapshot() {
        const validList = (this.selection?.selectedList || []).filter(e => this._isInteractive(e));
        return validList.map(e => ({
            id: e.id,
            components: JSON.parse(JSON.stringify(e.components || {})),
            active: e.active,
            visible: e.visible,
            _editor: e._editor ? JSON.parse(JSON.stringify(e._editor)) : {}
        }));
    }

    _applyState(list) {
        const affected = [];
        list.forEach(s => {
            const ent = this.mediator.engine.findEntityInWorld(s.id);
            if (ent) {
                ent.components = JSON.parse(JSON.stringify(s.components || {}));
                ent.active = s.active;
                ent.visible = s.visible;
                if (s._editor) ent._editor = JSON.parse(JSON.stringify(s._editor));
                ApplyResizeToEntity(ent, this.world);
                affected.push(ent);
            }
        });
        if (affected.length) {
            this.selection.selectedList = affected;
            bus.emit("entity:modified", list);
        }
    }

    beginMove(px, py) {
        const validEntities = (this.selection?.selectedList || []).filter(e => this._isInteractive(e));
        if (!validEntities.length) return;

        this.initialState = this._createSnapshot();
        this.startWorld = this.toWorld(px, py);
        this.draggingMove = true;
        this.draggingResize = false;
        this.draggingRotate = false;

        const topLevelEntities = this._getTopLevelEntities(validEntities);
        this.moveStartData = topLevelEntities.map(e => {
            const t = this.mediator.engine.getTransform(e);
            return { e, x: t.x || 0, y: t.y || 0 };
        });

        const { activeTabId, tabs } = this.world?._editors || {};
        const activeTab = tabs?.find(t => t.id === activeTabId);
        const isUIMode = activeTab?.type === 'ui';
        if (isUIMode && this.smartGuides) {
            this.smartGuides.beginDrag(validEntities);
        }
    }

    // Editor/TransformTool.js

    beginResize(handle, px, py) {
        const validEntities = (this.selection?.selectedList || []).filter(e => this._isInteractive(e));
        if (!validEntities.length) return;

        this.initialState = this._createSnapshot();
        this.startWorld = this.toWorld(px, py); // Store initial World Space reference point
        const topLevelEntities = this._getTopLevelEntities(validEntities);

        if (handle.mode === 'rotate') {
            this.draggingRotate = true;
            this.draggingResize = false;
            this.draggingMove = false;

            if (topLevelEntities.length === 1) {
                const absPos = this.geometry.calculateAbsolutePosition(topLevelEntities[0]);
                this.rotateCenter = { x: absPos.x, y: absPos.y };
                this.rotateStartAngle = Math.atan2(this.startWorld.y - absPos.y, this.startWorld.x - absPos.x);
                const t = this.mediator.engine.getTransform(topLevelEntities[0]);
                this.entityStartRotation = t.rotation || 0;
            } else {
                const bounds = this.geometry.computeGroupBounds();
                const cx = bounds ? bounds.x + bounds.w / 2 : this.startWorld.x;
                const cy = bounds ? bounds.y + bounds.h / 2 : this.startWorld.y;

                this.rotateCenter = { x: cx, y: cy };
                this.rotateStartAngle = Math.atan2(this.startWorld.y - cy, this.startWorld.x - cx);
                this.resizeEntityStarts = topLevelEntities.map(e => {
                    const t = this.mediator.engine.getTransform(e);
                    return { e, startRotation: t.rotation || 0, startX: t.x || 0, startY: t.y || 0 };
                });
            }
        } else {
            this.draggingResize = true;
            this.draggingRotate = false;
            this.draggingMove = false;
            this.resizeType = handle.type;

            // Explicitly copy initial values as primitives
            this.resizeEntityStarts = topLevelEntities.map(e => {
                const t = this.mediator.engine.getTransform(e);
                let sx = t.scaleX ?? 1, sy = t.scaleY ?? 1;
                let fx = Boolean(t.flipX), fy = Boolean(t.flipY);

                if (sx < 0) { sx *= -1; fx = !fx; }
                if (sy < 0) { sy *= -1; fy = !fy; }

                return {
                    e,
                    x: Number(t.x || 0),
                    y: Number(t.y || 0),
                    w: Number(t.width || 0),
                    h: Number(t.height || 0),
                    r: Number(t.rotation || 0),
                    fontSize: Number(e.components?.TextRenderer?.fontSize || 24),
                    sx, sy, flipX: fx, flipY: fy,
                    isRatioLocked: Boolean(t.isRatioLocked)
                };
            });

            const { activeTabId, tabs } = this.world?._editors || {};
            const activeTab = tabs?.find(t => t.id === activeTabId);
            const isUIMode = activeTab?.type === 'ui';
            if (isUIMode && this.smartGuides) {
                this.smartGuides.beginResize(validEntities, handle.type);
            }
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

        if (this.smartGuides) {
            this.smartGuides.clear();
        }

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
        const list = this.selection?.selectedList || [];
        if (!list.length) return;

        const { activeTabId, tabs } = this.world?._editors || {};
        const activeTab = tabs?.find(t => t.id === activeTabId);
        const isUIMode = activeTab?.type === 'ui';

        const p = this.input.getPointer();
        const worldP = this.toWorld(p.x, p.y);

        if (this.draggingMove && this.moveStartData) {
            this.mediator.processMove(worldP, this.startWorld, this.moveStartData, list, isUIMode);
        } else if (this.draggingResize && this.resizeEntityStarts) {
            this.mediator.processResize(worldP, this.startWorld, this.resizeType, this.resizeEntityStarts, list, isUIMode);
        } else if (this.draggingRotate) {
            if (this.resizeEntityStarts && this.resizeEntityStarts.length > 1) {
                this.mediator.processRotateMulti(worldP, this.rotateCenter, this.rotateStartAngle, this.resizeEntityStarts, list, isUIMode);
            } else {
                this.mediator.processRotateSingle(worldP, this.rotateCenter, this.rotateStartAngle, this.entityStartRotation, list, isUIMode);
            }
        }

        if (!p.down) this.resetDrag();
    }

    draw(shape, proj) {
        if (!this.active) return;
        this.computeHandles();
        this.drawer.draw(shape, proj, this.geometry);

        const { activeTabId, tabs } = this.world?._editors || {};
        const activeTab = tabs?.find(t => t.id === activeTabId);
        const isUIMode = activeTab?.type === 'ui';

        if (isUIMode && this.smartGuides) {
            this.smartGuides.draw(shape, proj);
        }
    }
}