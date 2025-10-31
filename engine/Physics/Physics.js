// Physics/Physics.js
import Config from "../Config/Config.js";

export default class Physics {
  constructor() {
    this.mode = Config.PHYSICS.MODE;   // "platformer" / "topdown"
    this.bodies = new Set();
    this.forces = [];
  }

  addBody(body, {
    mass = 1,
    damping = Config.PHYSICS.FRICTION,
    useGravity = (this.mode === "platformer"),
    maxFallSpeed = Config.PHYSICS.MAX_VELOCITY_Y
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

  addForce(force) { this.forces.push(force); }

  // Terapkan gaya → update velocity
  step(dt) {
    for (const b of this.bodies) {
      // apply all registered forces
      for (const f of this.forces) f.apply?.(b, dt, this.mode);

      // damping: kurangi kecepatan (friction)
      const damp = (this.mode === "topdown")
        ? Math.min(0.92, b.damping)
        : b.damping;

      b.vx *= damp;
      if (this.mode === "topdown") b.vy *= damp;

      // batas kecepatan jatuh
      if (this.mode === "platformer" && b.vy > b.maxFallSpeed) {
        b.vy = b.maxFallSpeed;
      }
    }
  }
}
