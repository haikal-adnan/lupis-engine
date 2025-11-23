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

        if (this.active) this._makeOverlay();
    }

    _makeOverlay() {
        const c = document.createElement("canvas");
        c.style.position = "absolute";
        c.style.inset = 0;
        c.style.pointerEvents = "none";
        this.canvas.parentElement.appendChild(c);

        this._overlay = c;
        this.ctx = c.getContext("2d");
        this._resizeOverlay();

        window.addEventListener("resize", () => this._resizeOverlay());
    }

    _resizeOverlay() {
        const dpr = window.devicePixelRatio || 1;
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;

        this._overlay.width = w * dpr;
        this._overlay.height = h * dpr;

        this._overlay.style.width = w + "px";
        this._overlay.style.height = h + "px";
    }

    _world(px, py) {
        const cam = this.game.camera;
        const s = cam.scale;
        const dpr = window.devicePixelRatio || 1;
        const W = this._overlay.width / dpr;
        const H = this._overlay.height / dpr;

        return {
            x: cam.x + (px - W * 0.5) / s,
            y: cam.y + (py - H * 0.5) / s
        };
    }

    // ================================
    // BOUNDING — FINAL TEXT FIX
    // ================================
    getBounding(ent) {
        // TEXT → gunakan hitbox yang sudah dihitung MSDF
        if (ent.components?.TextRenderer) {
            return {
                x: ent.hitX,
                y: ent.hitY,
                w: ent.hitWidth,
                h: ent.hitHeight
            };
        }

        // LINE
        if (ent.shape?.type === "line") {
            return {
                x: ent.hitX,
                y: ent.hitY,
                w: ent.hitWidth,
                h: ent.hitHeight
            };
        }

        // SPRITE / SHAPE
        return {
            x: ent.x,
            y: ent.y,
            w: ent.width,
            h: ent.height
        };
    }

    update() {
        if (!this.active) return;

        const m = this.input.mouse;
        const px = m.x, py = m.y;

        this._hover(px, py);

        if (m.isDown(0) && !this.isPointerDown) {
            this._down(px, py);
            this.isPointerDown = true;
        }

        if (!m.isDown(0) && this.isPointerDown) {
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
        if (this.draggingMove || this.draggingResize) {
            this._draw();
            return;
        }

        if (!this.selected) {
            this._hoverEntity(px, py);
            this._draw();
            return;
        }

        this._computeHandles();
        this._hoverHandle(px, py);

        if (this.hoverHandle) {
            this.canvas.style.cursor = this._cursor(this.hoverHandle.type);
            this._draw();
            return;
        }

        this._hoverEntity(px, py);
        this.canvas.style.cursor = this.hovered ? "move" : "default";
        this._draw();
    }

    _hoverEntity(px, py) {
        const p = this._world(px, py);
        this.hovered = null;

        for (const e of this.world.entities) {
            if (!e.visible) continue;

            const b = this.getBounding(e);

            if (
                p.x >= b.x && p.x <= b.x + b.w &&
                p.y >= b.y && p.y <= b.y + b.h
            ) {
                this.hovered = e;
                return;
            }
        }
    }

    _down(px, py) {
        const p = this._world(px, py);

        // ============ Resize Start ============
        if (this.hoverHandle) {
            this.draggingResize = true;
            this.resizeType = this.hoverHandle.type;

            const b = this.getBounding(this.selected);

            // TEXT: hanya simpan width/height
            if (this.selected.components?.TextRenderer) {
                this.entStart = {
                    w: b.w,
                    h: b.h
                };
            } else {
                // NORMAL ent
                this.entStart = { x: b.x, y: b.y, w: b.w, h: b.h };
            }

            this.startWorld = this._world(px, py);

            return;
        }

        // ============ Select ============
        const e = this._hit(p.x, p.y);

        if (e) {
            this.selected = e;
            bus.emit("entity:selected", e);

            this.draggingMove = true;
            this.startWorld = this._world(px, py);
            return;
        }

        this.selected = null;
        bus.emit("entity:deselected");
    }

    _hit(wx, wy) {
        for (const e of this.world.entities) {
            if (!e.visible) continue;

            const b = this.getBounding(e);

            if (
                wx >= b.x && wx <= b.x + b.w &&
                wy >= b.y && wy <= b.y + b.h
            ) return e;
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

        // TEXT: update hitbox
        if (e.components?.TextRenderer) {
            const t = e.components.TextRenderer;
            const font = this.world.assets.fonts.default;
            const m = font.measureText(t.text, t.size);

            e.hitX = e.x + m.xMin;
            e.hitY = e.y + m.yMin;
            e.hitWidth  = m.boundsWidth;
            e.hitHeight = m.boundsHeight;
        }

        this.startWorld = n;
        this._computeHandles();
        this._draw();
    }

    _computeHandles() {
        if (!this.selected) return;

        const b = this.getBounding(this.selected);
        const cam = this.game.camera;
        const s = cam.scale;

        const W = this._overlay.width;
        const H = this._overlay.height;

        const sx = (b.x - cam.x) * s + W * 0.5;
        const sy = (b.y - cam.y) * s + H * 0.5;
        const sw = b.w * s;
        const sh = b.h * s;

        this.handles = [
            { type: "nw", x: sx,      y: sy      },
            { type: "ne", x: sx+sw,   y: sy      },
            { type: "sw", x: sx,      y: sy+sh   },
            { type: "se", x: sx+sw,   y: sy+sh   }
        ];
    }

    _hoverHandle(px, py) {
        const dpr = window.devicePixelRatio || 1;
        const cx = px * dpr;
        const cy = py * dpr;

        const s = this.game.camera.scale;
        const R = 18 * s;

        this.hoverHandle = null;

        for (const h of this.handles) {
            const dx = cx - h.x;
            const dy = cy - h.y;

            if (dx*dx + dy*dy <= R*R) {
                this.hoverHandle = h;
                return;
            }
        }
    }

    _cursor(t) {
        return {
            nw: "nwse-resize",
            ne: "nesw-resize",
            sw: "nesw-resize",
            se: "nwse-resize"
        }[t];
    }

    // ==========================================
    //              FINAL TEXT RESIZE
    // ==========================================
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

            // menjaga minimal
            newW = Math.max(5, newW);
            newH = Math.max(5, newH);

            const scaleW = newW / startW;
            const scaleH = newH / startH;
            const scale  = Math.max(scaleW, scaleH);

            e._resizeFactor = scale;

            // apply text scaling
            ApplyResizeToEntity(e, this.world);

            const b = this.getBounding(e);
            this.entStart.w = b.w;
            this.entStart.h = b.h;

            this.startWorld = now;

            this._computeHandles();
            this._draw();
            return;
        }

        let x = this.entStart.x;
        let y = this.entStart.y;
        let w = this.entStart.w;
        let h = this.entStart.h;

        if (this.resizeType === "nw") { x+=dx; y+=dy; w-=dx; h-=dy; }
        if (this.resizeType === "ne") { y+=dy; w+=dx; h-=dy; }
        if (this.resizeType === "sw") { x+=dx; w-=dx; h+=dy; }
        if (this.resizeType === "se") { w+=dx; h+=dy; }

        e.x = x;
        e.y = y;
        e.width  = w;
        e.height = h;

        ApplyResizeToEntity(e, this.world);

        const bb = this.getBounding(e);
        this.entStart = { x: bb.x, y: bb.y, w: bb.w, h: bb.h };

        this.startWorld = now;
        this._computeHandles();
        this._draw();
    }

    _draw() {
        const ctx = this.ctx;
        const W = this._overlay.width;
        const H = this._overlay.height;

        ctx.clearRect(0, 0, W, H);

        if (!this.selected && !this.hovered) return;

        const cam = this.game.camera;
        const s = cam.scale;

        const drawBox = (ent, col, lw) => {
            const b = this.getBounding(ent);
            const x = (b.x - cam.x) * s + W * 0.5;
            const y = (b.y - cam.y) * s + H * 0.5;

            ctx.lineWidth = lw * s;
            ctx.strokeStyle = col;
            ctx.strokeRect(x, y, b.w * s, b.h * s);
        };

        if (this.selected) {
            drawBox(this.selected, "rgba(255,215,0,1)", 2);

            const r = 6 * s;
            ctx.fillStyle = "#fff";
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 2;

            for (const h of this.handles) {
                ctx.beginPath();
                ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }

        if (this.hovered && this.hovered !== this.selected) {
            drawBox(this.hovered, "rgba(0,255,0,0.6)", 1.5);
        }
    }
}
