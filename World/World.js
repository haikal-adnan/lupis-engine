// World/World.js — modular single‑file refactor
// Tetap 1 file, tetapi fungsi dipecah menjadi modul kecil/privat agar mudah dirawat

import Layering from "../Layering/Layering.js";
import Camera2D from "../Camera/Camera2D.js";
import Player from "../Entity/Player.js";
import Polygon from "../Entity/Polygon.js";
import Config from "../Config/Config.js";
import CollisionSystem from "../Collision/CollisionSystem.js";
import CollisionGrid from "../Collision/CollisionGrid.js";
import Physics from "../Physics/Physics.js";
import Gravity from "../Physics/Gravity.js";
import { decodeRLE } from "../Util/RLE.js";

// ===============
// Util murni
// ===============
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp  = (a, b, t) => a + (b - a) * t;
const roundIf = (flag, v) => (flag ? Math.round(v) : v);

// Mengemas konfigurasi supaya mudah diakses
function makeCameraConfig(cfg, pixelArt) {
  const C = cfg?.CAMERA ?? {};
  return {
    deadX: C.DEADZONE_X ?? [0.5, 0.5],
    deadY: C.DEADZONE_Y ?? [0.5, 0.5],
    lerp:  C.LERP ?? 6.0,
    pixelLock: (C.PIXEL_LOCK ?? false) && (pixelArt ?? false),
  };
}

function calcTilePixel(tilemap, cfg) {
  const SCALE = cfg.SCALE ?? 1;
  const TILE  = tilemap?.tileSize ?? cfg.TILE_SIZE ?? 16;
  return TILE * SCALE;
}

