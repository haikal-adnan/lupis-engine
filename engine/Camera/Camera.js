// src/engine/Camera/Camera.js
import Config from "../Config/Config.js";

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/**
 * Camera — kelas kamera 2D sederhana untuk sistem World baru.
 * Dapat dihubungkan ke Player agar otomatis mengikuti posisi pemain.
 */
export default class Camera {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.scale = 1.0; // default zoom level
    const C = Config.CAMERA ?? {};
    this.lerp = C.LERP ?? 0.1;               // kehalusan pergerakan kamera
    this.pixelLock = C.PIXEL_LOCK && Config.PIXEL_ART;
    this.minBottomTiles = C.MIN_BOTTOM_TILES ?? 0;
  }

  /**
   * Update posisi kamera agar mengikuti player.
   * @param {Player} player - Objek pemain yang dilacak
   * @param {number} dt - Delta time
   * @param {number} levelW - Lebar level (pixel)
   * @param {number} levelH - Tinggi level (pixel)
   * @param {WebGLRenderingContext} gl - Konteks WebGL dari renderer
   */
  updateFollow(player, dt, levelW, levelH, gl) {
    // 🔹 Jangan lakukan follow jika tidak ada player atau sedang di editor
    if (!player || Config.ENGINE_MODE === "editor") return;

    // Ambil ukuran viewport dari GL context atau fallback ke config
    const viewW = gl?.canvas?.width  ?? Config.VIRTUAL_WIDTH;
    const viewH = gl?.canvas?.height ?? Config.VIRTUAL_HEIGHT;

    // Hitung titik tengah kamera agar player selalu di tengah layar
    const halfViewW = viewW * 0.5;
    const halfViewH = viewH * 0.5;

    const playerCenterX = player.x + player.width  * 0.5;
    const playerCenterY = player.y + player.height * 0.5;

    // 🔹 Tentukan target posisi kamera (agar player di tengah)
    const maxX = Math.max(0, levelW - viewW);
    const maxY = Math.max(0, levelH - viewH);

    const targetX = clamp(playerCenterX - halfViewW, 0, maxX);
    const targetY = clamp(playerCenterY - halfViewH, 0, maxY);

    // 🔹 Lerp untuk smooth movement
    const k = this.lerp * dt;
    const nextX = this.x + (targetX - this.x) * k;
    const nextY = this.y + (targetY - this.y) * k;

    // 🔹 Simpan posisi sebelumnya untuk interpolasi render
    this.prevX = this.x;
    this.prevY = this.y;

    // 🔹 Terapkan posisi baru (pixelLock jika pixel-art)
    this.x = this.pixelLock ? Math.round(nextX) : nextX;
    this.y = this.pixelLock ? Math.round(nextY) : nextY;
  }


  /**
   * Ambil posisi kamera interpolasi untuk rendering
   * @param {number} alpha - Faktor interpolasi antar frame
   * @returns {{x: number, y: number}}
   */
  getInterpolated(alpha = 1) {
    const ix = this.prevX + (this.x - this.prevX) * alpha;
    const iy = this.prevY + (this.y - this.prevY) * alpha;
    return {
      x: this.pixelLock ? Math.round(ix) : ix,
      y: this.pixelLock ? Math.round(iy) : iy,
      scale: this.scale
    };
  }

  /**
   * Dapat digunakan untuk memaksa posisi kamera (mis. saat restart level)
   */
  set(x, y) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
  }
}
