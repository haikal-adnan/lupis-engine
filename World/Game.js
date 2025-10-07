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

    this.input = null;
    this.touch = null;

    this.width  = Config.VIRTUAL_WIDTH;
    this.height = Config.VIRTUAL_HEIGHT;

    this.scale = Config.SCALE;
    this.tileSize = Config.TILE_SIZE;

    this.image = null;
    this.world = null;
  }


  /** Inisialisasi seluruh resource (tileset, world, atlas, dll) */
  async init() {
    console.log("🎮 Inisialisasi Game...");

    // 1️⃣ Muat atlas & tileset
    const tileset = await fetch("Tileset/terrain.json").then(r => r.json());
    this.image = new GLImage(this.glContext);
    await this.image.loadImage("Asset/Atlas/terrain.png");
    console.log("🧩 Tileset & Atlas berhasil dimuat.");

    // 2️⃣ Muat meta.json dari Tilemap hybrid
    const tilemap = await fetch("Tilemap/level1/meta.json").then(r => r.json());

    // 3️⃣ Buat world dan muat seluruh layer
    this.world = new World(
      tilemap,
      tileset,
      this.image,
      this.glRenderer,
      this.glContext,
      this.input
    );


    await this.world.load();
    console.log("🌍 World berhasil dimuat dengan", tilemap.layers.length, "layer.");
  }

  /** Update logika game tiap frame */
  update(dt) {
    if (this.world) this.world.update(dt);
  }

  /** Render frame */
  render(alpha) {
    if (!this.glRenderer) return;

    this.glRenderer.clear();
    if (this.world) this.world.render(alpha);
  }
}
