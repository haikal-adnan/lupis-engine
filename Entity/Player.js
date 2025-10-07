export default class Player {
  constructor(image, x, y, width, height, layer = "PLAYER") {
    this.image = image;
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.width = width;
    this.height = height;
    this.layer = layer;

    this.speed = 400;
    this.direction = "down";
  }

  update(dt, input) {
    // Simpan posisi sebelumnya
    this.prevX = this.x;
    this.prevY = this.y;

    const { x: dirX, y: dirY, dir } = input.getDirection();
    if (dir) this.direction = dir;

    this.x += dirX * this.speed * dt;
    this.y += dirY * this.speed * dt;
  }

  render(glRenderer, projection, alpha = 1) {
    // Interpolasi posisi agar halus
    const renderX = this.prevX + (this.x - this.prevX) * alpha;
    const renderY = this.prevY + (this.y - this.prevY) * alpha;

    this.image.drawImage(renderX, renderY, this.width, this.height, projection);
  }

  getLayer() {
    return this.layer;
  }
}
