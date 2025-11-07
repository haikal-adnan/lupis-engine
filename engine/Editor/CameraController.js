import Config from "../Config/Config.js";
import { bus } from "../Core/EventBus.js";

/**
 * CameraController (Editor Mode) — TouchHandler-accurate
 * ------------------------------------------------------
 * - Pan: Space + drag kiri, atau klik tengah.
 * - Zoom: Scroll (pivot ke posisi mouse), presisi di semua scale.
 * - Shift + Scroll = pan vertikal, Alt + Scroll = pan horizontal.
 * - Seluruh mapping pointer -> canvas pixels meniru TouchHandler.
 */
export default class CameraController {
  constructor(camera, glCanvas) {
    this.camera = camera;
    this.canvas = glCanvas;
    this.active = Config.ENGINE_MODE === "editor";

    this.isDragging = false;
    this.spaceKeyHeld = false;

    // simpan posisi terakhir DALAM CANVAS PIXELS (bukan clientX/Y)
    this.lastPx = 0;
    this.lastPy = 0;

    this.scale = 1.0;
    this.minZoom = 0.25;
    this.maxZoom = 99999.0;
    this.zoomSpeed = 0.1;

    if (this.active) {
      this._bindEvents();
      console.log("🎥 CameraController aktif (TouchHandler-accurate)");
    }
  }

  _bindEvents() {
    this._onKeyDown  = this._onKeyDown.bind(this);
    this._onKeyUp    = this._onKeyUp.bind(this);
    this._onMouseDown= this._onMouseDown.bind(this);
    this._onMouseMove= this._onMouseMove.bind(this);
    this._onMouseUp  = this._onMouseUp.bind(this);
    this._onWheel    = this._onWheel.bind(this);

    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
    this.canvas.addEventListener("mousedown", this._onMouseDown);
    window.addEventListener("mousemove", this._onMouseMove);
    window.addEventListener("mouseup", this._onMouseUp);
    this.canvas.addEventListener("wheel", this._onWheel, { passive: false });
  }

  // === Utility: map client pointer -> canvas pixels (persis TouchHandler) ===
  _mapEventToCanvasPixels(e) {
    // ambil canvas by id persis seperti TouchHandler (opsional, tapi aman)
    const canvas = this.canvas || document.getElementById("glCanvas");
    const rect = canvas.getBoundingClientRect();

    // start dari local posisi relatif canvas (CSS space)
    let px = (e.clientX ?? e.x) - rect.left;
    let py = (e.clientY ?? e.y) - rect.top;

    // rumus aspect/letterbox persis TouchHandler
    const cAspect = canvas.width / canvas.height;
    const sAspect = window.innerWidth / window.innerHeight;

    let offsetX = 0, offsetY = 0, scaleX = 1, scaleY = 1;

    if (sAspect > cAspect) {
      // pillarbox kiri/kanan
      const actualW = window.innerHeight * cAspect;
      offsetX = (window.innerWidth - actualW) / 2;
      scaleX = canvas.width / actualW;
      scaleY = canvas.height / window.innerHeight;

      // konversi px/py ke window-based lalu koreksi offset
      px = (e.clientX - offsetX);
      py = (e.clientY - 0);
    } else {
      // letterbox atas/bawah
      const actualH = window.innerWidth / cAspect;
      offsetY = (window.innerHeight - actualH) / 2;
      scaleX = canvas.width / window.innerWidth;
      scaleY = canvas.height / actualH;

      px = (e.clientX - 0);
      py = (e.clientY - offsetY);
    }

    // skala ke canvas pixels dan clamp
    px = Math.max(0, Math.min(canvas.width,  px * scaleX));
    py = Math.max(0, Math.min(canvas.height, py * scaleY));

    return { px, py };
  }

  // === Keyboard ===
  _onKeyDown(e) {
    if (e.code === "Space") {
      this.spaceKeyHeld = true;
      this.canvas.style.cursor = "grab";
    }
  }

  _onKeyUp(e) {
    if (e.code === "Space") {
      this.spaceKeyHeld = false;
      this.isDragging = false;
      this.canvas.style.cursor = "default";
    }
  }

  // === Mouse ===
  _onMouseDown(e) {
    const canPan = e.button === 1 || (e.button === 0 && this.spaceKeyHeld);
    if (canPan) {
      e.preventDefault();
      this.isDragging = true;

      // simpan posisi awal dalam canvas pixels (TouchHandler mapping)
      const { px, py } = this._mapEventToCanvasPixels(e);
      this.lastPx = px;
      this.lastPy = py;

      this.canvas.style.cursor = "grabbing";
    }
  }

  _onMouseMove(e) {
    if (!this.isDragging) return;

    const { px, py } = this._mapEventToCanvasPixels(e);
    const dx = px - this.lastPx;
    const dy = py - this.lastPy;

    this.lastPx = px;
    this.lastPy = py;

    // pan berbasis delta di canvas pixels
    this.camera.x -= dx / this.scale;
    this.camera.y -= dy / this.scale;

    bus.emit("camera:pan", { x: this.camera.x, y: this.camera.y });
  }

  _onMouseUp() {
    this.isDragging = false;
    this.canvas.style.cursor = this.spaceKeyHeld ? "grab" : "default";
  }

  _onWheel(e) {
    e.preventDefault();

    const isShift = e.shiftKey;
    const isAlt   = e.altKey;

    // pivot (mx,my) dalam canvas pixels (TouchHandler mapping)
    const { px: mx, py: my } = this._mapEventToCanvasPixels(e);

    if (isShift) {
      // pan vertikal konsisten di world units
      this.camera.y += (e.deltaY * 0.5) / this.scale;
      bus.emit("camera:pan", { x: this.camera.x, y: this.camera.y });
      return;
    }

    if (isAlt) {
      // pan horizontal
      this.camera.x += (e.deltaY * 0.5) / this.scale;
      bus.emit("camera:pan", { x: this.camera.x, y: this.camera.y });
      return;
    }

    // === Default: Zoom (pivot-aware) ===
    const oldScale = this.scale;
    const delta = e.deltaY < 0 ? 1 + this.zoomSpeed : 1 - this.zoomSpeed;
    this.scale = Math.min(this.maxZoom, Math.max(this.minZoom, this.scale * delta));

    // world point di bawah mouse sebelum zoom
    const cx = this.camera.x + mx / oldScale;
    const cy = this.camera.y + my / oldScale;

    // geser kamera agar pivot tetap sama setelah zoom
    this.camera.x = cx - mx / this.scale;
    this.camera.y = cy - my / this.scale;
    this.camera.scale = this.scale;

    bus.emit("camera:zoom", { scale: this.scale });
  }

  destroy() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
    this.canvas.removeEventListener("mousedown", this._onMouseDown);
    window.removeEventListener("mousemove", this._onMouseMove);
    window.removeEventListener("mouseup", this._onMouseUp);
    this.canvas.removeEventListener("wheel", this._onWheel);
  }
}
