import PhysicsCore from "@utils/Physics/PhysicsCore.js";
import Gravity from "@utils/Physics/Gravity.js";
import Config from "@engine/Core/Config.js";

export async function setupPhysics(world, config = Config) {
  const P = config.PHYSICS;

  // --- Matikan physics totally ---
  if (!P || P.PHYSICS === false) {
    PhysicsCore.config.enabled = false;
    world.type = config.TYPE ?? "platformer";
    world.physics = null;
    world.gravity = null;
    console.log("⚙️ Physics OFF");
    return;
  }

  PhysicsCore.config.enabled         = true;
  PhysicsCore.config.type            = config.TYPE ?? (P.MODE ?? "platformer");
  PhysicsCore.config.friction        = P.FRICTION ?? 0.9;
  PhysicsCore.config.maxFallSpeed    = P.MAX_VELOCITY_Y ?? 62 * config.PX_TILE;

  PhysicsCore.config.integratePosition = !world.collision;

  world.type = PhysicsCore.config.type;

  const physics = new PhysicsCore();
  const gravity = new Gravity({ gy: P.GRAVITY ?? 9.8 * config.PX_TILE });

  physics.addForce(gravity);

  if (world.player) {
    physics.addBody(world.player, {
      mass: 1,
      damping: P.FRICTION ?? 0.9,
      useGravity: (PhysicsCore.config.type === "platformer"),
      maxFallSpeed: PhysicsCore.config.maxFallSpeed
    });
  }

  world.physics = physics;
  world.gravity = gravity;

  console.log("✅ Physics aktif (type=%s, integrate=%s)",
    PhysicsCore.config.type, PhysicsCore.config.integratePosition);
}
