import Config from "../Core/Config.js";
import { bus } from "../Util/EventBus.js";

export default class SelectionOutline {
  constructor(world, game, canvas, renderer) {
    this.world = world;
    this.game = game;
    this.canvas = canvas;
    this.glRenderer = renderer;

    this.active = Config.ENGINE_MODE === "editor";
    this.hovered = null;
    this.selected = null;

    this.isPointerDown = false;
    this.selectedAtPointerDown = false;
    this.isDragging = false;

    if (this.active) {
      this._bindEvents();
      this._ensureOverlay();
    }

    bus.on("entity:dragging", f => this.isDragging = f);
  }

  _bindEvents() {
    this._onMove = e => this._onMouseMove(e);
    this._onDown = e => this._onMouseDown(e);
    this._onResize = () => this._ensureOverlay();

    this.canvas.addEventListener("mousemove", this._onMove);
    this.canvas.addEventListener("mousedown", this._onDown);
    window.addEventListener("resize", this._onResize);

    window.addEventListener("mouseup", () => {
      this.isPointerDown = false;
      this.selectedAtPointerDown = false;
    });
  }

  _ensureOverlay() {
    const w = this.canvas.width, h = this.canvas.height;
    if (!this._overlay) {
      const c = document.createElement("canvas");
      c.style.position = "absolute";
      c.style.inset = 0;
      c.style.pointerEvents = "none";
      this.canvas.parentElement.appendChild(c);
      this._overlay = c;
      this.glRenderer.overlayCtx = c.getContext("2d");
    }
    if (this._overlay.width !== w) this._overlay.width = w;
    if (this._overlay.height !== h) this._overlay.height = h;
    this.redraw();
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

  _onMouseMove(e) {
    if (this.isDragging) {
      this.hovered = null;
      return this.redraw();
    }

    const p = this._pointerWorld(e);
    this.hovered = null;

    for (const ent of this.world.entities) {
      if (!ent.visible) continue;
      const isLine = ent.shape?.type === "line";
      const x0 = isLine ? ent.hitX : ent.x;
      const y0 = isLine ? ent.hitY : ent.y;
      const w = isLine ? ent.hitWidth : ent.width;
      const h = isLine ? ent.hitHeight : ent.height;

      if (p.x >= x0 && p.x <= x0 + w && p.y >= y0 && p.y <= y0 + h) {
        if (this.selected && ent.id === this.selected.id) {
          this.hovered = null;
          return this.redraw();
        }
        this.hovered = ent;
        break;
      }
    }

    this.redraw();
  }

  _onMouseDown(e) {
    this.isPointerDown = true;
    const p = this._pointerWorld(e);
    let clicked = null;

    for (const ent of this.world.entities) {
      if (!ent.visible) continue;
      const isLine = ent.shape?.type === "line";
      const x0 = isLine ? ent.hitX : ent.x;
      const y0 = isLine ? ent.hitY : ent.y;
      const w = isLine ? ent.hitWidth : ent.width;
      const h = isLine ? ent.hitHeight : ent.height;

      if (p.x >= x0 && p.x <= x0 + w && p.y >= y0 && p.y <= y0 + h) {
        clicked = ent;
        break;
      }
    }

    if (clicked && this.selected && clicked.id === this.selected.id) {
      this.selectedAtPointerDown = true;
      bus.emit("entity:selected", this.selected);
      return this.redraw();
    }

    if (clicked) {
      this.selected = clicked;
      this.selectedAtPointerDown = true;
      bus.emit("entity:selected", clicked);
    } else {
      this.selected = null;
      this.selectedAtPointerDown = false;
      bus.emit("entity:deselected");
    }

    this.redraw();
  }

  redraw() {
    const ctx = this.glRenderer.overlayCtx;
    if (!ctx) return;

    const cam = this.game.camera;
    const s = cam.scale;
    const W = this._overlay.width, H = this._overlay.height;

    ctx.clearRect(0, 0, W, H);

    const draw = (ent, col, lw) => {
      const isLine = ent.shape?.type === "line";
      const x0 = isLine ? ent.hitX : ent.x;
      const y0 = isLine ? ent.hitY : ent.y;
      const w = isLine ? ent.hitWidth : ent.width;
      const h = isLine ? ent.hitHeight : ent.height;

      const sx = (x0 - cam.x) * s + W * .5;
      const sy = (y0 - cam.y) * s + H * .5;
      ctx.save();
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.strokeRect(sx, sy, w * s, h * s);
      ctx.restore();
    };

    if (this.selected) draw(this.selected, "rgba(255,215,0,1)", 2);
    if (this.hovered) draw(this.hovered, "rgba(0,255,0,0.75)", 1.5);
  }
}
