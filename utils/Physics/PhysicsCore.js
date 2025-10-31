import { Integrator } from "./Integrator.js";
import Config from "../../engine/Config/Config.js";

/**
 * PhysicsCore — inti dari sistem fisika modular.
 * Bisa digunakan langsung oleh project melalui setupPhysics(world).
 */
export default class PhysicsCore {
  static config = {
    enabled: true,
    type: "platformer",       // "platformer" | "topdown"
    friction: 0.9,            // faktor gesekan global
    maxFallSpeed: Infinity,   // kecepatan jatuh maksimum
    integratePosition: false, // true = posisi digerakkan oleh physics
  };

  constructor() {
    this.bodies = new Set();
    this.forces = [];
    this.integrator = new Integrator();
  }

  addBody(body, {
    mass = 1,
    damping = PhysicsCore.config.friction,
    useGravity = (PhysicsCore.config.type === "platformer"),
    maxFallSpeed = PhysicsCore.config.maxFallSpeed,
  } = {}) {
    body.mass = mass;
    body.damping = damping;
    body.useGravity = useGravity;
    body.maxFallSpeed = maxFallSpeed;

    body.vx ??= 0;
    body.vy ??= 0;

    this.bodies.add(body);
    return body;
  }

  addForce(force) {
    this.forces.push(force);
  }

  step(dt) {
    if (!PhysicsCore.config.enabled) return;
    const isTopdown = (PhysicsCore.config.type === "topdown");

    for (const body of this.bodies) {
      // 1️⃣ Terapkan semua gaya (gravity, dorongan, dsb)
      for (const f of this.forces) f.apply?.(body, dt);

      // 2️⃣ Gesekan / damping
      const damp = isTopdown ? Math.min(0.92, body.damping) : body.damping;
      body.vx *= damp;
      if (isTopdown) body.vy *= damp;

      // 3️⃣ Clamp kecepatan jatuh
      if (!isTopdown && body.vy > body.maxFallSpeed) {
        body.vy = body.maxFallSpeed;
      }

      // 4️⃣ Reduksi noise float kecil jika PIXEL_ART aktif
      if (Config?.PIXEL_ART) {
        body.vx = Math.round(body.vx * 1000) / 1000;
        body.vy = Math.round(body.vy * 1000) / 1000;
      }

      // 5️⃣ Integrasi posisi (hanya bila diaktifkan)
      if (PhysicsCore.config.integratePosition) {
        this.integrator.integrate(body, dt);
      }
    }
  }
}
