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
    if (!player) return;

    const viewW = gl?.canvas?.width ?? Config.VIRTUAL_WIDTH;
    const viewH = gl?.canvas?.height ?? Config.VIRTUAL_HEIGHT;
    const tilePx = Config.PX_TILE;

    const playerCenterX = player.x + player.width * 0.5;
    const playerCenterY = player.y + player.height * 0.5;

    // Target posisi kamera agar player selalu di tengah
    let targetX = clamp(playerCenterX - viewW * 0.5, 0, Math.max(0, levelW - viewW));
    let targetY = clamp(playerCenterY - viewH * 0.5, 0, Math.max(0, levelH - viewH));

    // Tambahan: jaga jarak bawah (agar player tidak terlalu ke tepi bawah)
    const pb = player.y + player.height;
    const bottomScreen = targetY + viewH;
    const tilesBelow = Math.floor((bottomScreen - pb) / tilePx);
    if (tilesBelow < this.minBottomTiles) {
      targetY = Math.min(
        targetY + (this.minBottomTiles - tilesBelow) * tilePx,
        Math.max(0, levelH - viewH)
      );
    }

    // Interpolasi posisi kamera (smooth follow)
    const k = this.lerp * dt;
    const nx = this.x + (targetX - this.x) * k;
    const ny = this.y + (targetY - this.y) * k;

    this.prevX = this.x;
    this.prevY = this.y;
    this.x = this.pixelLock ? Math.round(nx) : nx;
    this.y = this.pixelLock ? Math.round(ny) : ny;
  }

  /**
   * Ambil posisi kamera interpolasi untuk rendering
   * @param {number} alpha - Faktor interpolasi antar frame
   * @returns {{x: number, y: number}}
   */
  getInterpolated(alpha = 1) {
    if (this.pixelLock) {
      return { x: Math.round(this.x), y: Math.round(this.y) };
    }
    return {
      x: this.prevX + (this.x - this.prevX) * alpha,
      y: this.prevY + (this.y - this.prevY) * alpha
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
