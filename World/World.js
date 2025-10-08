// World/World.js
import Layering from "../Layering/Layering.js";
import Camera2D from "../Camera/Camera2D.js";
import Player from "../Entity/Player.js";
import Polygon from "../Entity/Polygon.js";
import Config from "../Config/Config.js";
import { decodeRLE } from "../Util/RLE.js";

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp  = (a, b, t) => a + (b - a) * t;

export default class World {
  constructor(tilemap, tileset, image, glRenderer, glContext, input) {
    Object.assign(this, { tilemap, tileset, image, glRenderer, glContext, input });

    // cache config
    const { VIRTUAL_WIDTH: vw, VIRTUAL_HEIGHT: vh, SCALE = 1, TILE_SIZE = 16, CAMERA = {}, PIXEL_ART } = Config;
    this.vw = vw; this.vh = vh;
    this.tilePx = (tilemap.tileSize ?? TILE_SIZE) * SCALE;

    // ukuran meta (teoretis)
    this.levelW = (tilemap.width  ?? 0) * this.tilePx;
    this.levelH = (tilemap.height ?? 0) * this.tilePx;

    // kamera & state
    this.camera = new Camera2D(0, 0);
    this.camera.prevX = 0; this.camera.prevY = 0;
    this._camSnapped = false;
    this.deadX = CAMERA.DEADZONE_X ?? [0.5, 0.5];
    this.deadY = CAMERA.DEADZONE_Y ?? [0.5, 0.5];
    this.camLerp = CAMERA.LERP ?? 6.0;
    this.pixelLock = (CAMERA.PIXEL_LOCK ?? false) && (PIXEL_ART ?? false);

    // bound awal (refine setelah load)
    this.boundW = Math.max(this.levelW, this.vw);
    this.boundH = Math.max(this.levelH, this.vh);

    this.layers = [];
    this.player = null;
  }

  async load() {
    // muat layer/chunk
    for (const info of this.tilemap.layers) {
      const base = `Tilemap/${this.tilemap.name}/${info.name.toLowerCase()}`;
      const layer = new Layering(info.name, base, this.tileset, this.image, this.glRenderer);
      await layer.loadChunks(info.chunks);
      this.layers.push(layer);
    }

    await this.#recalcBoundsFromContent();

    // player placeholder
    const poly = new Polygon(this.glContext);
    const bmp  = await poly.createRect(32, 32, "#2196F3");
    const img  = this.image.cloneEmpty(this.glContext);
    await img.loadFromBitmap(bmp);

    const { WIDTH: pw, HEIGHT: ph } = Config.PLAYER;
    const px = 100, py = 1000;
    this.player = new Player(img, px, py, pw, ph);
    this.player.prevX = px; this.player.prevY = py;
  }

  async #recalcBoundsFromContent() {
    const cw = this.tilemap.chunkWidth  ?? 16;
    const ch = this.tilemap.chunkHeight ?? 16;

    let occMaxX = -1, occMaxY = -1;

    for (const L of this.tilemap.layers) {
      const base = `Tilemap/${this.tilemap.name}/${L.name.toLowerCase()}`;
      for (const c of L.chunks) {
        try {
          const j = await (await fetch(`${base}/${c.path}`)).json();
          const w = j?.width ?? cw, h = j?.height ?? ch;
          const rle = j?.rleData;
          if (!Array.isArray(rle)) continue;

          const grid = decodeRLE(rle, w, h);
          for (let y = 0; y < h; y++) {
            const row = grid[y];
            for (let x = 0; x < w; x++) {
              if (row[x]) {
                const gx = c.x * w + x;
                const gy = c.y * h + y;
                if (gx > occMaxX) occMaxX = gx;
                if (gy > occMaxY) occMaxY = gy;
              }
            }
          }
        } catch (e) {
          console.warn("Chunk fetch fail:", L.name, c, e);
        }
      }
    }

    const metaW = this.tilemap.width  ?? 0;
    const metaH = this.tilemap.height ?? 0;
    const tilesW = occMaxX >= 0 ? occMaxX + 1 : metaW;
    const tilesH = occMaxY >= 0 ? occMaxY + 1 : metaH;

