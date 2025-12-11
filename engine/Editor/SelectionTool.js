import Config from "../Core/Config.js";
import { bus } from "../Util/EventBus.js";

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
        this.LONG_PRESS_TIME = 50;

        this.lastAutoPanTime = 0;
        this.autoPanVel = { x: 0, y: 0 };
        
        this.viewportInsets = { top: 0, left: 0, right: 0, bottom: 0 };

        world.selectionRenderer = (image, shape, text, proj) => {
            this.drawSelected(shape, proj);
            this.drawMultiSelection(shape, proj);
            this.drawHover(shape, proj);
            if (this.transform) this.transform.draw(shape, proj);
            this.drawMarquee(shape, proj);
        };
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

    getBounding(e) {
        if (e.components?.TextRenderer)
            return { x: e.hitX, y: e.hitY, w: e.hitWidth, h: e.hitHeight };
        if (e.shape?.type === "line")
            return { x: e.hitX, y: e.hitY, w: e.hitWidth, h: e.hitHeight };
        return { x: e.x, y: e.y, w: e.width, h: e.height };
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

        const isDraggingResize = this.transform && this.transform.draggingResize;

        if (p.down && this.isPointerDown && !this.isLongPress && !isDraggingResize) {
            if (performance.now() - this.pointerDownTime >= this.LONG_PRESS_TIME) {
                this.isLongPress = true;

                if (p.isTouch) {
                    const w = this.toWorld(px, py);
                    const hit = this.hit(w.x, w.y);
                    if (hit && this.transform) this.transform.beginMove(px, py, true);
                    return;
                }

                if (this.selectedList.length > 1 && this.isInsideGroup(px, py)) {
                    if (this.transform) this.transform.beginMove(px, py, false);
                } else {
                    const w = this.toWorld(px, py);
                    const hit = this.hit(w.x, w.y);
                    if (hit && this.transform) this.transform.beginMove(px, py, false);
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
                this.canvas.style.cursor = this.transform.getCursor(this.hoverHandle.type);
                return;
            }
        }

        if (this.selectedList.length > 1 && this.isInsideGroup(px, py)) {
            this.canvas.style.cursor = "move";
            this.hovered = null;
            return;
        }

        const p = this.toWorld(px, py);
        this.hovered = this.hit(p.x, p.y);

        if (this.hovered) {
            this.canvas.style.cursor = "move";
        } else {
            this.canvas.style.cursor = "default";
        }
    }

    isInsideGroup(px, py) {
        if (this.selectedList.length <= 1) return false;

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const e of this.selectedList) {
            const b = this.getBounding(e);
            if (b.x < minX) minX = b.x;
            if (b.y < minY) minY = b.y;
            if (b.x + b.w > maxX) maxX = b.x + b.w;
            if (b.y + b.h > maxY) maxY = b.y + b.h;
        }

        const p = this.toWorld(px, py);
        return (p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY);
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

                const b = this.getBounding(e);
                const i =
                    b.x + b.w >= box.x &&
                    b.x <= box.x + box.w &&
                    b.y + b.h >= box.y &&
                    b.y <= box.y + box.h;

                if (i) list.push(e);
            }
        }

        this.hoverMarqueeList = list;
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

    pointerDown(px, py, isTouch) {
        const w = this.toWorld(px, py);
        const hit = this.hit(w.x, w.y);

        if (this.transform && this.hoverHandle) {
            this.transform.beginResize(this.hoverHandle.type, px, py);
            return;
        }

        const ctrl = this.input.keyboard.ctrl || this.input.keyboard.shift || this.input.keyboard.meta;

        if (!ctrl && this.selectedList.length > 1 && this.isInsideGroup(px, py)) {
            return;
        }

        if (hit) {
            const inside = this.selectedList.includes(hit);

            if (ctrl) {
                this.selectedList = inside
                    ? this.selectedList.filter(a => a !== hit)
                    : [...this.selectedList, hit];
            } else {
                if (!inside) this.selectedList = [hit];
            }

            bus.emit("entity:selected", this.selectedList);
            return;
        }

        if (!isTouch) {
            this.calculateViewportInsets();
            this.marqueeActive = true;
            const w2 = this.toWorld(px, py);

            this.marqueeStart.x = w2.x;
            this.marqueeStart.y = w2.y;
            this.marqueeEnd.x = w2.x;
            this.marqueeEnd.y = w2.y;

            this.updateHoverMarquee();
        }
    }

    pointerUp(px, py) {
        // --- Perbaikan Utama di SelectionTool ---
        if (this.transform) {
            this.transform.resetDrag();
        }
        // ----------------------------------------
        
        if (!this.isLongPress) {
            const w = this.toWorld(px, py);
            const hit = this.hit(w.x, w.y);
            if (!hit && !this.marqueeActive) {
                this.selectedList = [];
                bus.emit("entity:deselected");
                return;
            }
        }

        if (!this.marqueeActive) return;

        const box = this.getMarqueeWorld();
        const list = [];

        for (const layerId of this.world.layerOrder) {
            if (this.marqueeUseLayerFilter) {
                if (!this.marqueeAllowedLayers.includes(layerId)) continue;
            }

            if (!this.world.layerVisibility[layerId]) continue;

            const ents = this.world.layers.get(layerId);
            if (!ents) continue;

            for (const e of ents) {
                if (!e.visible) continue;

                const b = this.getBounding(e);
                const i =
                    b.x + b.w >= box.x &&
                    b.x <= box.x + box.w &&
                    b.y + b.h >= box.y &&
                    b.y <= box.y + box.h;

                if (i) list.push(e);
            }
        }

        this.selectedList = list;
        bus.emit("entity:selected", list);

        this.marqueeActive = false;
        this.hoverMarqueeList = [];
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

            for (let i = 0; i < ents.length; i++) {
                const e = ents[i];
                if (!e.visible) continue;

                const b = this.getBounding(e);
                if (wx >= b.x && wx <= b.x + b.w &&
                    wy >= b.y && wy <= b.y + b.h) {
                    const z = e.zIndex || 0;
                    if (z > bestZ) {
                        bestZ = z;
                        best = e;
                    }
                }
            }

            if (best) return best;
        }

        return null;
    }

    getMarqueeWorld() {
        const x1 = Math.min(this.marqueeStart.x, this.marqueeEnd.x);
        const y1 = Math.min(this.marqueeStart.y, this.marqueeEnd.y);
        const x2 = Math.max(this.marqueeStart.x, this.marqueeEnd.x);
        const y2 = Math.max(this.marqueeStart.y, this.marqueeEnd.y);

        return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
    }

    updateAutoPan() {
        const now = performance.now();
        const dt = (now - this.lastAutoPanTime) / 1000;
        this.lastAutoPanTime = now;

        if (Math.abs(this.autoPanVel.x) < 0.01 &&
            Math.abs(this.autoPanVel.y) < 0.01) return;

        const cam = this.game.camera;
        const scale = Math.max(0.001, cam.scale);

        cam.x += (this.autoPanVel.x / scale) * dt;
        cam.y += (this.autoPanVel.y / scale) * dt;

        this.autoPanVel.x *= 0.85;
        this.autoPanVel.y *= 0.85;
    }

    applyPointerAutoPan(px, py) {
        const rect = this.canvas.getBoundingClientRect();
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

        const getSpeed = (distance) => {
            if (distance <= 0) return 0;
            const t = Math.min(1.5, distance / margin);
            return maxSpeed * (t * t);
        };

        const leftEdge = this.viewportInsets.left;
        const distLeft = (leftEdge + margin) - cssX;
        if (distLeft > 0) vx = -getSpeed(distLeft);

        const rightEdge = W - this.viewportInsets.right;
        const distRight = cssX - (rightEdge - margin);
        if (distRight > 0) vx = getSpeed(distRight);

        const topEdge = this.viewportInsets.top;
        const distTop = (topEdge + margin) - cssY;
        if (distTop > 0) vy = -getSpeed(distTop);

        const bottomEdge = H - this.viewportInsets.bottom;
        const distBottom = cssY - (bottomEdge - margin);
        if (distBottom > 0) vy = getSpeed(distBottom);

        this.autoPanVel.x = Math.min(maxSpeed, Math.max(-maxSpeed, this.autoPanVel.x + vx));
        this.autoPanVel.y = Math.min(maxSpeed, Math.max(-maxSpeed, this.autoPanVel.y + vy));
    }

    applyMarqueeAutoPan(px, py) {
        const dragThreshold = 5; 
        const dx = Math.abs(this.marqueeStart.x - this.marqueeEnd.x);
        const dy = Math.abs(this.marqueeStart.y - this.marqueeEnd.y);
        
        const scale = this.game.camera.scale;
        if (dx * scale < dragThreshold && dy * scale < dragThreshold) {
            return;
        }

        this.applyPointerAutoPan(px, py);
    }

    drawMarquee(shape, proj) {
        if (!this.marqueeActive) return;
        const b = this.getMarqueeWorld();
        const t = 1 / this.game.camera.scale;
        const c = this.outlineColor;
        const fill = [c[0], c[1], c[2], 0.15];

        shape.drawRect(b.x, b.y, b.w, b.h, fill, proj);
        shape.drawLine(b.x, b.y, b.x + b.w, b.y, c, t, proj);
        shape.drawLine(b.x + b.w, b.y, b.x + b.w, b.y + b.h, c, t, proj);
        shape.drawLine(b.x + b.w, b.y + b.h, b.x, b.y + b.h, c, t, proj);
        shape.drawLine(b.x, b.y + b.h, b.x, b.y, c, t, proj);
    }

    drawHover(shape, proj) {
        const t = 1.5 / this.game.camera.scale;
        const c = this.outlineColor;

        if (this.hovered) {
            const b = this.getBounding(this.hovered);
            shape.drawLine(b.x, b.y, b.x + b.w, b.y, c, t, proj);
            shape.drawLine(b.x + b.w, b.y, b.x + b.w, b.y + b.h, c, t, proj);
            shape.drawLine(b.x + b.w, b.y + b.h, b.x, b.y + b.h, c, t, proj);
            shape.drawLine(b.x, b.y + b.h, b.x, b.y, c, t, proj);
        }

        for (const e of this.hoverMarqueeList) {
            const b = this.getBounding(e);
            shape.drawLine(b.x, b.y, b.x + b.w, b.y, c, t, proj);
            shape.drawLine(b.x + b.w, b.y, b.x + b.w, b.y + b.h, c, t, proj);
            shape.drawLine(b.x + b.w, b.y + b.h, b.x, b.y + b.h, c, t, proj);
            shape.drawLine(b.x, b.y + b.h, b.x, b.y, c, t, proj);
        }
    }

    drawSelected(shape, proj) {
        if (!this.selectedList.length) return;

        const t = 2 / this.game.camera.scale;
        const c = this.outlineColor;

        for (const e of this.selectedList) {
            const b = this.getBounding(e);
            shape.drawLine(b.x, b.y, b.x + b.w, b.y, c, t, proj);
            shape.drawLine(b.x + b.w, b.y, b.x + b.w, b.y + b.h, c, t, proj);
            shape.drawLine(b.x + b.w, b.y + b.h, b.x, b.y + b.h, c, t, proj);
            shape.drawLine(b.x, b.y + b.h, b.x, b.y, c, t, proj);
        }
    }

    drawMultiSelection(shape, proj) {
        if (this.selectedList.length <= 1) return;

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const e of this.selectedList) {
            const b = this.getBounding(e);
            if (b.x < minX) minX = b.x;
            if (b.y < minY) minY = b.y;
            if (b.x + b.w > maxX) maxX = b.x + b.w;
            if (b.y + b.h > maxY) maxY = b.y + b.h;
        }

        const t = 2 / this.game.camera.scale;
        const c = this.outlineColor;

        shape.drawLine(minX, minY, maxX, minY, c, t, proj);
        shape.drawLine(maxX, minY, maxX, maxY, c, t, proj);
        shape.drawLine(maxX, maxY, minX, maxY, c, t, proj);
        shape.drawLine(minX, maxY, minX, minY, c, t, proj);
    }
}