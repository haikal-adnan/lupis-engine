import Config from "../Core/Config.js";
import { bus } from "../Util/EventBus.js";
import { ApplyResizeToEntity } from "../Util/ApplyResizeToEntity.js";

export default class SelectionOutline {
    constructor(world, game, canvas, renderer, input) {
        this.world = world;
        this.game = game;
        this.canvas = canvas;
        this.renderer = renderer;
        this.input = input;

        this.active = Config.ENGINE_MODE === "editor";
        this.hovered = null;
        this.selected = null;

        this.isPointerDown = false;
        this.draggingMove = false;
        this.draggingResize = false;
        this.resizeType = null;

        this.startWorld = { x: 0, y: 0 };
        this.entStart = null;

        this.handles = [];
        this.hoverHandle = null;

        this.touchMode = "idle";
        this.holdTimer = null;
        this.allowTransform = false;

        world.selectionRenderer = (image, shape, text, proj) => {
            this._drawWorld(shape, proj);
        };
    }

    _world(px, py) {
        const cam = this.game.camera;
        const s = cam.scale;
        const W = this.canvas.width;
        const H = this.canvas.height;

        return {
            x: cam.x + (px - W * 0.5) / s,
            y: cam.y + (py - H * 0.5) / s
        };
    }

    getBounding(ent) {
        if (ent.components?.TextRenderer) {
            return { x: ent.hitX, y: ent.hitY, w: ent.hitWidth, h: ent.hitHeight };
        }
        if (ent.shape?.type === "line") {
            return { x: ent.hitX, y: ent.hitY, w: ent.hitWidth, h: ent.hitHeight };
        }
        return { x: ent.x, y: ent.y, w: ent.width, h: ent.height };
    }

    update() {
        if (!this.active) return;

        if (this.input.touch.active && this.input.touch.touches.length !== 1) {
            this.isPointerDown = false;
            this.draggingMove = false;
            this.draggingResize = false;
            return;
        }

        const p = this.input.getPointer();
        const px = p.x, py = p.y;

        this._hover(px, py);

        if (p.down && !this.isPointerDown) {
            this._down(px, py);
            this.isPointerDown = true;
        }

        if (!p.down && this.isPointerDown) {
            this.draggingMove = false;
            this.draggingResize = false;
            this.resizeType = null;
            this.hoverHandle = null;
            this.isPointerDown = false;

            if (this.selected) {
                delete this.selected._resizeStartSize;
                delete this.selected._resizeFactor;
            }
        }

        if (this.draggingMove) this._move(px, py);
        if (this.draggingResize) this._resize(px, py);
    }


    _hover(px, py) {
        if (this.draggingMove || this.draggingResize) return;

        if (!this.selected) {
            this._hoverEntity(px, py);
            return;
        }

        this._computeHandles();
        this._hoverHandle(px, py);

        if (this.hoverHandle) {
            this.canvas.style.cursor = this._cursor(this.hoverHandle.type);
            return;
        }

        this._hoverEntity(px, py);
        this.canvas.style.cursor = this.hovered ? "move" : "default";
    }

    _hoverEntity(px, py) {
        const p = this._world(px, py);
        this.hovered = null;

        for (const e of this.world.entities) {
            if (!e.visible) continue;
            const b = this.getBounding(e);
            if (p.x >= b.x && p.x <= b.x + b.w &&
                p.y >= b.y && p.y <= b.y + b.h) {
                this.hovered = e;
                return;
            }
        }
    }

    _down(px, py) {
        const p = this._world(px, py);

        if (this.hoverHandle) {
            this.draggingResize = true;
            this.resizeType = this.hoverHandle.type;

            const b = this.getBounding(this.selected);
            this.entStart = { x: b.x, y: b.y, w: b.w, h: b.h };
            this.startWorld = p;

            if (this.selected.components?.TextRenderer) {
                const t = this.selected.components.TextRenderer;
                this.selected._resizeStartSize = t.size;
                this.selected._resizeFactor = 1;
            }
            return;
        }

        const e = this._hit(p.x, p.y);
        if (e) {
            this.selected = e;
            bus.emit("entity:selected", e);
            this.draggingMove = true;
            this.startWorld = p;
            return;
        }

        this.selected = null;
        bus.emit("entity:deselected");
    }

    _hit(wx, wy) {
        for (const e of this.world.entities) {
            if (!e.visible) continue;
            const b = this.getBounding(e);

            if (wx >= b.x && wx <= b.x + b.w &&
                wy >= b.y && wy <= b.y + b.h)
                return e;
        }
        return null;
    }

