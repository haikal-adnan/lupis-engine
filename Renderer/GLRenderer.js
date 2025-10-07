// GLRenderer.js (sedikit dirapikan + opsi performa)
import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";

export default class GLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl", {
      alpha: false,                 // lebih murah kompositing kalau tidak butuh transparansi canvas
      antialias: false,             // hemat fill-rate
      powerPreference: "high-performance",
      desynchronized: true,         // hint latency rendah
      preserveDrawingBuffer: false,
    });
    if (!this.gl) throw new Error("WebGL tidak didukung.");

    const gl = this.gl;
    this.backgroundColor = [0, 0, 0, 1];

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);

    this._projection = { isProjection: true, matrix: mat4.create() };
    this._lastW = 0;
    this._lastH = 0;

    this.resize();
  }

  setBackgroundColor(r, g, b, a = 1) {
    this.backgroundColor = [r, g, b, a];
  }

  // Panggil saat canvas CSS size berubah
  resize() {
    const { width, height } = this.canvas;
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

  // Offset kamera (world) → proyeksi layar
  getWorldProjection(offsetX = 0, offsetY = 0) {
    const gl = this.gl;
    const w = gl.canvas.width, h = gl.canvas.height;
    const proj = mat4.create();
    const left = Math.max(0, offsetX), top = Math.max(0, offsetY);
    mat4.ortho(proj, left, left + w, top + h, top, -1, 1);
    return { isProjection: true, matrix: proj };
  }

  // Untuk 2D UI/layer default (tanpa kamera), hemat set uniform berulang
  getScreenProjection() {
    return this._projection;
  }
}