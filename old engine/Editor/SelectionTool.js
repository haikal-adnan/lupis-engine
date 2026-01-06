import Config from "../Core/Config.js";
import { bus } from "../Util/EventBus.js";
import { calculateQuadVertices } from "../Util/calculateQuadVertices.js";

export default class SelectionTool {
    constructor(world, game, canvas, renderer, input) {
        this.world = world;
        this.game = game;
        this.canvas = canvas;
        this.renderer = renderer;
        this.input = input;

        this.active = Config.EDITOR.SELECTION;

        this.hovered = null;
        this.hoverMarqueeList = [];
        this.selectedList = [];

        this.marqueeUseLayerFilter = false;
        this.marqueeAllowedLayers = ["background"];

        this.isPointerDown = false;
        this.marqueeActive = false;

        this.marqueeStart = { x: 0, y: 0 };
        this.marqueeEnd = { x: 0, y: 0 };

        this.outlineColor = [0, 0.55, 1, 1];
        this.hoverHandle = null;

        this.pointerDownTime = 0;
        this.isLongPress = false;
        this.LONG_PRESS_TIME = 10;

        this.lastAutoPanTime = 0;
        this.autoPanVel = { x: 0, y: 0 };
        
        this.viewportInsets = { top: 0, left: 0, right: 0, bottom: 0 };

        this.onExternalSelect = (list) => {
            this.syncSelectionFromBus(list);
        };

        this.onUISelect = (ids) => {
            this.handleUISelect(ids);
        };

        this.onPrefabSelect = () => {
            this.selectedList = [];
            this.hovered = null;
        };

        bus.on("entity:selected", this.onExternalSelect);
        bus.on("ui:select-by-id", this.onUISelect);
        bus.on("prefab:selected", this.onPrefabSelect);
        
        bus.on("entity:deselected", () => {
            this.selectedList = [];
        });

        world.selectionRenderer = (image, shape, text, proj) => {
            if (!this.active) return;
            this.drawHover(shape, proj);
            this.drawSelected(shape, proj);
            if (this.transform) this.transform.draw(shape, proj);
            this.drawMarquee(shape, proj);
        };
    }

    handleUISelect(ids) {
        if (!ids || ids.length === 0) {
            this.selectedList = [];
            bus.emit("entity:deselected");
            return;
        }

        const realEntities = [];
        const idsToFind = Array.isArray(ids) ? ids : [ids];

        for (const [layerId, ents] of this.world.layers) {
            for (const e of ents) {
                if (idsToFind.includes(e._id || e.id)) {
                    realEntities.push(e);
                }
            }
        }

        if (realEntities.length > 0) {
            this.selectedList = realEntities;
            bus.emit("entity:selected", this.selectedList);
        }
    }

    syncSelectionFromBus(externalList) {
        if (!externalList || externalList.length === 0) {
            this.selectedList = [];
            return;
        }
        if (externalList === this.selectedList) return;

        if (externalList[0]?.isAsset || externalList[0]?.isPrefabMaster) {
            this.selectedList = [];
            return;
        }

        if (externalList[0] && externalList[0].transform) {
             this.selectedList = externalList;
        }
    }

    destroy() {
        bus.off("entity:selected", this.onExternalSelect);
        bus.off("ui:select-by-id", this.onUISelect);
        bus.off("prefab:selected", this.onPrefabSelect);
    }

    _findEntity(id) {
        for (const [lid, ents] of this.world.layers) {
            const found = ents.find(e => (e._id || e.id) === id);
            if (found) return found;
        }
        return null;
    }

    _findChildren(parentId) {
        let children = [];
        for (const [lid, ents] of this.world.layers) {
            children.push(...ents.filter(e => e.parentId === parentId && e.visible));
        }
        return children;
    }

    attachTransform(t) {
        this.transform = t;
    }

    getPrimary() {
        return this.selectedList.length ? this.selectedList[0] : null;
    }

    toWorld(px, py) {
        const c = this.game.camera;
        const s = c.scale;
        const W = this.canvas.width;
        const H = this.canvas.height;
        return {
            x: c.x + (px - W * 0.5) / s,
            y: c.y + (py - H * 0.5) / s
        };
    }

