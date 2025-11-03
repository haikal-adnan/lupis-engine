import GLImage from "@engine/Renderer/GLImage.js";

export default class Polygon {
  constructor(glContext) {
    this.glContext = glContext;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
  }

  async createRect(width, height, color = "#FFFFFF") {
    this.canvas.width = width;
    this.canvas.height = height;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);

    const bmp = await createImageBitmap(this.canvas);

    // 🚀 Langsung ubah jadi GLImage
    const img = new GLImage(this.glContext);
    await img.loadFromBitmap(bmp);
    return img; // langsung GLImage
  }

  async createCircle(radius, color = "#FFFFFF", outline = null, lineWidth = 2) {
    const size = radius * 2;
    this.canvas.width = size;
    this.canvas.height = size;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(radius, radius, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    if (outline) {
      ctx.strokeStyle = outline;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }

    const bmp = await createImageBitmap(this.canvas);

    // 🚀 Langsung ubah jadi GLImage
    const img = new GLImage(this.glContext);
    await img.loadFromBitmap(bmp);
    return img;
  }
}
