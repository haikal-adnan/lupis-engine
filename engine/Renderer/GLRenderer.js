// /Renderer/GLRenderer.js
import Mat4 from "../Util/Mat4.js";
import Config from "../Config/Config.js";

export default class GLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
      desynchronized: false,
      preserveDrawingBuffer: false,
    });

    if (!this.gl) throw new Error("WebGL tidak didukung.");

    const gl = this.gl;
    this.backgroundColor = [0, 0, 0, 1];

    // Konfigurasi dasar WebGL
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.DITHER);

    // Matriks proyeksi default (ortografik)
    this._projection = {
      isProjection: true,
      matrix: Mat4.create(),
    };
    this._lastW = 0;
    this._lastH = 0;

    // Deteksi context hilang
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      console.warn("[WebGL] Context hilang");
    });
    canvas.addEventListener("webglcontextrestored", () => {
      console.warn("[WebGL] Context kembali — muat ulang resource jika perlu");
      this.resize();
    });

    this.resize();
  }

  /** Ubah warna latar belakang renderer */
  setBackgroundColor(r, g, b, a = 1) {
    this.backgroundColor = [r, g, b, a];
  }

  /** Sesuaikan viewport & proyeksi dengan ukuran canvas */
  resize() {
    const { width, height } = this.canvas;
    const gl = this.gl;

    gl.viewport(0, 0, width, height);

    // Hanya update jika ukuran berubah
    if (this._lastW !== width || this._lastH !== height) {
      this._lastW = width;
      this._lastH = height;
      Mat4.ortho(this._projection.matrix, 0, width, height, 0, -1, 1);
    }
  }

  /** Bersihkan layar dengan warna background */
  clear() {
    const gl = this.gl;
    const [r, g, b, a] = this.backgroundColor;
    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  /**
   * Buat matriks proyeksi dunia berdasarkan offset kamera.
   * Jika PIXEL_ART aktif, posisi dibulatkan agar tidak blur (pixel-perfect).
   */
  getWorldProjection(offsetX = 0, offsetY = 0, scale = 1) {
    const gl = this.gl;
    const w = gl.canvas.width;
    const h = gl.canvas.height;

    // Pixel snap (menghindari blur)
    const snap = (Config?.PIXEL_ART ?? false) || (Config?.CAMERA?.PIXEL_LOCK ?? false);
    if (snap) {
      offsetX = Math.round(offsetX);
      offsetY = Math.round(offsetY);
    }

    // Terapkan zoom (scale)
    const viewW = w / scale;
    const viewH = h / scale;

    const proj = Mat4.create();
    // Offset = posisi kamera (x,y) di dunia, ukuran view diperkecil sesuai zoom
    Mat4.ortho(proj, offsetX, offsetX + viewW, offsetY + viewH, offsetY, -1, 1);

    return { isProjection: true, matrix: proj };
  }


  getScreenProjection() {
    return this._projection;
  }
}
