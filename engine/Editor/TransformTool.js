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

        this.handles = [];
        this.startWorld = { x: 0, y: 0 };
        this.moveStartData = null;

        this.groupBounds = null;
        this.resizeStartBounds = null;
        this.resizeEntityStarts = null;
    }

    toWorld(px, py) {
        return this.selection.toWorld(px, py);
    }

    _updateTextBounds(e) {
        if (!e.components?.TextRenderer) return;

        const t = e.components.TextRenderer;
        const assetId = t.assetId || Config.FONT;
        const font = this.world.assets.fonts[assetId];

        if (font && font.measureText) {
            const currentFontSize = t.fontSize || t.size || 40;
            
            const m = font.measureText(t.text, currentFontSize);
            
            e.hitX = e.x + (m.xMin || 0);
            e.hitY = e.y + (m.yMin || 0);
            e.hitWidth = m.boundsWidth || m.width; 
            e.hitHeight = m.boundsHeight;

            e.width = e.hitWidth;
            e.height = e.hitHeight;

        } else {

        }
    }

    computeGroupBounds() {
        const list = this.selection.selectedList;
        if (!list.length) return null;

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const e of list) {
            const b = this.selection.getBounding(e);
            if (b.x < minX) minX = b.x;
            if (b.y < minY) minY = b.y;
            if (b.x + b.w > maxX) maxX = b.x + b.w;
            if (b.y + b.h > maxY) maxY = b.y + b.h;
        }

        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    computeHandles() {
        const list = this.selection.selectedList;
        if (!list.length) return;

        if (list.length === 1) {
            const e = list[0];
            const b = this.selection.getBounding(e);
            this.groupBounds = b;
            this.handles = [
                { type: "nw", x: b.x, y: b.y },
                { type: "ne", x: b.x + b.w, y: b.y },
                { type: "sw", x: b.x, y: b.y + b.h },
                { type: "se", x: b.x + b.w, y: b.y + b.h }
            ];
            return;
        }

        const b = this.computeGroupBounds();
        this.groupBounds = b;
        this.handles = [
            { type: "nw", x: b.x, y: b.y },
            { type: "ne", x: b.x + b.w, y: b.y },
            { type: "sw", x: b.x, y: b.y + b.h },
            { type: "se", x: b.x + b.w, y: b.y + b.h }
        ];
    }

    getHoverHandle(px, py) {
        const p = this.toWorld(px, py);
        const hitRadius = 20 / this.game.camera.scale;

        for (const h of this.handles) {
            const dx = p.x - h.x;
            const dy = p.y - h.y;
            if (dx * dx + dy * dy <= hitRadius * hitRadius)
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

    beginMove(px, py, isTouch) {
        const list = this.selection.selectedList;
        if (!list.length) return;

        if (this.selection.calculateViewportInsets) {
            this.selection.calculateViewportInsets();
        }

        const p = this.toWorld(px, py);

        this.draggingMove = true;
        this.draggingResize = false;

        this.startWorld = p;
        this.isTouch = isTouch;

        this.moveStartData = list.map(e => ({
            e,
            x: e.x,
            y: e.y,
            hitOffsetX: e.hitX - e.x,
            hitOffsetY: e.hitY - e.y
        }));
    }

    beginResize(type, px, py) {
        const list = this.selection.selectedList;
        if (!list.length) return;

        if (this.selection.calculateViewportInsets) {
            this.selection.calculateViewportInsets();
        }

        const p = this.toWorld(px, py);

        this.resizeType = type;
        this.draggingResize = true;
        this.draggingMove = false;

        this.computeHandles();
        const b = this.groupBounds;
        this.resizeStartBounds = { x: b.x, y: b.y, w: b.w, h: b.h };

        this.resizeEntityStarts = list.map(e => {
            const bb = this.selection.getBounding(e);
            
            let textSize = 40;
            
            if (e.text && e.text.size) {
                textSize = e.text.size;
            } else if (e.components?.TextRenderer) {
                textSize = e.components.TextRenderer.fontSize || e.components.TextRenderer.size || 40;
            }

            e._textStartData = e.components?.TextRenderer ? {
                w: e.width,
                h: e.height,
                hitXOffset: e.hitX - e.x,
                hitYOffset: e.hitY - e.y,
                hitW: e.hitWidth,
                hitH: e.hitHeight,
                size: textSize 
            } : null;

            return {
                e,
                x: e.x,
                y: e.y,
                w: e.width ?? bb.w, 
                h: e.height ?? bb.h
            };
        });

        this.startWorld = p;
    }

    resetDrag() {
        this.draggingMove = false;
        this.draggingResize = false;
        this.resizeType = null;
        this.computeHandles();

        if (this.selection.autoPanVel) {
            this.selection.autoPanVel.x = 0;
            this.selection.autoPanVel.y = 0;
        }
    }

    update() {
        if (!this.active) return;

        const list = this.selection.selectedList;
        if (!list.length) return;

        const p = this.input.getPointer();
        const px = p.x, py = p.y;

        if (this.draggingMove) this.move(px, py);
        if (this.draggingResize) this.resize(px, py);

        if (this.selection.updateAutoPan) {
            this.selection.updateAutoPan();
        }

        if (!p.down) {
            this.resetDrag();
        }
    }

    move(px, py) {
        if (!this.moveStartData) return;

        if (this.selection.applyPointerAutoPan) {
            this.selection.applyPointerAutoPan(px, py);
        }

        const n = this.toWorld(px, py);
        const dx = n.x - this.startWorld.x;
        const dy = n.y - this.startWorld.y;

        for (const item of this.moveStartData) {
            const e = item.e;
            e.x = item.x + dx;
            e.y = item.y + dy;

            if (e.components?.TextRenderer) {
                this._updateTextBounds(e);
            }
        }
    }

    resize(px, py) {
        const list = this.selection.selectedList;
        if (!list.length) return;

        if (this.selection.applyPointerAutoPan) {
            this.selection.applyPointerAutoPan(px, py);
        }

        const now = this.toWorld(px, py);
        const dx = now.x - this.startWorld.x;
        const dy = now.y - this.startWorld.y;

        const sb = this.resizeStartBounds;
        const type = this.resizeType;

        let originX = sb.x;
        let originY = sb.y;

        // Tentukan pivot
        if (type === "nw" || type === "sw") originX = sb.x + sb.w;
        if (type === "nw" || type === "ne") originY = sb.y + sb.h;

        let rawNewW = sb.w;
        let rawNewH = sb.h;

        if (type === "nw") { rawNewW = sb.w - dx; rawNewH = sb.h - dy; }
        if (type === "ne") { rawNewW = sb.w + dx; rawNewH = sb.h - dy; }
        if (type === "sw") { rawNewW = sb.w - dx; rawNewH = sb.h + dy; }
        if (type === "se") { rawNewW = sb.w + dx; rawNewH = sb.h + dy; }

        const scaleW = rawNewW / (sb.w || 0.001);
        const scaleH = rawNewH / (sb.h || 0.001);
        
        const scaleUniform = Math.max(Math.abs(scaleW), Math.abs(scaleH));

        for (const item of this.resizeEntityStarts) {
            const e = item.e;
            
            let nextX = originX + (item.x - originX) * scaleW;
            let nextY = originY + (item.y - originY) * scaleH;
            
            if (scaleW < 0) nextX += (item.w * scaleW); 
            if (scaleH < 0) nextY += (item.h * scaleH);

            e.x = nextX;
            e.y = nextY;

            if (e.components?.TextRenderer) {
                e._resizeFactor = scaleUniform;
            } else {
                let nextW = item.w * scaleW;
                let nextH = item.h * scaleH;
                if (nextW < 0) { nextX += nextW; nextW = Math.abs(nextW); }
                if (nextH < 0) { nextY += nextH; nextH = Math.abs(nextH); }
                
                e.x = nextX;
                e.y = nextY;
                e.width = Math.max(0.1, nextW);
                e.height = Math.max(0.1, nextH);
            }

            ApplyResizeToEntity(e, this.world);
        }
    }

    draw(shape, proj) {
        const list = this.selection.selectedList;
        if (!list.length) return;

        this.computeHandles();
        const b = this.groupBounds;
        const t = 2 / this.game.camera.scale;
        const c = this.selection.outlineColor;

        shape.drawLine(b.x, b.y, b.x + b.w, b.y, c, t, proj);
        shape.drawLine(b.x + b.w, b.y, b.x + b.w, b.y + b.h, c, t, proj);
        shape.drawLine(b.x + b.w, b.y + b.h, b.x, b.y + b.h, c, t, proj);
        shape.drawLine(b.x, b.y + b.h, b.x, b.y, c, t, proj);

        const r = 6 / this.game.camera.scale;

        for (const h of this.handles) {
            shape.drawCircle(h.x, h.y, r, [1, 1, 1, 1], 24, proj);
            shape.drawCircleOutline(h.x, h.y, r, [0, 0, 0, 1], t, 32, proj);
        }
    }
}