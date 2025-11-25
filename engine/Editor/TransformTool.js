import Config from "../Core/Config.js";
import { ApplyResizeToEntity } from "../Util/ApplyResizeToEntity.js";

export default class TransformTool {
    constructor(selectionTool, world, game, canvas, renderer, input) {
        this.selection = selectionTool;
        this.selection.attachTransform(this);
        this.world = world;
        this.game = game;
        this.canvas = canvas;
        this.renderer = renderer;
        this.input = input;

        this.active = Config.EDITOR.TRANSFORM;

        this.draggingMove = false;
        this.draggingResize = false;
        this.resizeType = null;

        this.startWorld = { x: 0, y: 0 };
        this.entStart = null;

        this.handles = [];
        this.hoverHandle = null;

        this.uniformResize = false;
    }

    toWorld(px, py) {
        return this.selection.toWorld(px, py);
    }

    computeHandles() {
        const e = this.selection.selected;
        if (!e) return;

        const b = this.selection.getBounding(e);

        this.handles = [
            { type: "nw", x: b.x,      y: b.y      },
            { type: "ne", x: b.x+b.w,  y: b.y      },
            { type: "sw", x: b.x,      y: b.y+b.h  },
            { type: "se", x: b.x+b.w,  y: b.y+b.h  }
        ];
    }

    getHoverHandle(px, py) {
        const p = this.toWorld(px, py);
        const r = 6 / this.game.camera.scale;

        for (const h of this.handles) {
            const dx = p.x - h.x;
            const dy = p.y - h.y;
            if (dx*dx + dy*dy <= r*r * 4)
                return h;
        }
        return null;
    }

    getCursor(type) {
        return {
            nw: "nwse-resize",
            ne: "nesw-resize",
            sw: "nesw-resize",
            se: "nwse-resize"
        }[type];
    }

    beginMove(px, py) {
        const p = this.toWorld(px, py);
        this.draggingMove = true;
        this.draggingResize = false;
        this.startWorld = p;
    }

    beginResize(type, px, py) {
        const e = this.selection.selected;
        if (!e) return;

        const p = this.toWorld(px, py);

        this.resizeType = type;
        this.draggingResize = true;
        this.draggingMove = false;

        const b = this.selection.getBounding(e);
        this.entStart = { x: b.x, y: b.y, w: b.w, h: b.h };
        this.startWorld = p;

        if (e.components?.TextRenderer) {
            const t = e.components.TextRenderer;
            e._resizeStartSize = t.size;
            e._resizeFactor = 1;
        }
    }

    update() {
        if (!this.active) return;
        if (!this.selection.selected) return;

        const p = this.input.getPointer();
        const px = p.x, py = p.y;

        if (this.draggingMove) this.move(px, py);
        if (this.draggingResize) this.resize(px, py);

        if (!p.down) {
            this.draggingMove = false;
            this.draggingResize = false;
            this.resizeType = null;

            const e = this.selection.selected;
            if (e) {
                delete e._resizeStartSize;
                delete e._resizeFactor;
            }
        }
    }

    move(px, py) {
        const e = this.selection.selected;
        if (!e) return;

        const n = this.toWorld(px, py);
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
        this.computeHandles();
    }

    resize(px, py) {
        const e = this.selection.selected;
        if (!e) return;

        const now = this.toWorld(px, py);
        const dx = now.x - this.startWorld.x;
        const dy = now.y - this.startWorld.y;

        if (e.components?.TextRenderer) {
            const startW = this.entStart.w;
            const startH = this.entStart.h;

            let w = startW;
            let h = startH;

            if (this.resizeType === "nw") { w -= dx; h -= dy; }
            if (this.resizeType === "ne") { w += dx; h -= dy; }
            if (this.resizeType === "sw") { w -= dx; h += dy; }
            if (this.resizeType === "se") { w += dx; h += dy; }

            w = Math.max(5, w);
            h = Math.max(5, h);

            const scaleW = w / startW;
            const scaleH = h / startH;
            const scale = Math.max(scaleW, scaleH);

            e._resizeFactor = scale;
            ApplyResizeToEntity(e, this.world);

            this.computeHandles();
            return;
        }

        let x = this.entStart.x;
        let y = this.entStart.y;
        let w = this.entStart.w;
        let h = this.entStart.h;

        let newW = w;
        let newH = h;

        if (this.resizeType === "nw") { newW = w - dx; newH = h - dy; }
        if (this.resizeType === "ne") { newW = w + dx; newH = h - dy; }
        if (this.resizeType === "sw") { newW = w - dx; newH = h + dy; }
        if (this.resizeType === "se") { newW = w + dx; newH = h + dy; }

        if (this.uniformResize) {
            const scale = Math.max(newW / w, newH / h);
            newW = w * scale;
            newH = h * scale;
        }

        if (this.resizeType === "nw") {
            x = this.entStart.x + (w - newW);
            y = this.entStart.y + (h - newH);
        }
        if (this.resizeType === "ne") {
            x = this.entStart.x;
            y = this.entStart.y + (h - newH);
        }
        if (this.resizeType === "sw") {
            x = this.entStart.x + (w - newW);
            y = this.entStart.y;
        }
        if (this.resizeType === "se") {
            x = this.entStart.x;
            y = this.entStart.y;
        }

        e.x = x;
        e.y = y;
        e.width = newW;
        e.height = newH;


        ApplyResizeToEntity(e, this.world);

        this.startWorld = now;

        const bb = this.selection.getBounding(e);
        this.entStart = { x: bb.x, y: bb.y, w: bb.w, h: bb.h };

        this.computeHandles();
    }

    draw(shape, proj) {
        const e = this.selection.selected;
        if (!e) return;

        this.computeHandles();
        const b = this.selection.getBounding(e);
        const t = 2 / this.game.camera.scale;

        shape.drawLine(b.x,      b.y,      b.x+b.w, b.y,      [1,0.84,0,1], t, proj);
        shape.drawLine(b.x+b.w,  b.y,      b.x+b.w, b.y+b.h,  [1,0.84,0,1], t, proj);
        shape.drawLine(b.x+b.w,  b.y+b.h,  b.x,     b.y+b.h,  [1,0.84,0,1], t, proj);
        shape.drawLine(b.x,      b.y+b.h,  b.x,     b.y,      [1,0.84,0,1], t, proj);

        const r = 6 / this.game.camera.scale;

        for (const h of this.handles) {
            shape.drawCircle(h.x, h.y, r, [1,1,1,1], 24, proj);
            shape.drawCircleOutline(h.x, h.y, r, [0,0,0,1], t, 32, proj);
        }

        if (this.selection.hovered && this.selection.hovered !== e) {
            const bb = this.selection.getBounding(this.selection.hovered);
            const tt = 1.5 / this.game.camera.scale;

            shape.drawLine(bb.x,      bb.y,      bb.x+bb.w, bb.y,      [0,1,0,0.6], tt, proj);
            shape.drawLine(bb.x+bb.w, bb.y,      bb.x+bb.w, bb.y+bb.h, [0,1,0,0.6], tt, proj);
            shape.drawLine(bb.x+bb.w, bb.y+bb.h, bb.x,      bb.y+bb.h, [0,1,0,0.6], tt, proj);
            shape.drawLine(bb.x,      bb.y+bb.h, bb.x,      bb.y,      [0,1,0,0.6], tt, proj);
        }
    }
}
