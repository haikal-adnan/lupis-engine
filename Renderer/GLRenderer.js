import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";
import Config from "../Config/Config.js";

export default class GLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
      // desynchronized kadang menimbulkan tearing/flicker di beberapa GPU.
      // Jika masih ada jitter, set ke false (default di sini).
      desynchronized: false,
      preserveDrawingBuffer: false,
    });
    if (!this.gl) throw new Error("WebGL tidak didukung.");

    const gl = this.gl;
    this.backgroundColor = [0, 0, 0, 1];

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.DITHER); // kecilkan noise/diff

    this._projection = { isProjection: true, matrix: mat4.create() };
    this._lastW = 0;
    this._lastH = 0;

    // Debug context lost
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      console.warn("[WebGL] context lost");
    });
    canvas.addEventListener("webglcontextrestored", () => {
      console.warn("[WebGL] context restored — reinit resources if needed");
      this.resize();
    });

    this.resize();
  }

  setBackgroundColor(r, g, b, a = 1) {
    this.backgroundColor = [r, g, b, a];
  }

  resize() {
    const { width, height } = this.canvas; // kamu pakai virtual size → biarkan
    const gl = this.gl;
    gl.viewport(0, 0, width, height);

    if (this._lastW !== width || this._lastH !== height) {
      this._lastW = width; this._lastH = height;
      mat4.ortho(this._projection.matrix, 0, width, height, 0, -1, 1);
    }
  }

  clear() {
    const gl = this.gl;
    const [r, g, b, a] = this.backgroundColor;
    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  // Offset kamera (world) → proyeksi layar (pixel-snapped bila pixel-art)
  getWorldProjection(offsetX = 0, offsetY = 0) {
    const gl = this.gl;
    const w = gl.canvas.width, h = gl.canvas.height;

    // Pixel snap untuk menghindari sub-pixel seams
    const snap = (Config?.PIXEL_ART ?? false) || (Config?.CAMERA?.PIXEL_LOCK ?? false);
    if (snap) {
      offsetX = Math.round(offsetX);
      offsetY = Math.round(offsetY);
    }

    const proj = mat4.create();
    const left = Math.max(0, offsetX), top = Math.max(0, offsetY);
    mat4.ortho(proj, left, left + w, top + h, top, -1, 1);
    return { isProjection: true, matrix: proj };
  }

  getScreenProjection() {
    return this._projection;
  }
}
