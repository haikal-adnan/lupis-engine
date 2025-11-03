import { bus } from "@engine/Core/EventBus.js";
import { startEngine } from "@engine/main.js";
import { econsole } from "@engine/Core/EngineConsole.js";
import { initPlayer } from "./InitPlayer.js";
import { initInput } from "./InitInput.js";

export async function initEngine() {
  bus.on("world:ready", async (info) => {
    econsole.log("🌍 EventBus: world:ready → " + info.message);

    const { game } = await import("@engine/main.js");
    const world = game.world;
    if (!world) return econsole.warn("⚠️ World belum siap untuk Player");

    // 🔹 Buat Player
    const player = await initPlayer(game.glContext);
    world.player = player;

    // 🔹 Hubungkan input ke player
    initInput(game);

    econsole.log("✅ Player & InputHandler berhasil diinisialisasi");
  });

  try {
    await startEngine();
    econsole.log("🎮 Engine berhasil dijalankan");
  } catch (err) {
    econsole.error("❌ Gagal memuat engine:", err);
  }
}

export async function main() {
  await initEngine();
}
