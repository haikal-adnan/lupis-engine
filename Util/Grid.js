import Config from "../Config/Config.js";

export default class Grid {
  constructor(uiContext, tileSize = 48) {
    this.ctx = uiContext;              // Context 2D dari UI Renderer
    this.tileSize = tileSize;          // Ukuran grid (px)
    this.width = Config.VIRTUAL_WIDTH; // Lebar area render
    this.height = Config.VIRTUAL_HEIGHT; // Tinggi area render
  }

  /** Update ukuran grid saat resolusi berubah */
  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  /** Gambar grid putih */
  draw() {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;

    // Garis vertikal
    for (let x = 0; x <= this.width; x += this.tileSize) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0); // +0.5 agar garis tajam di pixel grid
      ctx.lineTo(x + 0.5, this.height);
      ctx.stroke();
    }

    // Garis horizontal
    for (let y = 0; y <= this.height; y += this.tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(this.width, y + 0.5);
      ctx.stroke();
    }

    ctx.restore();
  }
}
