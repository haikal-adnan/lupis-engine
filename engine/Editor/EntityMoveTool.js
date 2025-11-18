import { bus } from "../Core/EventBus.js";
import Config from "../Config/Config.js";

export default class EntityMoveTool {
    constructor(world, game, canvas, selection) {
        this.world = world;
        this.game = game;
        this.canvas = canvas;
        this.selection = selection;

        this.dragging = false;
        this.startX = 0;
        this.startY = 0;
        this.entStartX = 0;
        this.entStartY = 0;

        if (Config.ENGINE_MODE === "editor") this._bind();
    }

    _bind() {
        this._onDown = e => this._pointerDown(e);
        this._onMove = e => this._pointerMove(e);
        this._onUp = () => this._pointerUp();

        this.canvas.addEventListener("mousedown", this._onDown);
        this.canvas.addEventListener("mousemove", this._onMove);
        window.addEventListener("mouseup", this._onUp);
    }

    _pointerWorld(e) {
        const r = this.canvas.getBoundingClientRect();
        const cam = this.game.camera;
        const s = cam.scale;
        return {
            x: cam.x + ((e.clientX - r.left) - this.canvas.clientWidth * .5) / s,
            y: cam.y + ((e.clientY - r.top) - this.canvas.clientHeight * .5) / s
        };
    }

    _pointerDown(e) {
        if (!this.selection.selectedAtPointerDown) return;
        const ent = this.selection.selected;
        this.dragging = true;

        const p = this._pointerWorld(e);
        this.startX = p.x;
        this.startY = p.y;
        this.entStartX = ent.x;
        this.entStartY = ent.y;

        if (ent.shape?.type === "line") {
            this.shStartX2 = ent.shape.x2;
            this.shStartY2 = ent.shape.y2;
        }

        bus.emit("entity:dragging", true);
    }

    _pointerMove(e) {
        if (!this.dragging) return;
        const ent = this.selection.selected;
        if (!ent) return;

        const p = this._pointerWorld(e);
        const dx = p.x - this.startX;
        const dy = p.y - this.startY;

        if (ent.shape?.type === "line") {
            const sh = ent.shape;
            ent.x = this.entStartX + dx;
            ent.y = this.entStartY + dy;
            sh.x2 = this.shStartX2 + dx;
            sh.y2 = this.shStartY2 + dy;

            if (ent.components?.Transform) {
                ent.components.Transform.x = ent.x;
                ent.components.Transform.y = ent.y;
            }

            this._updateLineHitbox(ent);

        } else {
            ent.x = this.entStartX + dx;
            ent.y = this.entStartY + dy;

            if (ent.components?.Transform) {
                ent.components.Transform.x = ent.x;
                ent.components.Transform.y = ent.y;
            }
        }

        bus.emit("entity:moved", { id: ent.id, x: ent.x, y: ent.y });
        this.selection.redraw();
    }

    _updateLineHitbox(ent) {
        const sh = ent.shape;
        const x1 = ent.x, y1 = ent.y, x2 = sh.x2, y2 = sh.y2;
        const t = sh.thickness ?? 1;

        if (Math.abs(y2 - y1) < 1e-4) {
            ent.hitX = Math.min(x1, x2);
            ent.hitY = y1 - t / 2;
            ent.hitWidth = Math.abs(x2 - x1);
            ent.hitHeight = t;
        } else if (Math.abs(x2 - x1) < 1e-4) {
            ent.hitX = x1 - t / 2;
            ent.hitY = Math.min(y1, y2);
            ent.hitWidth = t;
            ent.hitHeight = Math.abs(y2 - y1);
        } else {
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);
            const minY = Math.min(y1, y2);
            const maxY = Math.max(y1, y2);
            ent.hitX = minX - t / 2;
            ent.hitY = minY - t / 2;
            ent.hitWidth = (maxX - minX) + t;
            ent.hitHeight = (maxY - minY) + t;
        }
    }

    _pointerUp() {
        if (!this.dragging) return;
        this.dragging = false;
        const ent = this.selection.selected;

        bus.emit("entity:dragging", false);
        if (ent) bus.emit("entity:move-end", { id: ent.id, x: ent.x, y: ent.y });
    }
}
