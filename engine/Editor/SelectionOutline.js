import Config from "../Config/Config.js";
import { bus } from "../Core/EventBus.js";

export default class SelectionOutline {
  constructor(world, game, glCanvas, glRenderer) {
    this.world = world;
    this.game = game;
    this.canvas = glCanvas;
    this.glRenderer = glRenderer;

    this.active = Config.ENGINE_MODE === "editor";
    this.hovered = null;
    this.selected = null;

    if (this.active) {
      this._bindEvents();
      this._ensureOverlaySize();
      console.log("🟩 SelectionOutline aktif");
    }
  }

  // ============================================================
  // EVENT BINDING
  // ============================================================
  _bindEvents() {
    this._onMouseMove = e => this._onMouseMoveImpl(e);
    this._onMouseDown = e => this._onMouseDownImpl(e);
    this._onResize    = () => this._resizeImpl();

    this.canvas.addEventListener("mousemove", this._onMouseMove);
    this.canvas.addEventListener("mousedown", this._onMouseDown);
    window.addEventListener("resize", this._onResize);

    bus.on("camera:zoom", () => this.redraw());
    bus.on("camera:pan", () => this.redraw());
  }

  _resizeImpl() {
    this._ensureOverlaySize();
    this.redraw();
  }

  // ============================================================
  // OVERLAY CANVAS
  // ============================================================
  _ensureOverlaySize() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    if (!this._overlay) {
      const c = document.createElement("canvas");
      c.style.position = "absolute";
      c.style.inset = 0;
      c.style.pointerEvents = "none";
      c.style.width  = this.canvas.style.width  || "100%";
      c.style.height = this.canvas.style.height || "100%";

      this.canvas.parentElement.appendChild(c);
      this._overlay = c;
      this.glRenderer.overlayCtx = c.getContext("2d");
    }

    if (this._overlay.width !== w || this._overlay.height !== h) {
      this._overlay.width  = w;
      this._overlay.height = h;
    }
  }

  // ============================================================
  // POINTER → WORLD
  // ============================================================
  _pointerWorld(e) {
    const rect = this.canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;

    const cam = this.game.camera;
    const scale = cam.scale;

    const cw = this.canvas.clientWidth;
    const ch = this.canvas.clientHeight;

    return {
      x: cam.x + (cssX - cw * 0.5) / scale,
      y: cam.y + (cssY - ch * 0.5) / scale
    };
  }

  // ============================================================
  // HOVER DETECTION
  // ============================================================
  _onMouseMoveImpl(e) {
    const { x, y } = this._pointerWorld(e);
    this.hovered = null;

    for (const ent of this.world.entities) {
      if (!ent.visible) continue;

      const isLine = ent.shape?.type === "line";

      const x0 = isLine ? ent.hitX : ent.x;
      const y0 = isLine ? ent.hitY : ent.y;

      const w = isLine ? ent.hitWidth  : ent.width;
      const h = isLine ? ent.hitHeight : ent.height;

      const inside =
        x >= x0 && x <= x0 + w &&
        y >= y0 && y <= y0 + h;

      if (inside) {
        this.hovered = ent;
        break;
      }
    }

    this.redraw();
  }

  // ============================================================
  // SELECTION
  // ============================================================
  _onMouseDownImpl() {
    if (this.hovered) {
      this.selected = this.hovered;
      bus.emit("entity:selected", this.selected);
    } else {
      this.selected = null;
      bus.emit("entity:deselected");
    }

    this.redraw();
  }

  // ============================================================
  // RENDER OUTLINE
  // ============================================================
  redraw() {
    this._ensureOverlaySize();

    const ctx = this.glRenderer.overlayCtx;
    if (!ctx) return;

    const cam = this.game.camera;
    const scale = cam.scale;

    const W = this._overlay.width;
    const H = this._overlay.height;

    ctx.clearRect(0, 0, W, H);

    const draw = (ent, color, lw) => {
      const isLine = ent.shape?.type === "line";

      const x0 = isLine ? ent.hitX : ent.x;
      const y0 = isLine ? ent.hitY : ent.y;

      const w = isLine ? ent.hitWidth  : ent.width;
      const h = isLine ? ent.hitHeight : ent.height;

      // convert world → screen
      let sx = (x0 - cam.x) * scale + W * 0.5;
      let sy = (y0 - cam.y) * scale + H * 0.5;
      let sw = w * scale;
      let sh = h * scale;

      // Optional pixel lock
      if (Config.PIXEL_ART || Config.CAMERA?.PIXEL_LOCK) {
        sx = Math.round(sx) + 0.5;
        sy = Math.round(sy) + 0.5;
        sw = Math.round(sw);
        sh = Math.round(sh);
      }

      // ============================================================
      // 🟧 DEBUG TEXT BOUNDING BOX (REALITY)
      // ============================================================
      if (ent.text) {
        console.log("🟧 TEXT REALITY (SelectionOutline)", {
          name: ent.name ?? ent.id,
          world: {
            x: x0,
            y: y0,
            width: w,
            height: h
          },
          screen: {
            x: sx,
            y: sy,
            width: sw,
            height: sh
          }
        });
      }
      // ============================================================

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.strokeRect(sx, sy, sw, sh);
      ctx.restore();
    };

    if (this.selected)
      draw(this.selected, "rgba(255,215,0,1)", 2);

    if (this.hovered)
      draw(this.hovered, "rgba(0,255,0,0.75)", 1.5);
  }
}
