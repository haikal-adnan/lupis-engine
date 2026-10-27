// /Physics/Gravity.js
export default class Gravity {
  constructor({ gy = 2000 } = {}) {
    this.gy = gy; // px/s^2
  }
  apply(body, dt, mode) {
    if (!body.useGravity) return;
    if (mode !== "platformer") return; // default: tak pakai gravitasi di top-down
    if (body.grounded) return;         // jangan tambah ketika nempel tanah
    body.vy += this.gy * dt;
  }
}
