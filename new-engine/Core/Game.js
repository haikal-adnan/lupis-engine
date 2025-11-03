// src/engine/Core/Game.js
import Config from "../Config/Config.js";
import World from "../World/World.js";
import { bus } from "../Core/EventBus.js";

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
    // Bersihkan layar via GL renderer
    this.glRenderer?.clear();
    // World boleh menggambar sesuatu; untuk saat ini kosong
    this.world?.render?.(alpha);
  }
}