    _move(px, py) {
        const e = this.selected;
        if (!e) return;

        const n = this._world(px, py);
        const dx = n.x - this.startWorld.x;
        const dy = n.y - this.startWorld.y;

        e.x += dx;
        e.y += dy;

        if (e.components?.TextRenderer) {
            const t = e.components.TextRenderer;
            const font = this.world.assets.fonts.default;
            const m = font.measureText(t.text, t.size);
            e.hitX = e.x + m.xMin;
            e.hitY = e.y + m.yMin;
            e.hitWidth = m.boundsWidth;
            e.hitHeight = m.boundsHeight;
        }

        this.startWorld = n;
        this._computeHandles();
    }

    _computeHandles() {
        if (!this.selected) return;

        const b = this.getBounding(this.selected);

        this.handles = [
            { type: "nw", x: b.x,      y: b.y      },
            { type: "ne", x: b.x+b.w,  y: b.y      },
            { type: "sw", x: b.x,      y: b.y+b.h  },
            { type: "se", x: b.x+b.w,  y: b.y+b.h  }
        ];
    }

    _hoverHandle(px, py) {
        const p = this._world(px, py);
        const r = 6 / this.game.camera.scale;

        this.hoverHandle = null;

        for (const h of this.handles) {
            const dx = p.x - h.x;
            const dy = p.y - h.y;
            if (dx*dx + dy*dy <= r*r * 4) {
                this.hoverHandle = h;
                return;
            }
        }
    }

    _cursor(type) {
        return {
            nw: "nwse-resize",
            ne: "nesw-resize",
            sw: "nesw-resize",
            se: "nwse-resize"
        }[type];
    }

    _resize(px, py) {
        const e = this.selected;
        if (!e) return;

        const now = this._world(px, py);
        const dx = now.x - this.startWorld.x;
        const dy = now.y - this.startWorld.y;

        if (e.components?.TextRenderer) {
            const startW = this.entStart.w;
            const startH = this.entStart.h;

            let newW = startW;
            let newH = startH;

            if (this.resizeType === "nw") { newW -= dx; newH -= dy; }
            if (this.resizeType === "ne") { newW += dx; newH -= dy; }
            if (this.resizeType === "sw") { newW -= dx; newH += dy; }
            if (this.resizeType === "se") { newW += dx; newH += dy; }

            newW = Math.max(5, newW);
            newH = Math.max(5, newH);

            const scaleW = newW / startW;
            const scaleH = newH / startH;
            const scale = Math.max(scaleW, scaleH);

            e._resizeFactor = scale;
            ApplyResizeToEntity(e, this.world);

            this._computeHandles();
            return;
        }

        let x = this.entStart.x;
        let y = this.entStart.y;
        let w = this.entStart.w;
        let h = this.entStart.h;

        if (this.resizeType === "nw") { x += dx; y += dy; w -= dx; h -= dy; }
        if (this.resizeType === "ne") { y += dy; w += dx; h -= dy; }
        if (this.resizeType === "sw") { x += dx; w -= dx; h += dy; }
        if (this.resizeType === "se") { w += dx; h += dy; }

        e.x = x;
        e.y = y;
        e.width = w;
        e.height = h;

        ApplyResizeToEntity(e, this.world);

        this.startWorld = now;

        const bb = this.getBounding(e);
        this.entStart = { x: bb.x, y: bb.y, w: bb.w, h: bb.h };

        this._computeHandles();
    }

    _drawWorld(shape, proj) {
        const cam = this.game.camera;

        if (this.selected) {
            this._computeHandles();
            const b = this.getBounding(this.selected);
            const t = 2 / cam.scale;

            shape.drawLine(b.x,      b.y,      b.x+b.w, b.y,      [1,0.84,0,1], t, proj);
            shape.drawLine(b.x+b.w,  b.y,      b.x+b.w, b.y+b.h,  [1,0.84,0,1], t, proj);
            shape.drawLine(b.x+b.w,  b.y+b.h,  b.x,     b.y+b.h,  [1,0.84,0,1], t, proj);
            shape.drawLine(b.x,      b.y+b.h,  b.x,     b.y,      [1,0.84,0,1], t, proj);

            const r = 6 / cam.scale;

            for (const h of this.handles) {
                shape.drawCircle(h.x, h.y, r, [1,1,1,1], 24, proj);
                shape.drawCircleOutline(h.x, h.y, r, [0,0,0,1], t, 32, proj);
            }
        }

        if (this.hovered && this.hovered !== this.selected) {
            const b = this.getBounding(this.hovered);
            const t = 1.5 / cam.scale;

            shape.drawLine(b.x,      b.y,      b.x+b.w, b.y,      [0,1,0,0.6], t, proj);
            shape.drawLine(b.x+b.w,  b.y,      b.x+b.w, b.y+b.h,  [0,1,0,0.6], t, proj);
            shape.drawLine(b.x+b.w,  b.y+b.h,  b.x,     b.y+b.h,  [0,1,0,0.6], t, proj);
            shape.drawLine(b.x,      b.y+b.h,  b.x,     b.y,      [0,1,0,0.6], t, proj);
        }
    }
}