    getAABB(e) {
        const t = e.transform;
        const r = t.rotation || 0;
        const sx = t.scaleX ?? 1;
        const sy = t.scaleY ?? 1;
        const px = t.pivotX ?? 0.5;
        const py = t.pivotY ?? 0.5;

        const v = calculateQuadVertices(t.x, t.y, e.width, e.height, r, sx, sy, px, py);
        const xs = [v.tl.x, v.tr.x, v.bl.x, v.br.x];
        const ys = [v.tl.y, v.tr.y, v.bl.y, v.br.y];

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    update() {
        if (!this.active) return;

        const p = this.input.getPointer();
        const px = p.x;
        const py = p.y;

        this.updateHover(px, py);

        if (p.down && !this.isPointerDown) {
            this.pointerDownTime = performance.now();
            this.isLongPress = false;
            this.pointerDown(px, py, p.isTouch);
            this.isPointerDown = true;
        }

        const isDraggingResize = this.transform && (this.transform.draggingResize || this.transform.draggingMove || this.transform.draggingRotate);

        if (p.down && this.isPointerDown && !this.isLongPress && !isDraggingResize) {
            if (performance.now() - this.pointerDownTime >= this.LONG_PRESS_TIME) {
                this.isLongPress = true;
                const w = this.toWorld(px, py);
                
                if (this.selectedList.length > 1 && this.isInsideGroup(w.x, w.y)) {
                      if (this.transform) this.transform.beginMove(px, py, false);
                } else {
                    const hit = this.hit(w.x, w.y);
                    if (hit && this.transform) {
                        if(!this.selectedList.includes(hit)) {
                            this.selectedList = [hit];
                            bus.emit("entity:selected", this.selectedList);
                        }
                        this.transform.beginMove(px, py, false);
                    }
                }
            }
        }

        if (!p.isTouch && p.down && this.marqueeActive) {
            const w = this.toWorld(px, py);
            this.marqueeEnd.x = w.x;
            this.marqueeEnd.y = w.y;

            this.updateHoverMarquee();
            this.applyMarqueeAutoPan(px, py);
        }

        if (!p.down && this.isPointerDown) {
            this.pointerUp(px, py);
            this.isPointerDown = false;
        }

        this.updateAutoPan();
    }

    updateHover(px, py) {
        this.hoverHandle = null;

        if (this.isPointerDown) return;

        if (this.transform && this.selectedList.length > 0) {
            this.transform.computeHandles();
            this.hoverHandle = this.transform.getHoverHandle(px, py);
            if (this.hoverHandle) {
                this.canvas.style.cursor = this.transform.getCursor(this.hoverHandle);
                this.hovered = null;
                return;
            }
        }

        const w = this.toWorld(px, py);

        if (this.selectedList.length > 1 && this.isInsideGroup(w.x, w.y)) {
            this.canvas.style.cursor = "move";
            this.hovered = null;
            return;
        }

        this.hovered = this.hit(w.x, w.y);

        if (this.hovered) {
            const isSelected = this.selectedList.includes(this.hovered);
            this.canvas.style.cursor = isSelected ? "move" : "pointer";
        } else {
            this.canvas.style.cursor = "default";
        }
    }

    isInsideGroup(wx, wy) {
        if (this.selectedList.length <= 1) return false;
        const box = this.transform ? this.transform.computeGroupBounds() : null;
        if (!box) return false;
        return (wx >= box.x && wx <= box.x + box.w && wy >= box.y && wy <= box.y + box.h);
    }

    updateHoverMarquee() {
        if (!this.marqueeActive) {
            this.hoverMarqueeList = [];
            return;
        }

        const box = this.getMarqueeWorld();
        const list = [];

        for (const layerId of this.world.layerOrder) {
            if (!this.world.layerVisibility[layerId]) continue;
            const ents = this.world.layers.get(layerId);
            if (!ents) continue;

            for (const e of ents) {
                if (!e.visible) continue;
                const b = this.getAABB(e);
                const overlap = 
                    b.x < box.x + box.w &&
                    b.x + b.w > box.x &&
                    b.y < box.y + box.h &&
                    b.y + b.h > box.y;

                if (overlap) list.push(e);
            }
        }
        this.hoverMarqueeList = list;
    }

    pointerDown(px, py, isTouch) {
        const w = this.toWorld(px, py);
        
        if (this.transform && this.hoverHandle) {
            this.transform.beginResize(this.hoverHandle, px, py);
            return;
        }

        const ctrl = this.input.keyboard.ctrl || this.input.keyboard.shift || this.input.keyboard.meta;
        const hit = this.hit(w.x, w.y);
        
        if (hit) {
            const inside = this.selectedList.includes(hit);

            if (ctrl) {
                this.selectedList = inside
                    ? this.selectedList.filter(a => a !== hit)
                    : [...this.selectedList, hit];
            } else {
                if (!inside) {
                    this.selectedList = [hit];
                }
            }
            bus.emit("entity:selected", this.selectedList);
            return;
        }

        if (!isTouch && !hit) {
            this.calculateViewportInsets();
            this.marqueeActive = true;
            this.selectedList = [];
            bus.emit("entity:deselected");

            this.marqueeStart.x = w.x;
            this.marqueeStart.y = w.y;
            this.marqueeEnd.x = w.x;
            this.marqueeEnd.y = w.y;
            
            this.updateHoverMarquee();
        }
    }

    pointerUp(px, py) {
        if (this.transform) this.transform.resetDrag();

        if (this.marqueeActive) {
            let selectionSet = new Set(this.hoverMarqueeList);
            let hasChanged = true;

            while (hasChanged) {
                hasChanged = false;
                const parentIdsToCheck = new Set();
                for (const e of selectionSet) {
                    if (e.parentId) parentIdsToCheck.add(e.parentId);
                }

                for (const pid of parentIdsToCheck) {
                    const parent = this._findEntity(pid);
                    if (!parent || selectionSet.has(parent)) continue;

                    const children = this._findChildren(pid);
                    if (children.length === 0) continue;

                    const allChildrenSelected = children.every(c => selectionSet.has(c));
                    if (allChildrenSelected) {
                        selectionSet.add(parent);
                        hasChanged = true;
                    }
                }
            }

            this.selectedList = Array.from(selectionSet);
            bus.emit("entity:selected", this.selectedList);
            
            this.marqueeActive = false;
            this.hoverMarqueeList = [];
            return;
        }

        if (!this.isLongPress && !this.marqueeActive) {
            const w = this.toWorld(px, py);
            if (!this.hit(w.x, w.y)) {
                this.selectedList = [];
                bus.emit("entity:deselected");
            }
        }
    }

    hit(wx, wy) {
        const world = this.world;
        for (let li = world.layerOrder.length - 1; li >= 0; li--) {
            const layerId = world.layerOrder[li];
            if (!world.layerVisibility[layerId]) continue;

            const ents = world.layers.get(layerId);
            if (!ents) continue;

            let best = null;
            let bestZ = -Infinity;

            for (const e of ents) {
                if (!e.visible) continue;
                if (this.isPointInEntity(wx, wy, e)) {
                    const z = e.transform.zIndex || 0;
                    if (z >= bestZ) {
                        bestZ = z;
                        best = e;
                    }
                }
            }
            if (best) return best;
        }
        return null;
    }

    isPointInEntity(wx, wy, e) {
        const t = e.transform;
        const r = t.rotation || 0;
        const sx = t.scaleX ?? 1;
        const sy = t.scaleY ?? 1;
        const px = t.pivotX ?? 0.5;
        const py = t.pivotY ?? 0.5;
        const w = e.width;
        const h = e.height;

        let dx = wx - t.x;
        let dy = wy - t.y;

        const c = Math.cos(-r);
        const s = Math.sin(-r);
        const localX = dx * c - dy * s;
        const localY = dx * s + dy * c;

        const unscaledMouseX = localX / sx;
        const unscaledMouseY = localY / sy;

        const left = -px * w;
        const right = w - (px * w);
        const top = -py * h;
        const bottom = h - (py * h);

        const minX = Math.min(left, right);
        const maxX = Math.max(left, right);
        const minY = Math.min(top, bottom);
        const maxY = Math.max(top, bottom);

        return (unscaledMouseX >= minX && unscaledMouseX <= maxX && 
                unscaledMouseY >= minY && unscaledMouseY <= maxY);
    }

    getMarqueeWorld() {
        const x1 = Math.min(this.marqueeStart.x, this.marqueeEnd.x);
        const y1 = Math.min(this.marqueeStart.y, this.marqueeEnd.y);
        const x2 = Math.max(this.marqueeStart.x, this.marqueeEnd.x);
        const y2 = Math.max(this.marqueeStart.y, this.marqueeEnd.y);
        return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
    }

    drawObb(shape, e, color, proj) {
        const t = e.transform;
        const r = t.rotation || 0;
        const sx = t.scaleX ?? 1;
        const sy = t.scaleY ?? 1;
        const px = t.pivotX ?? 0.5;
        const py = t.pivotY ?? 0.5;

        const v = calculateQuadVertices(t.x, t.y, e.width, e.height, r, sx, sy, px, py);
        const strokeT = 2 / this.game.camera.scale;

        shape.drawLine(v.tl.x, v.tl.y, v.tr.x, v.tr.y, color, strokeT, proj);
        shape.drawLine(v.tr.x, v.tr.y, v.br.x, v.br.y, color, strokeT, proj);
        shape.drawLine(v.br.x, v.br.y, v.bl.x, v.bl.y, color, strokeT, proj);
        shape.drawLine(v.bl.x, v.bl.y, v.tl.x, v.tl.y, color, strokeT, proj);
    }

    drawSelected(shape, proj) {
        if (!this.selectedList.length) return;
        const c = this.outlineColor;
        for (const e of this.selectedList) {
            this.drawObb(shape, e, c, proj);
        }
    }

    drawHover(shape, proj) {
        const c = [this.outlineColor[0], this.outlineColor[1], this.outlineColor[2], 0.5];
        if (this.hovered && !this.selectedList.includes(this.hovered)) {
            this.drawObb(shape, this.hovered, c, proj);
        }
        for (const e of this.hoverMarqueeList) {
            this.drawObb(shape, e, c, proj);
        }
    }

    drawMarquee(shape, proj) {
        if (!this.marqueeActive) return;
        const b = this.getMarqueeWorld();
        const t = 1 / this.game.camera.scale;
        const c = this.outlineColor;
        const fill = [c[0], c[1], c[2], 0.1];

        shape.drawRect(b.x, b.y, b.w, b.h, fill, proj);
        shape.drawLine(b.x, b.y, b.x+b.w, b.y, c, t, proj);
        shape.drawLine(b.x+b.w, b.y, b.x+b.w, b.y+b.h, c, t, proj);
        shape.drawLine(b.x+b.w, b.y+b.h, b.x, b.y+b.h, c, t, proj);
        shape.drawLine(b.x, b.y+b.h, b.x, b.y, c, t, proj);
    }
    
    calculateViewportInsets() {
        const topEl = document.getElementById("editor-topbar");
        const leftEl = document.getElementById("editor-sidebar-left");
        const rightEl = document.getElementById("editor-sidebar-right");
        this.viewportInsets = {
            top: topEl ? topEl.offsetHeight : 0,
            left: leftEl ? leftEl.offsetWidth : 0,
            right: rightEl ? rightEl.offsetWidth : 0,
            bottom: 0
        };
    }

    updateAutoPan() {
        const now = performance.now();
        const dt = (now - this.lastAutoPanTime) / 1000;
        this.lastAutoPanTime = now;
        if (Math.abs(this.autoPanVel.x) < 0.01 && Math.abs(this.autoPanVel.y) < 0.01) return;
        const cam = this.game.camera;
        const scale = Math.max(0.001, cam.scale);
        cam.x += (this.autoPanVel.x / scale) * dt;
        cam.y += (this.autoPanVel.y / scale) * dt;
        this.autoPanVel.x *= 0.85; this.autoPanVel.y *= 0.85;
    }

    applyPointerAutoPan(px, py) {
        const rect = this.canvas.getBoundingClientRect();
        const W = rect.width; const H = rect.height;
        const scaleX = this.canvas.width / W; const scaleY = this.canvas.height / H;
        const cssX = px / scaleX; const cssY = py / scaleY;
        const margin = 50; const maxSpeed = 600; 
        let vx = 0; let vy = 0;
        const getSpeed = (dist) => dist <= 0 ? 0 : maxSpeed * Math.min(1.5, dist/margin)**2;
        
        const distLeft = (this.viewportInsets.left + margin) - cssX; if(distLeft>0) vx=-getSpeed(distLeft);
        const distRight = cssX - (W - this.viewportInsets.right - margin); if(distRight>0) vx=getSpeed(distRight);
        const distTop = (this.viewportInsets.top + margin) - cssY; if(distTop>0) vy=-getSpeed(distTop);
        const distBottom = cssY - (H - this.viewportInsets.bottom - margin); if(distBottom>0) vy=getSpeed(distBottom);

        this.autoPanVel.x = Math.min(maxSpeed, Math.max(-maxSpeed, this.autoPanVel.x + vx));
        this.autoPanVel.y = Math.min(maxSpeed, Math.max(-maxSpeed, this.autoPanVel.y + vy));
    }

    applyMarqueeAutoPan(px, py) { this.applyPointerAutoPan(px, py); }
}