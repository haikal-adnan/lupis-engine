import { bus } from "@engine/Core/EventBus.js";
import { startEngine } from "@engine/main.js";
import { econsole } from "@engine/Core/EngineConsole.js";
import { initPlayer } from "./InitPlayer.js";
import { initInput } from "./InitInput.js";
import PlayerSystem from "@utils/Systems/PlayerSystem.js";

export async function initEngine(glCanvas) {
  bus.on("world:ready", async (info) => {
    econsole.log("🌍 EventBus: world:ready → " + info.message);

    const { game } = await import("@engine/main.js");
    const world = game.world;

    const input = initInput(game);

    const player = await initPlayer(game.glContext);
    world.addEntity(player);

    const playerSystem = new PlayerSystem(input);
    world.addSystem(playerSystem);
  });

  await startEngine(glCanvas, "editor");
  econsole.log("🎮 Engine berhasil dijalankan");
}

export async function main(glCanvas) {
  await initEngine(glCanvas);
}