// Membaca occupancy tile dari RLE tiap chunk, lalu mengembalikan ukuran level (dalam tile)
async function measureTilesFromChunks(tilemap, fallbackW, fallbackH) {
  if (!tilemap?.layers) return { tilesW: tilemap?.width ?? 0, tilesH: tilemap?.height ?? 0 };

  const cw = tilemap.chunkWidth  ?? fallbackW ?? 16;
  const ch = tilemap.chunkHeight ?? fallbackH ?? 16;

  let occMaxX = -1, occMaxY = -1;

  for (const L of tilemap.layers) {
    const base = `Tilemap/${tilemap.name}/${L.name.toLowerCase()}`;
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

  const metaW = tilemap.width  ?? 0;
  const metaH = tilemap.height ?? 0;
  const tilesW = occMaxX >= 0 ? occMaxX + 1 : metaW;
  const tilesH = occMaxY >= 0 ? occMaxY + 1 : metaH;
  return { tilesW, tilesH };
}

// Hitung bounds level (pixel) dan guard untuk mengurangi ruang kosong kanan/bawah
function derivePixelBounds(vw, vh, tilesW, tilesH, tilePx) {
  const levelW = tilesW * tilePx;
  const levelH = tilesH * tilePx;

  const guardX = Math.max(0, Math.ceil((levelW - vw) / 2));
  const guardY = Math.max(0, Math.ceil((levelH - vh) / 2));

  const boundW = Math.max(vw, levelW - guardX);
  const boundH = Math.max(vh, levelH - guardY);

  return { levelW, levelH, boundW, boundH };
}

// ======================
// Kelas utama: World
// ======================
export default class World {
  constructor(tilemap, tileset, image, glRenderer, glContext, input) {
    Object.assign(this, { tilemap, tileset, image, glRenderer, glContext, input });

    // cache config penting
    this.vw = Config.VIRTUAL_WIDTH;
    this.vh = Config.VIRTUAL_HEIGHT;
    this.tilePx = calcTilePixel(tilemap, Config);

    this.camCfg = makeCameraConfig(Config, Config.PIXEL_ART);

    // ukuran meta (sementara, refine setelah load)
    this.levelW = (tilemap.width  ?? 0) * this.tilePx;
    this.levelH = (tilemap.height ?? 0) * this.tilePx;

    // bound awal
    this.boundW = Math.max(this.levelW, this.vw);
    this.boundH = Math.max(this.levelH, this.vh);

    // kamera
    this.camera = new Camera2D(0, 0);
    this.camera.prevX = 0; this.camera.prevY = 0;
    this._camSnapped = false;

    // entity/layer
    this.layers = [];
    this.player = null;

    // sistem (disiapkan, mudah diaktifkan)
    this.physics = null;
    this.gravity = null;
    this.collision = null;
    this.collisionGrid = null;
    this.mode = (Config.PHYSICS?.MODE ?? "platformer");
  }

  // ==================
  // Lifecycle
  // ==================
  async load() {
    await this.#loadLayers();
    await this.#recalcBoundsFromContent();
    await this.#spawnPlayerPlaceholder();
  }

  update(dt) {
    if (!this.player || !isFinite(dt) || dt <= 0) return;

    this.#savePrevState();
    this.#updatePlayer(dt);
    this.#clampPlayerToBounds();
    this.#updateCamera(dt);
  }

  render(alpha) {
    const camX = this.camera.prevX + (this.camera.x - this.camera.prevX) * alpha;
    const camY = this.camera.prevY + (this.camera.y - this.camera.prevY) * alpha;

    const proj = this.glRenderer.getWorldProjection(camX, camY);
    this.#renderLayers(camX, camY, proj);
    this.#renderPlayer(proj, alpha);
  }

  // ==================
  // Private: Load
  // ==================
  async #loadLayers() {
    if (!this.tilemap?.layers) return;
    for (const info of this.tilemap.layers) {
      const base = `Tilemap/${this.tilemap.name}/${info.name.toLowerCase()}`;
      const layer = new Layering(info.name, base, this.tileset, this.image, this.glRenderer);
      await layer.loadChunks(info.chunks);
      this.layers.push(layer);
    }
  }

  async #recalcBoundsFromContent() {
    const { tilesW, tilesH } = await measureTilesFromChunks(
      this.tilemap,
      this.tilemap?.chunkWidth,
      this.tilemap?.chunkHeight,
    );

    const { levelW, levelH, boundW, boundH } = derivePixelBounds(
      this.vw, this.vh, tilesW, tilesH, this.tilePx
    );

    this.levelW = levelW; this.levelH = levelH;
    this.boundW = boundW; this.boundH = boundH;

    console.log("[bounds]", { levelW, levelH, vw: this.vw, vh: this.vh, boundW, boundH });
  }

  async #spawnPlayerPlaceholder() {
    // placeholder player: kotak 32x32
    const poly = new Polygon(this.glContext);
    const bmp  = await poly.createRect(32, 32, "#2196F3");
    const img  = this.image.cloneEmpty(this.glContext);
    await img.loadFromBitmap(bmp);

    const { WIDTH: pw, HEIGHT: ph } = Config.PLAYER;
    const px = 100, py = 1000;
    this.player = new Player(img, px, py, pw, ph);
    this.player.prevX = px; this.player.prevY = py;
  }

  // ==================
  // Private: Update pipeline
  // ==================
  #savePrevState() {
    this.player.prevX = this.player.x; this.player.prevY = this.player.y;
    this.camera.prevX = this.camera.x; this.camera.prevY = this.camera.y;
  }

  #updatePlayer(dt) {
    // di masa depan: plug Physics/Gravity/Collision di sini
    this.player.update(dt, this.input);
  }

  #clampPlayerToBounds() {
    const pw = this.player.width  ?? 0;
    const ph = this.player.height ?? 0;

    const maxPX = Math.max(0, (this.boundW | 0) - pw);
    const maxPY = Math.max(0, (this.boundH | 0) - ph);

    this.player.x = clamp(this.player.x, 0, maxPX);
    this.player.y = clamp(this.player.y, 0, maxPY);

    if (this.camCfg.pixelLock) {
      this.player.x = clamp(Math.round(this.player.x), 0, maxPX);
      this.player.y = clamp(Math.round(this.player.y), 0, maxPY);
    }
  }

  #updateCamera(dt) {
    const { deadX, deadY, lerp: camLerp, pixelLock } = this.camCfg;
    const pw = this.player.width  ?? 0;
    const ph = this.player.height ?? 0;

    const pCX = this.player.x + pw * 0.5;
    const pCY = this.player.y + ph * 0.5;

    const maxCamX = Math.max(0, Math.min(this.boundW, this.levelW) - this.vw);
    const maxCamY = Math.max(0, Math.min(this.boundH, this.levelH) - this.vh);

    // Snap pertama kali
    if (!this._camSnapped) {
      let sx = clamp(pCX - this.vw * 0.5, 0, maxCamX);
      let sy = clamp(pCY - this.vh * 0.5, 0, maxCamY);
      sx = roundIf(pixelLock, sx);
      sy = roundIf(pixelLock, sy);
      this.camera.x = this.camera.prevX = sx;
      this.camera.y = this.camera.prevY = sy;
      this._camSnapped = true;
      return;
    }

    // Deadzone target
    const left   = this.camera.x + this.vw * deadX[0];
    const right  = this.camera.x + this.vw * deadX[1];
    const top    = this.camera.y + this.vh * deadY[0];
    const bottom = this.camera.y + this.vh * deadY[1];

    let tx = this.camera.x, ty = this.camera.y;
    if (pCX < left)        tx = pCX - this.vw * deadX[0];
    else if (pCX > right)  tx = pCX - this.vw * deadX[1];
    if (pCY < top)         ty = pCY - this.vh * deadY[0];
    else if (pCY > bottom) ty = pCY - this.vh * deadY[1];

    // Clamp & smooth
    tx = clamp(tx, 0, maxCamX);
    ty = clamp(ty, 0, maxCamY);

    const smx = lerp(this.camera.x, tx, camLerp * dt);
    const smy = lerp(this.camera.y, ty, camLerp * dt);

    this.camera.x = roundIf(pixelLock, smx);
    this.camera.y = roundIf(pixelLock, smy);
  }

  // ==================
  // Private: Render
  // ==================
  #renderLayers(camX, camY, proj) {
    for (const L of this.layers) L.render(camX, camY, proj);
  }

  #renderPlayer(proj, alpha) {
    this.player?.render(this.glRenderer, proj, alpha);
  }
}
