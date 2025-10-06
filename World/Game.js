import World from "../World/World.js";
import GLImage from "../Renderer/GLImage.js";
import Config from "../Config/Config.js";

export default class Game {
  constructor() {
    this.glRenderer = null;
    this.uiRenderer = null;
    this.glContext  = null;
    this.uiContext  = null;
    this.loop = null;

    this.width  = Config.VIRTUAL_WIDTH;
    this.height = Config.VIRTUAL_HEIGHT;

    this.scale = Config.SCALE;
    this.tileSize = Config.TILE_SIZE;

    this.image = null;
    this.world = null;  // <— Tambahkan world
  }

  async init() {
    // Muat atlas & tileset
    const tileset = await (await fetch("Tileset/terrain.json")).json();
    this.image = new GLImage(this.glContext);
    await this.image.loadImage("Asset/Atlas/terrain.png");

    // Muat world dari tilemap
    const tilemap = await (await fetch("Tilemap/level1.json")).json();
    this.world = new World(tilemap, tileset, this.image, this.glRenderer);
  }

  update(dt) {
    if (this.world) this.world.update(dt);
  }

  render(alpha) {
    this.glRenderer.clear();
    if (this.world) this.world.render(alpha);
  }
}
