// /Physics/Physics.js
export default class Physics {
  constructor({ mode = "platformer" } = {}) {
    this.mode = mode;
    this.bodies = new Set();
    this.forces = [];
  }

  addBody(body, {
    mass = 1,
    damping = 0.9,
    useGravity = (this.mode === "platformer"),
    maxFallSpeed = 1600
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

  // Terapkan gaya → update velocity (posisi diurus CollisionSystem)
  step(dt) {
    for (const b of this.bodies) {
      // apply forces
      for (const f of this.forces) f.apply?.(b, dt, this.mode);

      // damping (top-down biasanya lebih kuat)
      const damp = (this.mode === "topdown") ? Math.min(0.92, b.damping ?? 0.9) : (b.damping ?? 0.9);
      b.vx *= damp;
      if (this.mode === "topdown") b.vy *= damp; // di platformer, vy diatur gravitas & collision

      // clamp terminal fall (platformer)
      if (this.mode === "platformer" && b.vy > (b.maxFallSpeed ?? 1600)) {
        b.vy = b.maxFallSpeed ?? 1600;
      }
    }
  }
}
