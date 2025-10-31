// Gaya gravitasi (vertikal ke bawah)
// Tidak akan diterapkan bila entity sedang grounded
export default class Gravity {
  constructor({ gy = 9.8 } = {}) {
    this.gy = gy; // satuan: pixel / s^2
  }

  apply(body, dt) {
    if (!body.useGravity || body.grounded) return;
    body.vy += this.gy * dt;
  }
}
