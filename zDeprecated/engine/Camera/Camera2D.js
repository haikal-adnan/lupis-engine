export default class Camera2D {
  constructor(x = 0, y = 0) {
    this.x = x || 0;
    this.y = y || 0;
  }

  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }
}
