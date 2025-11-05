// World/Game.js (perbarui)
import Config from "../Config/Config.js";
import World from "../World/World.js";

export default class Game {
  constructor() {
    this.glRenderer = null;
    this.uiRenderer = null;
    this.glContext = null;
    this.uiContext = null;
    this.loop = null;
    this.input = null;
    this.touch = null;
    this.world = null;
    this.image = null;
    this.config = null;
    this.grid = null;

    // === ukuran dasar virtual screen ===
    this.width  = Config.VIRTUAL_WIDTH;
    this.height = Config.VIRTUAL_HEIGHT;
    this.scale  = Config.SCALE;
    this.tileSize = Config.TILE_SIZE;

    // === identitas runtime ===
    this.project = null; // projectId aktif
    this.level   = null; // nama level aktif
  }

  attachWorld(world) {
    this.world = world;
  }

  update(dt) {
    if (this.world) this.world.update(dt);
  }

  render(alpha) {
    if (this.glRenderer) this.glRenderer.clear();
    if (this.world) this.world.render(alpha);
  }


}
