// Melakukan integrasi posisi linear sederhana (Euler)
export class Integrator {
  integrate(body, dt) {
    body.x += body.vx * dt;
    body.y += body.vy * dt;
  }
}
