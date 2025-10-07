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
    this.width = Config.VIRTUAL_WIDTH;
    this.height = Config.VIRTUAL_HEIGHT;
    this.scale = Config.SCALE;
    this.tileSize = Config.TILE_SIZE;
  }

  attachWorld(world) {
    this.world = world;
  }

  update(dt) {
    this.world?.update(dt);
  }

  render(alpha) {
    this.glRenderer?.clear();
    this.world?.render(alpha);
  }
}
