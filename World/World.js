// World/World.js
import Layering from "../Layering/Layering.js";
import Camera2D from "../Camera/Camera2D.js";
import Player from "../Entity/Player.js";
import Polygon from "../Entity/Polygon.js";
import Config from "../Config/Config.js";

export default class World {
  constructor(tilemap, tileset, image, glRenderer, glContext, input) {
    Object.assign(this, { tilemap, tileset, image, glRenderer, glContext, input });

    // === Kamera & state ===
    this.layers = [];
    this.camera = new Camera2D(0, 0);
    this.camera.prevX = 0;
    this.camera.prevY = 0;
    this._camSnapped = false; // <- agar frame pertama TANPA transisi

    // === Ukuran level (tiles * chunk * SCALE; tanpa tileSize) ===
    const scale = Config.SCALE ?? 1;
    const tilesWide = (tilemap.width ?? 0) * (tilemap.chunkWidth ?? 1);
    const tilesHigh = (tilemap.height ?? 0) * (tilemap.chunkHeight ?? 1);
    this.levelW = tilesWide * scale;
    this.levelH = tilesHigh * scale;

    // === Batas area gerak/kolisi = max(level, virtual) ===
    this.vw = Config.VIRTUAL_WIDTH;
    this.vh = Config.VIRTUAL_HEIGHT;
    this.boundW = Math.max(this.levelW, this.vw);
    this.boundH = Math.max(this.levelH, this.vh);

    // Kamera options
    const C = Config.CAMERA ?? {};
    this.deadX = C.DEADZONE_X ?? [0.5, 0.5];
    this.deadY = C.DEADZONE_Y ?? [0.5, 0.5];
    this.camLerp = C.LERP ?? 6.0;
    this.pixelLock = (C.PIXEL_LOCK ?? false) && (Config.PIXEL_ART ?? false);

    this.player = null;
  }

  async load() {
    for (const info of this.tilemap.layers) {
      const path = `Tilemap/${this.tilemap.name}/${info.name.toLowerCase()}`;
      const layer = new Layering(info.name, path, this.tileset, this.image, this.glRenderer);
      await layer.loadChunks(info.chunks);
      this.layers.push(layer);
    }

    // Player placeholder
    const poly = new Polygon(this.glContext);
    const bmp = await poly.createRect(32, 32, "#2196F3");
    const img = this.image.cloneEmpty(this.glContext);
    await img.loadFromBitmap(bmp);

    const pw = Config.PLAYER.WIDTH;
    const ph = Config.PLAYER.HEIGHT;
    const px = 100, py = 1000; // contoh start

    this.player = new Player(img, px, py, pw, ph);
    this.player.prevX = px;
    this.player.prevY = py;
  }

  update(dt) {
    if (!this.player || !isFinite(dt) || dt <= 0) return;

    // simpan posisi sebelumnya (interpolasi render)
    this.player.prevX = this.player.x;
    this.player.prevY = this.player.y;
    this.camera.prevX = this.camera.x;
    this.camera.prevY = this.camera.y;

    // gerakkan pemain
    this.player.update(dt, this.input);

    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

    // === CLAMP PEMAIN (otomatis sesuai ukuran pemain) ===
    const pw = this.player.width  ?? 0;
    const ph = this.player.height ?? 0;
    const maxPX = Math.max(0, Math.floor(this.boundW - pw));
    const maxPY = Math.max(0, Math.floor(this.boundH - ph));
    this.player.x = clamp(this.player.x, 0, maxPX);
    this.player.y = clamp(this.player.y, 0, maxPY);

    if (this.pixelLock) {
      this.player.x = clamp(Math.round(this.player.x), 0, maxPX);
      this.player.y = clamp(Math.round(this.player.y), 0, maxPY);
    }

    // === KAMERA FOLLOW ===
    const pCX = this.player.x + pw * 0.5;
    const pCY = this.player.y + ph * 0.5;

    // Batas kamera supaya tidak ada ruang kosong
    const maxCamX = Math.max(0, Math.min(this.boundW, this.levelW) - this.vw);
    const maxCamY = Math.max(0, Math.min(this.boundH, this.levelH) - this.vh);

    // Frame pertama: SNAP langsung ke posisi pemain (tanpa transisi)
    if (!this._camSnapped) {
      let snapX = clamp(pCX - this.vw * 0.5, 0, maxCamX);
      let snapY = clamp(pCY - this.vh * 0.5, 0, maxCamY);
      if (this.pixelLock) {
        snapX = clamp(Math.round(snapX), 0, maxCamX);
        snapY = clamp(Math.round(snapY), 0, maxCamY);
      }
      this.camera.x = this.camera.prevX = snapX;
      this.camera.y = this.camera.prevY = snapY;
      this._camSnapped = true;
      return; // selesai, tidak perlu lerp di frame pertama
    }

    // Setelah itu, pakai deadzone proporsional + lerp
    const left   = this.camera.x + this.vw * this.deadX[0];
    const right  = this.camera.x + this.vw * this.deadX[1];
    const top    = this.camera.y + this.vh * this.deadY[0];
    const bottom = this.camera.y + this.vh * this.deadY[1];

    let targetX = this.camera.x;
    let targetY = this.camera.y;
    if (pCX < left)        targetX = pCX - this.vw * this.deadX[0];
    else if (pCX > right)  targetX = pCX - this.vw * this.deadX[1];
    if (pCY < top)         targetY = pCY - this.vh * this.deadY[0];
    else if (pCY > bottom) targetY = pCY - this.vh * this.deadY[1];

    targetX = clamp(targetX, 0, maxCamX);
    targetY = clamp(targetY, 0, maxCamY);

    const lerp = (a, b, t) => a + (b - a) * t;
    this.camera.x = lerp(this.camera.x, targetX, this.camLerp * dt);
    this.camera.y = lerp(this.camera.y, targetY, this.camLerp * dt);

    if (this.pixelLock) {
      this.camera.x = clamp(Math.round(this.camera.x), 0, maxCamX);
      this.camera.y = clamp(Math.round(this.camera.y), 0, maxCamY);
    }
  }

  render(alpha) {
    const camX = this.camera.prevX + (this.camera.x - this.camera.prevX) * alpha;
    const camY = this.camera.prevY + (this.camera.y - this.camera.prevY) * alpha;

    const proj = this.glRenderer.getWorldProjection(camX, camY);

    for (const layer of this.layers) layer.render(camX, camY, proj);
    this.player?.render(this.glRenderer, proj, alpha);
  }
}
