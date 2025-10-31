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
    return await createImageBitmap(this.canvas);
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
    return await createImageBitmap(this.canvas);
  }

  createTexture(bitmap) {
    const gl = this.glContext;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return tex;
  }
}
