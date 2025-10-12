// World/World.js
import Layering from "../Layering/Layering.js";
import Camera2D from "../Camera/Camera2D.js";
import Player from "../Entity/Player.js";
import Polygon from "../Entity/Polygon.js";
import Config from "../Config/Config.js";
import { decodeRLE } from "../Util/RLE.js";

import CollisionSystem from "../Collision/CollisionSystem.js";
import CollisionGrid from "../Collision/CollisionGrid.js";
import Physics from "../Physics/Physics.js";
import Gravity from "../Physics/Gravity.js";

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp  = (a, b, t) => a + (b - a) * t;

export default class World {
  constructor(tilemap, tileset, image, glRenderer, glContext, input) {
    Object.assign(this, { tilemap, tileset, image, glRenderer, glContext, input });

    this.vw = Config.VIRTUAL_WIDTH;
    this.vh = Config.VIRTUAL_HEIGHT;
    this.scale = Config.SCALE ?? 1;
    this.tilePx = (tilemap?.tileSize ?? Config.TILE_SIZE) * this.scale;

    this.levelW = Config.WORLD?.WIDTH ?? this.vw;
    this.levelH = Config.WORLD?.HEIGHT ?? this.vh;

    const C = Config.CAMERA ?? {};
    this.camera = new Camera2D(0, 0);
    this.camera.prevX = 0; this.camera.prevY = 0;
    this._camSnapped = false;
    this.deadX = C.DEADZONE_X ?? [0.5, 0.5];
    this.deadY = C.DEADZONE_Y ?? [0.5, 0.5];
    this.camLerp = C.LERP ?? 6.0;
    this.pixelLock = (C.PIXEL_LOCK ?? false) && (Config.PIXEL_ART ?? false);

    this.boundW = Math.max(this.levelW, this.vw);
    this.boundH = Math.max(this.levelH, this.vh);

    this.layers = [];
    this.player = null;

    this.physics = null;
    this.gravity = null;
    this.collision = null;
    this.collisionGrid = null;

    this.mode = Config.PHYSICS?.MODE ?? "platformer";
  }

  async load() {
    for (const info of this.tilemap.layers) {
      const base = `${Config.WORLD?.PATH_BASE ?? "Tilemap"}/${this.tilemap.name}/${info.name.toLowerCase()}`;
      const layer = new Layering(info.name, base, this.tileset, this.image, this.glRenderer);
      await layer.loadChunks(info.chunks);
      this.layers.push(layer);
    }

    await this.#recalcBoundsFromContent();
    await this.#initPlayer();
    await this.#initPhysicsAndCollision();

    console.log("[Player]", this.player.x, this.player.y, this.player.width, this.player.height);
    console.log("[Grid] wt,ht,tilePx =>", this.collisionGrid.wt, this.collisionGrid.ht, this.collisionGrid.tile);

  }

  // === Update Loop ===
  update(dt) {
    if (!this.player || !isFinite(dt) || dt <= 0) return;

    // 1️⃣ Simpan posisi sebelumnya untuk interpolasi (render smoothing)
    this.#savePrevPositions();

    // 2️⃣ Baca input dan ubah state player (bergerak, lompat, dsb)
    this.#handlePlayerInput(dt);

    // 3️⃣ Jalankan simulasi fisika (gaya, percepatan, kecepatan)
    this.#simulatePhysics(dt);

    // 4️⃣ Periksa dan selesaikan tumbukan dengan tile/collision grid
    this.#resolveCollisions(dt);

    // 5️⃣ Pastikan player tidak keluar dari batas dunia (clamp posisi)
    this.#clampPlayerWithinBounds();

    // 6️⃣ Update posisi kamera mengikuti player d(deadzone + lerp)
    this.#updateCamera(dt);

    const grid = this.collisionGrid;
    const feetTx = Math.floor((this.player.x + this.player.width * 0.5) / grid.tile);
    const feetTy = Math.floor((this.player.y + this.player.height) / grid.tile);
    console.log("[Feet tile]", feetTx, feetTy, "isSolid?", grid.isSolid(feetTx, feetTy));
  }

  render(alpha) {
    // Interpolasi posisi kamera (smooth transition antara frame logic)
    const camX = this.camera.prevX + (this.camera.x - this.camera.prevX) * alpha;
    const camY = this.camera.prevY + (this.camera.y - this.camera.prevY) * alpha;

    // Buat matriks proyeksi dunia berdasarkan posisi kamera
    const proj = this.glRenderer.getWorldProjection(camX, camY);

    // 1️⃣ Render seluruh layer tilemap (background, terrain, dll)
    for (const L of this.layers) L.render(camX, camY, proj);

    // 2️⃣ Render entity utama (player, NPC, object interaktif)
    this.player?.render(this.glRenderer, proj, alpha);
  }


  async #initPlayer() {
    const poly = new Polygon(this.glContext);
    const bmp  = await poly.createRect(Config.PLAYER.WIDTH, Config.PLAYER.HEIGHT, "#2196F3");
    const img  = this.image.cloneEmpty(this.glContext);
    await img.loadFromBitmap(bmp);

