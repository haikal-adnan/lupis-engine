import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";

export default class GLRenderer {
  constructor(canvas) {
    this.canvas = canvas;

    // aktifkan alpha agar transparansi PNG bisa tampil
    this.gl = canvas.getContext("webgl", { alpha: true });
    if (!this.gl) throw new Error("WebGL tidak didukung.");

    const gl = this.gl;

    // warna latar belakang default: hitam
    this.backgroundColor = [0, 0, 0, 1];

    // ✅ aktifkan transparansi blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // nonaktifkan depth test (karena 2D)
    gl.disable(gl.DEPTH_TEST);

    this.resize();
  }

  setBackgroundColor(r, g, b, a = 1) {
    this.backgroundColor = [r, g, b, a];
  }

  resize() {
    const { width, height } = this.canvas;
    this.gl.viewport(0, 0, width, height);
  }

  clear() {
    const gl = this.gl;
    const [r, g, b, a] = this.backgroundColor;
    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  getWorldProjection(offsetX = 0, offsetY = 0) {
    const { gl } = this;
    const w = gl.canvas.width;
    const h = gl.canvas.height;
    const proj = mat4.create();

    // batas minimal dan maksimal proyeksi
    const left = Math.max(0, offsetX);
    const top = Math.max(0, offsetY);
    mat4.ortho(proj, left, left + w, top + h, top, -1, 1);

    return { isProjection: true, matrix: proj };
  }

  
}
