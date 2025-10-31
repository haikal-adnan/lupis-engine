// Memberikan gaya konstan ke arah tertentu (misalnya dorongan atau angin)
export class Force {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  apply(body, dt) {
    body.vx += this.x * dt;
    body.vy += this.y * dt;
  }
}
