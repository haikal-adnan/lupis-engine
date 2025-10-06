export default class Camera2D {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }
}
