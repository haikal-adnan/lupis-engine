// src/code/InitInput.js
import { econsole } from "@engine/Core/EngineConsole.js";
import { bus } from "@engine/Core/EventBus.js";

export function initInput(game) {
  if (!game.world) {
    econsole.warn("⚠️ World belum siap untuk InputHandler");
    return;
  }

  const { input } = game;

  econsole.log("🎮 InputHandler diinisialisasi");

  bus.on("game:update", (dt) => {
    input.beginFrame();
  });

  return input;
}
