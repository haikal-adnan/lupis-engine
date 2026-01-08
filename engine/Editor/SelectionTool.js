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

        this.isPointerDown = false;
        
        this.marqueeActive = false;
        this.marqueeStart = { x: 0, y: 0 };
        this.marqueeEnd = { x: 0, y: 0 };

        this.outlineColor = [0, 0.55, 1, 1];
        this.hoverHandle = null;

        this.pointerDownTime = 0;
        this.isLongPress = false;
        this.LONG_PRESS_TIME = 20;

        this.lastAutoPanTime = 0;
        this.autoPanVel = { x: 0, y: 0 };
        this.viewportInsets = { top: 0, left: 0, right: 0, bottom: 0 };

        this.onExternalSelect = (list) => { this.syncSelectionFromBus(list); };
        this.onUISelect = (ids) => { this.handleUISelect(ids); };
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

    _getTransform(e) {
        return e.components && e.components.Transform;
    }
    
    _isLocked(e) {
        return e._editor && e._editor.locked;
    }

    toWorld(px, py) {
        const c = this.game.camera;
        const s = c.scale || 1;
        const W = this.canvas.width;
        const H = this.canvas.height;
        return {
            x: c.x + (px - W * 0.5) / s,
            y: c.y + (py - H * 0.5) / s
        };
    }

    getAABB(e) {
        const t = this._getTransform(e);
        if (!t) return { x:0, y:0, w:0, h:0 };

        const r = t.rotation || 0;
        const sx = t.scaleX ?? 1;
        const sy = t.scaleY ?? 1;
        const px = t.pivotX ?? 0.5;
        const py = t.pivotY ?? 0.5;

        const v = calculateQuadVertices(t.x, t.y, t.width, t.height, r, sx, sy, px, py);
        const xs = [v.tl.x, v.tr.x, v.bl.x, v.br.x];
        const ys = [v.tl.y, v.tr.y, v.bl.y, v.br.y];

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    getMarqueeWorld() {
        const x1 = Math.min(this.marqueeStart.x, this.marqueeEnd.x);
        const y1 = Math.min(this.marqueeStart.y, this.marqueeEnd.y);
        const x2 = Math.max(this.marqueeStart.x, this.marqueeEnd.x);
        const y2 = Math.max(this.marqueeStart.y, this.marqueeEnd.y);
        return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
    }

    destroy() {
        bus.off("entity:selected", this.onExternalSelect);
        bus.off("ui:select-by-id", this.onUISelect);
        bus.off("prefab:selected", this.onPrefabSelect);
    }

    attachTransform(t) {
        this.transform = t;
    }

    syncSelectionFromBus(externalList) {
        if (!externalList || externalList.length === 0) {
            this.selectedList = [];
            return;
        }
        if (externalList === this.selectedList) return;
        this.selectedList = externalList;
    }

    handleUISelect(ids) {
        if (!ids || ids.length === 0) {
            this.selectedList = [];
            bus.emit("entity:deselected");
            return;
        }

        const realEntities = [];
        const idsToFind = Array.isArray(ids) ? ids : [ids];

        const findRecursive = (id, entities) => {
             for (const e of entities) {
                if ((e._id || e.id) === id) return e;
                if (e.children && e.children.length > 0) {
                    const found = findRecursive(id, e.children);
                    if (found) return found;
                }
            }
            return null;
        };

        for (const id of idsToFind) {
            let found = null;
            for(const layer of this.world.layers) {
                if(layer.entities) {
                    found = findRecursive(id, layer.entities);
                    if(found) break;
                }
            }
            if(found) realEntities.push(found);
        }

        if (realEntities.length > 0) {
            this.selectedList = realEntities;
            bus.emit("entity:selected", this.selectedList);
        }
    }

    consolidateSelection(candidates) {
        if (!candidates || candidates.length <= 1) return candidates;
        
        const finalSet = new Set(candidates);
        let changed = true;
        let safeCounter = 0;

        while(changed && safeCounter < 10) {
            changed = false;
            safeCounter++;

            const parentMap = new Map();

            for (const e of finalSet) {
                if (e.parentId) {
                    if (!parentMap.has(e.parentId)) parentMap.set(e.parentId, []);
                    parentMap.get(e.parentId).push(e);
                }
            }

            for (const [parentId, childrenInSelection] of parentMap.entries()) {
                let parentEntity = null;
                const findRecursive = (id, list) => {
                     for(const e of list) {
                         if((e.id || e._id) === id) return e;
                         if(e.children) {
                             const f = findRecursive(id, e.children);
                             if(f) return f;
                         }
                     }
                     return null;
                };
                
                for(const l of this.world.layers) {
                    if(l.entities) {
                        parentEntity = findRecursive(parentId, l.entities);
                        if(parentEntity) break;
                    }
                }

                if (parentEntity && parentEntity.children) {
                    if (childrenInSelection.length === parentEntity.children.length) {
                        childrenInSelection.forEach(child => finalSet.delete(child));
                        finalSet.add(parentEntity);
                        changed = true;
                    }
                }
            }
        }

        return Array.from(finalSet);
    }

    _hitTestRecursive(entities, wx, wy) {
        for (let i = entities.length - 1; i >= 0; i--) {
            const e = entities[i];
            if (!e.visible || this._isLocked(e)) continue;

            if (e.children && e.children.length > 0) {
                const childHit = this._hitTestRecursive(e.children, wx, wy);
                if (childHit) return childHit;
            }

            if (e.type !== 'group') {
                if (this.isPointInEntity(wx, wy, e)) {
                    return e;
                }
            }
        }
        return null;
    }

    hit(wx, wy) {
        for (let li = this.world.layers.length - 1; li >= 0; li--) {
            const layer = this.world.layers[li];
            if (!layer.visible || layer.locked) continue;

            const found = this._hitTestRecursive(layer.entities, wx, wy);
            if (found) return found;
        }
        return null;
    }

    isPointInEntity(wx, wy, e) {
        const t = this._getTransform(e);
        if (!t) return false;

        const r = t.rotation || 0;
        const sx = t.scaleX ?? 1;
        const sy = t.scaleY ?? 1;
        const px = t.pivotX ?? 0.5;
        const py = t.pivotY ?? 0.5;
        const w = t.width;
        const h = t.height;

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

        const buffer = 5 / Math.abs(this.game.camera.scale || 1); 

        return (
            unscaledMouseX >= minX - buffer &&
            unscaledMouseX <= maxX + buffer &&
            unscaledMouseY >= minY - buffer &&
            unscaledMouseY <= maxY + buffer
        );
    }

    isInsideGroup(wx, wy) {
        if (this.selectedList.length <= 1) return false;
        const box = this.transform ? this.transform.computeGroupBounds() : null;
        if (!box) return false;
        return wx >= box.x && wx <= box.x + box.w && wy >= box.y && wy <= box.y + box.h;
    }

    _checkMarqueeRecursive(entities, box, list) {
        for (const e of entities) {
            if (!e.visible || this._isLocked(e)) continue;
            
            if (e.type === 'group') {
                if (e.children?.length) this._checkMarqueeRecursive(e.children, box, list);
                continue;
            }

            const t = this._getTransform(e);
            if (t) {
                const b = this.getAABB(e);
                const overlap =
                    b.x < box.x + box.w &&
                    b.x + b.w > box.x &&
                    b.y < box.y + box.h &&
                    b.y + b.h > box.y;
                if (overlap) list.push(e);
            }

            if (e.children?.length) this._checkMarqueeRecursive(e.children, box, list);
        }
    }

    updateHoverMarquee() {
        if (!this.marqueeActive) {
            this.hoverMarqueeList = [];
            return;
        }

        const box = this.getMarqueeWorld();
        const list = [];

        for (const layer of this.world.layers) {
            if (!layer.visible || layer.locked) continue;
            this._checkMarqueeRecursive(layer.entities, box, list);
        }

        this.hoverMarqueeList = list;
    }

    update() {
        if (!this.active) return;

        const p = this.input.getPointer();
        const px = p.x;
        const py = p.y;
        const w = this.toWorld(px, py);

        this.updateHover(px, py);

        if (p.down && !this.isPointerDown) {
            this.pointerDownTime = performance.now();
            this.isLongPress = false;
            this.pointerDown(px, py, p.isTouch);
            this.isPointerDown = true;
        }

        const isDraggingResize =
            this.transform &&
            (this.transform.draggingResize ||
             this.transform.draggingMove ||
             this.transform.draggingRotate);

        if (p.down && this.isPointerDown && !this.isLongPress && !isDraggingResize) {
            if (performance.now() - this.pointerDownTime >= this.LONG_PRESS_TIME) {
                this.isLongPress = true;
                
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

    pointerDown(px, py, isTouch) {
        const w = this.toWorld(px, py);
        
        if (this.transform && this.hoverHandle) {
            this.transform.beginResize(this.hoverHandle, px, py);
            return;
        }

        const ctrl =
            this.input.keyboard.ctrl ||
            this.input.keyboard.shift ||
            this.input.keyboard.meta;

        const hit = this.hit(w.x, w.y);
        
        if (hit) {
            const inside = this.selectedList.includes(hit);

            if (ctrl) {
                let newList = inside
                    ? this.selectedList.filter(a => a !== hit)
                    : [...this.selectedList, hit];
                
                newList = this.consolidateSelection(newList);
                this.selectedList = newList;
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
            let results = [...this.hoverMarqueeList];
            results = this.consolidateSelection(results);
            this.selectedList = results;
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

    drawObb(shape, e, color, proj) {
        const t = this._getTransform(e);
        if (!t) return;

        const r = t.rotation || 0;
        const sx = t.scaleX ?? 1;
        const sy = t.scaleY ?? 1;
        const px = t.pivotX ?? 0.5;
        const py = t.pivotY ?? 0.5;

        const v = calculateQuadVertices(t.x, t.y, t.width, t.height, r, sx, sy, px, py);
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
            if (e.type === 'group') continue;
            this.drawObb(shape, e, c, proj);
        }
    }

    drawHover(shape, proj) {
        const c = [
            this.outlineColor[0],
            this.outlineColor[1],
            this.outlineColor[2],
            0.5
        ];
        
        if (this.hovered && !this.selectedList.includes(this.hovered)) {
            if (this.hovered.type !== 'group') {
                this.drawObb(shape, this.hovered, c, proj);
            }
        }

        for (const e of this.hoverMarqueeList) {
            if (e.type !== 'group') {
                this.drawObb(shape, e, c, proj);
            }
        }
    }

    drawMarquee(shape, proj) {
        if (!this.marqueeActive) return;
        const b = this.getMarqueeWorld();
        
        const camScale = this.game.camera.scale || 1;
        const thickness = 1 / camScale;
        const c = this.outlineColor;
        const fill = [c[0], c[1], c[2], 0.1];

        shape.drawRect(b.x, b.y, b.w, b.h, fill, proj);
        
        if (shape.drawRectStroke) {
            shape.drawRectStroke(
                b.x, b.y, b.w, b.h, 
                c, thickness, proj, 
                0, 1, 1, 0, 0, 1
            );
        } else {
            shape.drawLine(b.x, b.y, b.x+b.w, b.y, c, thickness, proj);
            shape.drawLine(b.x+b.w, b.y, b.x+b.w, b.y+b.h, c, thickness, proj);
            shape.drawLine(b.x+b.w, b.y+b.h, b.x, b.y+b.h, c, thickness, proj);
            shape.drawLine(b.x, b.y+b.h, b.x, b.y, c, thickness, proj);
        }
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

        if (
            Math.abs(this.autoPanVel.x) < 0.01 &&
            Math.abs(this.autoPanVel.y) < 0.01
        ) return;

        const cam = this.game.camera;
        const scale = Math.max(0.001, cam.scale);

        cam.x += (this.autoPanVel.x / scale) * dt;
        cam.y += (this.autoPanVel.y / scale) * dt;

        this.autoPanVel.x *= 0.85;
        this.autoPanVel.y *= 0.85;
    }

    applyPointerAutoPan(px, py) {
        const rect = this.canvas.getBoundingClientRect();
        if(!rect) return;

        const W = rect.width;
        const H = rect.height;
        const scaleX = this.canvas.width / W;
        const scaleY = this.canvas.height / H;
        const cssX = px / scaleX;
        const cssY = py / scaleY;

        const margin = 50;
        const maxSpeed = 600;

        let vx = 0;
        let vy = 0;

        const getSpeed = (dist) =>
            dist <= 0 ? 0 : maxSpeed * Math.min(1.5, dist / margin) ** 2;
        
        const distLeft = (this.viewportInsets.left + margin) - cssX;
        if (distLeft > 0) vx = -getSpeed(distLeft);

        const distRight = cssX - (W - this.viewportInsets.right - margin);
        if (distRight > 0) vx = getSpeed(distRight);

        const distTop = (this.viewportInsets.top + margin) - cssY;
        if (distTop > 0) vy = -getSpeed(distTop);

        const distBottom = cssY - (H - this.viewportInsets.bottom - margin);
        if (distBottom > 0) vy = getSpeed(distBottom);

        this.autoPanVel.x = Math.min(
            maxSpeed,
            Math.max(-maxSpeed, this.autoPanVel.x + vx)
        );
        this.autoPanVel.y = Math.min(
            maxSpeed,
            Math.max(-maxSpeed, this.autoPanVel.y + vy)
        );
    }

    applyMarqueeAutoPan(px, py) {
        this.applyPointerAutoPan(px, py);
    }
}
