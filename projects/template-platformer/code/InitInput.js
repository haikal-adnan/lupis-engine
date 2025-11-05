import { econsole } from "@engine/Core/EngineConsole.js";
import { bus } from "@engine/Core/EventBus.js";

/**
 * Menyambungkan InputHandler ke Player agar bisa bergerak.
 * Pemanggilannya dilakukan setelah Player dimasukkan ke World.
 */
export function initInput(game) {
  if (!game.world || !game.world.player) {
    econsole.warn("⚠️ Player belum siap untuk InputHandler");
    return;
  }

  const player = game.world.player;
  const input = game.input;

  econsole.log("🎮 InputHandler terhubung ke Player");

  // Update movement di tiap frame
  bus.on("game:update", (dt) => {
    input.beginFrame();
    player.update(dt, input, "platformer"); 
  });
}
