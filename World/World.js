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
    this.camera.prevX = 0;
    this.camera.prevY = 0;

    this.worldWidth  = tilemap.width  * tilemap.chunkWidth;
    this.worldHeight = tilemap.height * tilemap.chunkHeight;

    this.player = null;
  }

  async load() {
    // === Muat semua layer tilemap ===
    for (const info of this.tilemap.layers) {
      const path = `Tilemap/${this.tilemap.name}/${info.name.toLowerCase()}`;
      const layer = new Layering(info.name, path, this.tileset, this.image, this.glRenderer);
      await layer.loadChunks(info.chunks);
      this.layers.push(layer);
    }

    // === Buat player sederhana (kotak biru) ===
    const poly = new Polygon(this.glContext);
    const bmp = await poly.createRect(32, 32, "#2196F3");

    const img = this.image.cloneEmpty(this.glContext);
    await img.loadFromBitmap(bmp);

    const px = 100;
    const py = 100;
    const pw = Config.PLAYER.WIDTH;
    const ph = Config.PLAYER.HEIGHT;

    this.player = new Player(img, px, py, pw, ph);
    this.player.prevX = px;
    this.player.prevY = py;
  }

  update(dt) {
    if (!this.player || !isFinite(dt) || dt <= 0) return;

    // simpan posisi lama sebelum update
    this.player.prevX = this.player.x;
    this.player.prevY = this.player.y;
    this.camera.prevX = this.camera.x;
    this.camera.prevY = this.camera.y;

    // update player (input + movement)
    this.player.update(dt, this.input);

    // === Kamera mengikuti pemain ===
    const vw = Config.VIRTUAL_WIDTH;
    const vh = Config.VIRTUAL_HEIGHT;
    const ww = this.worldWidth;
    const wh = this.worldHeight;

    const cx = this.camera.x + vw / 2;
    const cy = this.camera.y + vh / 2;
    const dx = vw * 0.25;
    const dy = vh * 0.25;

    let tx = this.camera.x;
    let ty = this.camera.y;

    if (this.player.x > cx + dx) tx = this.player.x - dx - vw / 2;
    if (this.player.x < cx - dx) tx = this.player.x + dx - vw / 2;
    if (this.player.y > cy + dy) ty = this.player.y - dy - vh / 2;
    if (this.player.y < cy - dy) ty = this.player.y + dy - vh / 2;

    const lerp = (a, b, t) => a + (b - a) * t;
    this.camera.x = lerp(this.camera.x, tx, 8 * dt);
    this.camera.y = lerp(this.camera.y, ty, 8 * dt);

    // batasi agar kamera tidak keluar world
    this.camera.x = Math.max(0, Math.min(this.camera.x, ww - vw));
    this.camera.y = Math.max(0, Math.min(this.camera.y, wh - vh));
  }

  render(alpha) {
    // === Interpolasi kamera ===
    const camX = this.camera.prevX + (this.camera.x - this.camera.prevX) * alpha;
    const camY = this.camera.prevY + (this.camera.y - this.camera.prevY) * alpha;

    const proj = this.glRenderer.getWorldProjection(camX, camY);

    // render tiap layer tilemap
    for (const layer of this.layers) {
      layer.render(camX, camY, proj);
    }

    // render player dengan interpolasi posisi
    this.player?.render(this.glRenderer, proj, alpha);
  }
}
