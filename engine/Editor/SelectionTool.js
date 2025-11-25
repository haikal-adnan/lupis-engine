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
        this.selected = null;

        this.isPointerDown = false;

        world.selectionRenderer = (image, shape, text, proj) => {
            if (this.transform)
                this.transform.draw(shape, proj);

            this.drawHover(shape, proj);
        };

    }

    attachTransform(transformTool) {
        this.transform = transformTool;
    }

    toWorld(px, py) {
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
        if (ent.components?.TextRenderer)
            return { x: ent.hitX, y: ent.hitY, w: ent.hitWidth, h: ent.hitHeight };
        if (ent.shape?.type === "line")
            return { x: ent.hitX, y: ent.hitY, w: ent.hitWidth, h: ent.hitHeight };
        return { x: ent.x, y: ent.y, w: ent.width, h: ent.height };
    }

    update() {
        if (!this.active) return;

        if (this.input.touch.active && this.input.touch.touches.length !== 1) {
            this.isPointerDown = false;
            return;
        }

        const p = this.input.getPointer();
        const px = p.x, py = p.y;

        this.hover(px, py);

        if (p.down && !this.isPointerDown) {
            this.pointerDown(px, py);
            this.isPointerDown = true;
        }

        if (!p.down && this.isPointerDown) {
            this.isPointerDown = false;
        }
    }

    hover(px, py) {
        if (this.transform && (this.transform.draggingMove || this.transform.draggingResize))
            return;

        this.hoverHandle = null;

        if (this.transform && this.selected) {
            this.transform.computeHandles();
            this.hoverHandle = this.transform.getHoverHandle(px, py);
            if (this.hoverHandle) {
                this.canvas.style.cursor = this.transform.getCursor(this.hoverHandle.type);
                return;
            }
        }

        this.hoverEntity(px, py);
        this.canvas.style.cursor = this.hovered ? "move" : "default";
    }

    hoverEntity(px, py) {
        const p = this.toWorld(px, py);
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

    pointerDown(px, py) {
        if (this.hoverHandle && this.transform) {
            this.transform.beginResize(this.hoverHandle.type, px, py);
            return;
        }

        const w = this.toWorld(px, py);
        const e = this.hit(w.x, w.y);

        if (e) {
            this.selected = e;
            bus.emit("entity:selected", e);

            if (this.transform)
                this.transform.beginMove(px, py);

            return;
        }

        this.selected = null;
        bus.emit("entity:deselected");
    }

    hit(wx, wy) {
        for (const e of this.world.entities) {
            if (!e.visible) continue;
            const b = this.getBounding(e);
            if (wx >= b.x && wx <= b.x + b.w &&
                wy >= b.y && wy <= b.y + b.h)
                return e;
        }
        return null;
    }

    drawHover(shape, proj) {
        if (!this.hovered || this.selected) return;

        const b = this.getBounding(this.hovered);
        const t = 1.5 / this.game.camera.scale;

        shape.drawLine(b.x,      b.y,      b.x+b.w, b.y,      [0,1,0,0.6], t, proj);
        shape.drawLine(b.x+b.w,  b.y,      b.x+b.w, b.y+b.h,  [0,1,0,0.6], t, proj);
        shape.drawLine(b.x+b.w,  b.y+b.h,  b.x,     b.y+b.h,  [0,1,0,0.6], t, proj);
        shape.drawLine(b.x,      b.y+b.h,  b.x,     b.y,      [0,1,0,0.6], t, proj);
    }

}
