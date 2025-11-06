// src/engine/Core/Game.js
import Config from "../Config/Config.js";
import World from "../World/World.js";
import { bus } from "./EventBus.js";

export default class Game {
  constructor() {
    this.glRenderer = null;
    this.uiRenderer = null;
    this.glContext  = null;
    this.uiContext  = null;
    this.loop  = null;
    this.world = null;

    this.input = null;
    this.touch = null;

    this.width    = Config.VIRTUAL_WIDTH;
    this.height   = Config.VIRTUAL_HEIGHT;

    this.project = null;
    this.level   = null;
  }

  attachWorld(world) {
    this.world = world;
  }

  update(dt) {
    // Rendering-only: tidak ada logic selain world.update kosong
    bus.emit("game:update", dt);
    this.world?.update?.(dt);
  }

  render(alpha) {
    const isEditor = Config.ENGINE_MODE === "editor";

    // === Bersihkan layar ===
    this.glRenderer?.clear();

    // === Render world tanpa interpolasi saat editor ===
    if (this.world) {
      const renderAlpha = isEditor ? 1 : alpha;
      this.world.render(renderAlpha);
    }
  }
}