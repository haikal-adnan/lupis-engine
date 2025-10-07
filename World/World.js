import Layering from "../Layering/Layering.js";
import Camera2D from "../Camera/Camera2D.js";
import Player from "../Entity/Player.js";
import Polygon from "../Entity/Polygon.js";
import Config from "../Config/Config.js";

export default class World {
  constructor(tilemap, tileset, image, glRenderer, glContext, input) {
    Object.assign(this, { tilemap, tileset, image, glRenderer, glContext, input });
    this.layers = [];
    this.camera = new Camera2D(0, 0);
    this.worldWidth = tilemap.width * tilemap.chunkWidth;
    this.worldHeight = tilemap.height * tilemap.chunkHeight;
  }

  async load() {
    for (const info of this.tilemap.layers) {
      const path = `Tilemap/${this.tilemap.name}/${info.name.toLowerCase()}`;
      const layer = new Layering(info.name, path, this.tileset, this.image, this.glRenderer);
      await layer.loadChunks(info.chunks);
      this.layers.push(layer);
    }
    const poly = new Polygon(this.glContext);
    const bmp = await poly.createRect(32, 32, "#2196F3");
    const img = this.image.cloneEmpty(this.glContext);
    await img.loadFromBitmap(bmp);
    this.player = new Player(img, 100, 100, 124, 124);
  }

  update(dt) {
    if (!this.player || !isFinite(dt) || dt <= 0) return;
    this.player.update(dt, this.input);

    const vw = Config.VIRTUAL_WIDTH, vh = Config.VIRTUAL_HEIGHT;
    const ww = this.worldWidth, wh = this.worldHeight;
    const cx = this.camera.x + vw / 2, cy = this.camera.y + vh / 2;
    const dx = vw * 0.25, dy = vh * 0.25;
    let tx = this.camera.x, ty = this.camera.y;

    if (this.player.x > cx + dx) tx = this.player.x - dx - vw / 2;
    if (this.player.x < cx - dx) tx = this.player.x + dx - vw / 2;
    if (this.player.y > cy + dy) ty = this.player.y - dy - vh / 2;
    if (this.player.y < cy - dy) ty = this.player.y + dy - vh / 2;

    const lerp = (a, b, t) => a + (b - a) * t;
    this.camera.x = lerp(this.camera.x, tx, 8 * dt);
    this.camera.y = lerp(this.camera.y, ty, 8 * dt);
    this.camera.x = Math.max(0, Math.min(this.camera.x, ww - vw));
    this.camera.y = Math.max(0, Math.min(this.camera.y, wh - vh));
  }

  render(alpha) {
    const proj = this.glRenderer.getWorldProjection(this.camera.x, this.camera.y);
    for (const layer of this.layers) layer.render(this.camera.x, this.camera.y, proj);
    this.player?.render(this.glRenderer, proj);
  }
}
