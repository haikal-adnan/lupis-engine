// projects/game-demo/registerEntities.js
import { bus } from "@engine/Core/EventBus.js";
import Player from "@utils/Entity/Player.js";
import Polygon from "@utils/Entity/Polygon.js";
import GLImage from "@engine/Renderer/GLImage.js";
import Config from "@engine/Config/Config.js";
import PhysicsCore from "@utils/Physics/PhysicsCore.js";
import Gravity from "@utils/Physics/Gravity.js";

bus.on("world:ready", async (world) => {
  console.log("🌍 [registerEntities] world:ready diterima");

  // === 1. Buat polygon & player ===
  const poly = new Polygon(world.glContext);
  const bmp = await poly.createRect(Config.PLAYER.WIDTH, Config.PLAYER.HEIGHT, "#4CAF50");
  const img = new GLImage(world.glContext);
  await img.loadFromBitmap(bmp);

  const startX = Config.PLAYER.X;
  const startY = Config.PLAYER.Y;
  const player = new Player(img, startX, startY);
  player.prevX = startX;
  player.prevY = startY;

  // === 2. Masukkan ke world ===
  world.entities.push(player);
  world.player = player;

  // === 3. Siapkan physics (kalau belum ada) ===
  if (!world.physics) {
    const P = Config.PHYSICS;
    const physics = new PhysicsCore();
    const gravity = new Gravity({ gy: P.GRAVITY ?? 9.8 * Config.PX_TILE });
    physics.addForce(gravity);
    world.physics = physics;
    world.gravity = gravity;
  }

  // === 4. Tambahkan player ke physics body ===
  world.physics.addBody(player, {
    mass: 1,
    damping: Config.PHYSICS.FRICTION ?? 0.9,
    useGravity: (Config.PHYSICS.MODE === "platformer"),
    maxFallSpeed: Config.PHYSICS.MAX_VELOCITY_Y ?? 62 * Config.PX_TILE,
  });

  console.log("✅ Player + Physics registered!");
});
