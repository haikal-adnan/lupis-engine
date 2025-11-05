import Config from "../Config/Config.js";

export default class Grid {
  constructor(uiContext, tileSize = 48) {
    this.ctx = uiContext;
    this.tileSize = tileSize;
    this.width = Config.VIRTUAL_WIDTH;
    this.height = Config.VIRTUAL_HEIGHT;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= this.width; x += this.tileSize) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, this.height);
      ctx.stroke();
    }
    for (let y = 0; y <= this.height; y += this.tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(this.width, y + 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }
}
