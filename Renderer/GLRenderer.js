import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";

export default class GLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    // opaque WebGL agar clearColor terlihat
    this.gl = canvas.getContext("webgl", { alpha: false });

    if (!this.gl) throw new Error("WebGL tidak didukung.");

    // warna latar default: hitam
    this.backgroundColor = [0, 0, 0, 1];

    // blending (aktifkan kembali bila perlu)
    // this.gl.enable(this.gl.BLEND);
    // this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

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

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  getWorldProjection(width, height) {
    const proj = mat4.create();
    // koordinat 2D: (0,0) kiri-atas
    mat4.ortho(proj, 0, width, height, 0, -1, 1);
    return proj;
  }
}
