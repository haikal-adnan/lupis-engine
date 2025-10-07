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
    this.prevX = this.x;
    this.prevY = this.y;
    const { x: dx, y: dy, dir } = input.getDirection();
    if (dir) this.direction = dir;
    this.x += dx * this.speed * dt;
    this.y += dy * this.speed * dt;
  }

  render(glRenderer, projection, alpha = 1) {
    const rx = this.prevX + (this.x - this.prevX) * alpha;
    const ry = this.prevY + (this.y - this.prevY) * alpha;
    this.image.drawImage(rx, ry, this.width, this.height, projection);
  }

  getLayer() {
    return this.layer;
  }
}
