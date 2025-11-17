import { bus } from "../Core/EventBus.js";
import Config from "../Config/Config.js";

/**
 * 🎚️ Rulers (Editor Overlay)
 * ---------------------------
 * - Mirip Figma: garis pendek, angka rapat, pusat (0,0) di tengah canvas.
 * - Atas: angka di atas garis tengah.
 * - Kiri: angka di kanan garis tengah (geser sedikit ke kanan agar tidak menempel tepi).
 * - Tambahan margin agar angka tidak terpotong di tepi layar.
 */
export default class Rulers {
  constructor(glRenderer, camera) {
    this.glRenderer = glRenderer;
    this.gl = glRenderer.gl;
    this.camera = camera;
    this.canvas = glRenderer.canvas;

    this.active = Config.ENGINE_MODE === "editor";
    this.scale = camera.scale ?? 1;
    this.offsetX = camera.x;
    this.offsetY = camera.y;

    // Gaya tampilan
    this.rulerThickness = 20;
    this.tickLength = 6; // panjang garis kecil
    this.margin = 4; // jarak aman tepi angka
    this.font = "10px monospace";
    this.color = "rgba(255,255,255,0.8)";
    this.bgColor = "rgba(0,0,0,0.45)";
    this.lineColor = "rgba(255,255,255,0.25)";
    this.originColor = "rgba(255,80,80,0.9)";

    if (this.active) {
      this._createOverlay();
      this._bindCameraEvents();
      this.render();
    }
  }

  _createOverlay() {
    this.overlay = document.createElement("canvas");
    this.overlay.width = this.canvas.width;
    this.overlay.height = this.canvas.height;
    Object.assign(this.overlay.style, {
      position: "absolute",
      left: "0",
      top: "0",
      pointerEvents: "none",
      zIndex: "10",
    });
    this.canvas.parentElement.appendChild(this.overlay);
    this.ctx = this.overlay.getContext("2d");
  }

  _bindCameraEvents() {
    bus.on("camera:zoom", ({ scale }) => {
      this.scale = scale;
      this.render();
    });
    bus.on("camera:pan", ({ x, y }) => {
      this.offsetX = x;
      this.offsetY = y;
      this.render();
    });
  }

  _getInterval(scale) {
    const base = 50;
    const steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
    const est = base / scale;
    let best = steps[0];
    for (let s of steps) if (Math.abs(s - est) < Math.abs(best - est)) best = s;
    return best;
  }

  render() {
    const ctx = this.ctx;
    const w = (this.overlay.width = this.canvas.width);
    const h = (this.overlay.height = this.canvas.height);
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, w, this.rulerThickness);
    ctx.fillRect(0, 0, this.rulerThickness, h);

    const scale = this.scale;
    const interval = this._getInterval(scale);

    ctx.font = this.font;
    ctx.fillStyle = this.color;

    // --- Rentang dunia yang terlihat ---
    const worldStartX = this.offsetX - w / (2 * scale);
    const worldEndX = this.offsetX + w / (2 * scale);
    const worldStartY = this.offsetY - h / (2 * scale);
    const worldEndY = this.offsetY + h / (2 * scale);

    // === Horizontal Ruler (atas) ===
    const startX = Math.floor(worldStartX / interval) * interval;
    const endX = Math.ceil(worldEndX / interval) * interval;

    for (let x = startX; x <= endX; x += interval) {
      const screenX = (x - this.offsetX) * scale + w / 2;

      // garis pendek di bawah angka
      ctx.strokeStyle = this.lineColor;
      ctx.beginPath();
      ctx.moveTo(screenX, this.rulerThickness - this.tickLength);
      ctx.lineTo(screenX, this.rulerThickness);
      ctx.stroke();

      // hitung lebar teks agar angka center di garis
      const label = x.toString();
      const textWidth = ctx.measureText(label).width;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      const textX = screenX - textWidth / 2;
      const textY = 2;
      if (textX + textWidth > this.margin && textX < w - this.margin) {
        ctx.fillText(label, textX, textY);
      }
    }

    // === Vertical Ruler (kiri) ===
    const startY = Math.floor(worldStartY / interval) * interval;
    const endY = Math.ceil(worldEndY / interval) * interval;

    for (let y = startY; y <= endY; y += interval) {
      const screenY = (y - this.offsetY) * scale + h / 2;

      // geser garis sedikit ke kanan agar sejajar dengan teks
      const lineOffset = 0; // 👉 geser garis +2px ke kanan
      ctx.strokeStyle = this.lineColor;
      ctx.beginPath();
      ctx.moveTo(this.rulerThickness - this.tickLength + lineOffset, screenY);
      ctx.lineTo(this.rulerThickness + lineOffset, screenY);
      ctx.stroke();

      // teks di kanan garis (geser ke kanan juga agar pas)
      const label = y.toString();
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      const textOffset = 0; // 👉 negatif = geser ke kanan (karena textAlign=right)
      const textX =
        this.rulerThickness - this.tickLength + lineOffset + textOffset;
      const textY = screenY;

      if (textY > this.margin && textY < h - this.margin) {
        ctx.fillText(label, textX, textY);
      }
    }

    // === Sumbu tengah (0,0) ===
    const originX = (0 - this.offsetX) * scale + w / 2;
    const originY = (0 - this.offsetY) * scale + h / 2;

    ctx.strokeStyle = this.originColor;
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, this.rulerThickness);
    ctx.moveTo(0, originY);
    ctx.lineTo(this.rulerThickness, originY);
    ctx.stroke();

    // Kotak pojok kiri atas
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(0, 0, this.rulerThickness, this.rulerThickness);
  }

  resize() {
    this.render();
  }
}