    const start = Config.PLAYER.START_POS ?? { X: 100, Y: 1000 };
    this.player = new Player(img, start.X, start.Y);
    this.player.prevX = start.X;
    this.player.prevY = start.Y;
  }

  // /World/World.js (di #initPhysicsAndCollision)
  async #initPhysicsAndCollision() {
    this.collisionGrid = await CollisionGrid.fromTilemap(
      this.tilemap,
      decodeRLE,
      this.tilePx,
      /(solid|wall|terrain|ground|collid)/i,
      Config.WORLD?.PATH_BASE ?? "Tilemap"
    );

    this.physics = new Physics({ mode: this.mode });
    this.gravity = new Gravity({ gy: Config.PHYSICS?.GRAVITY ?? 980 });
    this.physics.addForce(this.gravity);

    this.physics.addBody(this.player, {
      mass: 1,
      damping: Config.PHYSICS?.FRICTION ?? 0.9,
      useGravity: this.mode === "platformer",
      maxFallSpeed: Config.PHYSICS?.MAX_VELOCITY_Y ?? 2000
    });

    this.collision = new CollisionSystem(this.collisionGrid, this.mode);
  }

  async #recalcBoundsFromContent() {
    const cw = this.tilemap.chunkWidth ?? (Config.WORLD?.CHUNK_SIZE ?? 16);
    const ch = this.tilemap.chunkHeight ?? (Config.WORLD?.CHUNK_SIZE ?? 16);

    let occMaxX = -1, occMaxY = -1;

    for (const L of this.tilemap.layers) {
      const base = `${Config.WORLD?.PATH_BASE ?? "Tilemap"}/${this.tilemap.name}/${L.name.toLowerCase()}`;
      for (const c of L.chunks) {
        try {
          const j = await (await fetch(`${base}/${c.path}`)).json();
          const w = j?.width ?? cw, h = j?.height ?? ch;
          const rle = j?.rleData;
          if (!Array.isArray(rle)) continue;
          const grid = decodeRLE(rle, w, h);

          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              if (grid[y][x]) {
                const gx = c.x * w + x;
                const gy = c.y * h + y;
                occMaxX = Math.max(occMaxX, gx);
                occMaxY = Math.max(occMaxY, gy);
              }
            }
          }
        } catch (e) {
          console.warn("Chunk fetch fail:", L.name, c, e);
        }
      }
    }

    const metaW = this.tilemap.width ?? Math.ceil((Config.WORLD?.WIDTH ?? this.vw) / this.tilePx);
    const metaH = this.tilemap.height ?? Math.ceil((Config.WORLD?.HEIGHT ?? this.vh) / this.tilePx);
    const tilesW = occMaxX >= 0 ? occMaxX + 1 : metaW;
    const tilesH = occMaxY >= 0 ? occMaxY + 1 : metaH;

    this.levelW = tilesW * this.tilePx;
    this.levelH = tilesH * this.tilePx;

    const guardX = Math.max(0, Math.ceil((this.levelW - this.vw) / 2));
    const guardY = Math.max(0, Math.ceil((this.levelH - this.vh) / 2));

    this.boundW = Math.max(this.vw, this.levelW - guardX);
    this.boundH = Math.max(this.vh, this.levelH - guardY);
  }

  #savePrevPositions() {
    this.player.prevX = this.player.x;
    this.player.prevY = this.player.y;
    this.camera.prevX = this.camera.x;
    this.camera.prevY = this.camera.y;
  }

  #handlePlayerInput(dt) {
    this.player.update(dt, this.input, this.mode);
  }

  #simulatePhysics(dt) {
    this.physics.step(dt);
  }

  #resolveCollisions(dt) {
    this.collision.moveBody(this.player, dt);
  }

  #clampPlayerWithinBounds() {
    const pw = this.player.width, ph = this.player.height;
    const maxPX = Math.max(0, (this.boundW | 0) - pw);
    const maxPY = Math.max(0, (this.boundH | 0) - ph);
    this.player.x = clamp(this.player.x, 0, maxPX);
    this.player.y = clamp(this.player.y, 0, maxPY);
    if (this.pixelLock) {
      this.player.x = clamp(Math.round(this.player.x), 0, maxPX);
      this.player.y = clamp(Math.round(this.player.y), 0, maxPY);
    }
  }

  #updateCamera(dt) {
    const pw = this.player.width, ph = this.player.height;
    const pCX = this.player.x + pw * 0.5;
    const pCY = this.player.y + ph * 0.5;
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

    tx = clamp(tx, 0, maxCamX);
    ty = clamp(ty, 0, maxCamY);

    this.camera.x = this.pixelLock ? Math.round(lerp(this.camera.x, tx, this.camLerp * dt))
                                   : lerp(this.camera.x, tx, this.camLerp * dt);
    this.camera.y = this.pixelLock ? Math.round(lerp(this.camera.y, ty, this.camLerp * dt))
                                   : lerp(this.camera.y, ty, this.camLerp * dt);
  }
}