    this.levelW = tilesW * this.tilePx;
    this.levelH = tilesH * this.tilePx;

    // edge guard dinamis (hindari ruang kosong kanan/bawah untuk deadzone 0.5)
    const guardX = Math.max(0, Math.ceil((this.levelW - this.vw) / 2));
    const guardY = Math.max(0, Math.ceil((this.levelH - this.vh) / 2));

    this.boundW = Math.max(this.vw, this.levelW - guardX);
    this.boundH = Math.max(this.vh, this.levelH - guardY);

    console.log("[bounds]", { levelW: this.levelW, levelH: this.levelH, vw: this.vw, vh: this.vh, guardX, guardY, boundW: this.boundW, boundH: this.boundH });
  }

  update(dt) {
    if (!this.player || !isFinite(dt) || dt <= 0) return;

    // simpan prev untuk interpolasi
    this.player.prevX = this.player.x; this.player.prevY = this.player.y;
    this.camera.prevX = this.camera.x; this.camera.prevY = this.camera.y;

    // gerak pemain
    this.player.update(dt, this.input);

    // clamp pemain
    const pw = this.player.width  ?? 0, ph = this.player.height ?? 0;
    const maxPX = Math.max(0, (this.boundW | 0) - pw);
    const maxPY = Math.max(0, (this.boundH | 0) - ph);
    this.player.x = clamp(this.player.x, 0, maxPX);
    this.player.y = clamp(this.player.y, 0, maxPY);
    if (this.pixelLock) {
      this.player.x = clamp(Math.round(this.player.x), 0, maxPX);
      this.player.y = clamp(Math.round(this.player.y), 0, maxPY);
    }

    // kamera follow
    const pCX = this.player.x + pw * 0.5, pCY = this.player.y + ph * 0.5;
    const maxCamX = Math.max(0, Math.min(this.boundW, this.levelW) - this.vw);
    const maxCamY = Math.max(0, Math.min(this.boundH, this.levelH) - this.vh);

    if (!this._camSnapped) {
      let sx = clamp(pCX - this.vw * 0.5, 0, maxCamX);
      let sy = clamp(pCY - this.vh * 0.5, 0, maxCamY);
      if (this.pixelLock) { sx = Math.round(sx); sy = Math.round(sy); }
      this.camera.x = this.camera.prevX = sx;
      this.camera.y = this.camera.prevY = sy;
      this._camSnapped = true;
      return;
    }

    const left   = this.camera.x + this.vw * this.deadX[0];
    const right  = this.camera.x + this.vw * this.deadX[1];
    const top    = this.camera.y + this.vh * this.deadY[0];
    const bottom = this.camera.y + this.vh * this.deadY[1];

    let tx = this.camera.x, ty = this.camera.y;
    if (pCX < left)        tx = pCX - this.vw * this.deadX[0];
    else if (pCX > right)  tx = pCX - this.vw * this.deadX[1];
    if (pCY < top)         ty = pCY - this.vh * this.deadY[0];
    else if (pCY > bottom) ty = pCY - this.vh * this.deadY[1];

    tx = clamp(tx, 0, maxCamX); ty = clamp(ty, 0, maxCamY);
    this.camera.x = this.pixelLock ? Math.round(lerp(this.camera.x, tx, this.camLerp * dt)) : lerp(this.camera.x, tx, this.camLerp * dt);
    this.camera.y = this.pixelLock ? Math.round(lerp(this.camera.y, ty, this.camLerp * dt)) : lerp(this.camera.y, ty, this.camLerp * dt);
  }

  render(alpha) {
    const camX = this.camera.prevX + (this.camera.x - this.camera.prevX) * alpha;
    const camY = this.camera.prevY + (this.camera.y - this.camera.prevY) * alpha;
    const proj = this.glRenderer.getWorldProjection(camX, camY);
    for (const L of this.layers) L.render(camX, camY, proj);
    this.player?.render(this.glRenderer, proj, alpha);
  }
}
