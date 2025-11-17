// src/engine/Editor/SelectionOutline.js
import Config from "../Config/Config.js";
import { bus } from "../Core/EventBus.js";

export default class SelectionOutline {
  constructor(world, glCanvas, glRenderer) {
    this.world = world;
    this.canvas = glCanvas;
    this.glRenderer = glRenderer;
    this.active = Config.ENGINE_MODE === "editor";

    this.hovered = null;
    this.selected = null;

    if (this.active) {
      this._bindEvents();
      this._ensureOverlaySize();
      console.log("🟩 SelectionOutline aktif (DPR-precise)");
    }
  }

  _bindEvents() {
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onResize = this._onResize.bind(this);

    this.canvas.addEventListener("mousemove", this._onMouseMove);
    this.canvas.addEventListener("mousedown", this._onMouseDown);
    window.addEventListener("resize", this._onResize);

    bus.on("camera:zoom", () => this.redraw());
    bus.on("camera:pan", () => this.redraw());
  }

  _onResize() {
    this._ensureOverlaySize();
    this.redraw();
  }

  _ensureOverlaySize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // siapkan overlay 2D berukuran pixel yang sama dengan GL canvas
    if (!this._overlay) {
      const c = document.createElement("canvas");
      c.style.position = "absolute";
      c.style.inset = 0;
      c.style.pointerEvents = "none";
      // penting: ukuran CSS mengikuti canvas GL
      c.style.width  = this.canvas.style.width  || "100%";
      c.style.height = this.canvas.style.height || "100%";
      this.canvas.parentElement.appendChild(c);
      this._overlay = c;
      this.glRenderer.overlayCtx = c.getContext("2d");
    }

    if (this._overlay.width !== w || this._overlay.height !== h) {
      this._overlay.width = w;
      this._overlay.height = h;
    }
  }

  /** mouse → world (pakai canvas pixels, bukan CSS) */
  _pointerWorld(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = this.canvas.width  / rect.width;
    const sy = this.canvas.height / rect.height;

    const px = (e.clientX - rect.left) * sx;  // canvas pixels
    const py = (e.clientY - rect.top)  * sy;

    const { camera } = this.world;
    const scale = camera.scale || 1;

    return {
      x: camera.x + px / scale,
      y: camera.y + py / scale,
    };
  }

  _onMouseMove(e) {
    const { x, y } = this._pointerWorld(e);
    this.hovered = null;

    for (const ent of this.world.entities) {
      if (!ent.visible) continue;
      if (x >= ent.x && x <= ent.x + ent.width && y >= ent.y && y <= ent.y + ent.height) {
        this.hovered = ent;
        break;
      }
    }
    this.redraw();
  }

  _onMouseDown() {
    if (this.hovered) {
      this.selected = this.hovered;
      bus.emit("entity:selected", this.selected);
    } else {
      this.selected = null;
      bus.emit("entity:deselected");
    }
    this.redraw();
  }

  redraw() {
    this._ensureOverlaySize();
    const ctx = this.glRenderer.overlayCtx;
    if (!ctx) return;

    const { camera } = this.world;
    const scale = camera.scale || 1;

    ctx.clearRect(0, 0, this._overlay.width, this._overlay.height);

    const draw = (ent, color, lw) => {
      // world → screen (di canvas pixels)
      let sx = (ent.x - camera.x) * scale;
      let sy = (ent.y - camera.y) * scale;
      let sw = ent.width  * scale;
      let sh = ent.height * scale;

      // optional: pixel snap biar tajam di pixel-art mode
      const snap = (Config?.PIXEL_ART ?? false) || (Config?.CAMERA?.PIXEL_LOCK ?? false);
      if (snap) {
        sx = Math.round(sx) + 0.5; // 0.5 untuk align stroke 1px
        sy = Math.round(sy) + 0.5;
        sw = Math.round(sw);
        sh = Math.round(sh);
      }

      ctx.save();
      ctx.setLineDash([]);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.strokeRect(sx, sy, sw, sh);
      ctx.restore();
    };

    if (this.hovered && this.hovered !== this.selected) draw(this.hovered, "rgba(0,255,0,0.7)", 1.5);
    if (this.selected) draw(this.selected, "rgba(255,215,0,0.95)", 2);
  }

  destroy() {
    this.canvas.removeEventListener("mousemove", this._onMouseMove);
    this.canvas.removeEventListener("mousedown", this._onMouseDown);
    window.removeEventListener("resize", this._onResize);
    bus.off("camera:zoom");
    bus.off("camera:pan");
  }
}
