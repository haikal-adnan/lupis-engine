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
const NAME_RE = /(solid|wall|terrain|ground|collid)/i;

export default class World {
  constructor(tilemap, tileset, image, glRenderer, glContext, input) {
    Object.assign(this, { tilemap, tileset, image, glRenderer, glContext, input });

    this.vw = Config.VIRTUAL_WIDTH;
    this.vh = Config.VIRTUAL_HEIGHT;
    this.tilePx = Config.PX_TILE;

    const C = Config.CAMERA ?? {};
    this.camera = new Camera2D(0, 0);
    this.camera.prevX = 0;
    this.camera.prevY = 0;
    this.camLerp = C.LERP ?? 6.0;
    this.pixelLock = (C.PIXEL_LOCK ?? false) && (Config.PIXEL_ART ?? false);

    this.levelW = Config.WORLD?.WIDTH ?? this.vw;
    this.levelH = Config.WORLD?.HEIGHT ?? this.vh;
    this.boundW = Math.max(this.levelW, this.vw);
    this.boundH = Math.max(this.levelH, this.vh);

    this.layers = [];
    this.player = null;
    this.physics = null;
    this.gravity = null;
    this.collision = null;
    this.collisionGrid = null;

    this.mode = Config.PHYSICS?.MODE ?? "platformer";
    this.pathBase = Config.WORLD?.PATH_BASE ?? "Tilemap";
  }

  async load() {
    await Promise.all(
      (this.tilemap.layers || []).map(async (info) => {
        const base = `${this.pathBase}/${this.tilemap.name}/${info.name.toLowerCase()}`;
        const L = new Layering(info.name, base, this.tileset, this.image, this.glRenderer);
        await L.loadChunks(info.chunks);
        this.layers.push(L);
      })
    );

    if (Config.WORLD?.AUTO_SIZE) await this.#recalcBoundsFromMetaChunks();
    await this.#initWorld();
  }

  update(dt) {
    if (!this.player || !isFinite(dt) || dt <= 0) return;

    // 1) Simpan posisi sebelumnya (untuk interpolasi render)
    this.player.prevX = this.player.x; this.player.prevY = this.player.y;
    this.camera.prevX = this.camera.x; this.camera.prevY = this.camera.y;

    // 2) Input → update intent/gerakan pemain
    this.input.beginFrame();
    this.player.update(dt, this.input, this.mode);

    // 3) Physics: terapkan gaya → update kecepatan
    this.physics.step(dt);

    // 4) Collision: gerakkan & resolve terhadap tile grid
    const wasGrounded = this.player.grounded;
    this.collision.moveBody(this.player, dt);

    // 5) Snap vertikal saat grounded biar pixel-perfect di tepi tile
    if (this.player.grounded) {
      const t = this.tilePx;
      const py = Math.floor((this.player.y + this.player.height) / t);
      this.player.y = py * t - this.player.height;
    }

    // 6) Event pendaratan: izinkan loncat lagi setelah menyentuh tanah
    const landed = (!wasGrounded && this.player.grounded);
    this.player.postCollisionJump(this.input, landed);

    // 7) Clamp posisi ke batas world (dengan opsi pixel-lock)
    const maxPX = Math.max(0, (this.boundW | 0) - this.player.width);
    const maxPY = Math.max(0, (this.boundH | 0) - this.player.height);
    this.player.x = this.#lockClamp(this.player.x, 0, maxPX);
    this.player.y = this.#lockClamp(this.player.y, 0, maxPY);

    // 8) Kamera follow + lerp + margin bawah minimal (tile)
    this.#updateCamera(dt);
  }

  render(alpha) {
    const camX = this.camera.prevX + (this.camera.x - this.camera.prevX) * alpha;
    const camY = this.camera.prevY + (this.camera.y - this.camera.prevY) * alpha;
    const proj = this.glRenderer.getWorldProjection(camX, camY);
    for (const L of this.layers) L.render(camX, camY, proj);
    this.player?.render(this.glRenderer, proj, alpha);
  }

  async #initWorld() {
    const poly = new Polygon(this.glContext);
    const bmp = await poly.createRect(Config.PLAYER.WIDTH, Config.PLAYER.HEIGHT, "#2196F3");
    const img = this.image.cloneEmpty(this.glContext);
    await img.loadFromBitmap(bmp);

    const start = Config.PLAYER?.START_POS ?? { X: 100, Y: 1000 };
    this.player = new Player(img, start.X, start.Y);
    this.player.prevX = start.X; this.player.prevY = start.Y;

    this.collisionGrid = await CollisionGrid.fromTilemap(
      this.tilemap, decodeRLE, this.tilePx, NAME_RE, this.pathBase
    );

    this.physics = new Physics({ mode: this.mode });
    this.gravity = new Gravity({ gy: Config.PHYSICS.GRAVITY });
    this.physics.addForce(this.gravity);
    this.physics.addBody(this.player, {
      mass: 1,
      damping: Config.PHYSICS.FRICTION,
      useGravity: this.mode === "platformer",
      maxFallSpeed: Config.PHYSICS.MAX_VELOCITY_Y
    });

    this.collision = new CollisionSystem(this.collisionGrid, this.mode);
  }

  async #recalcBoundsFromMetaChunks() {
    const tpx = this.tilePx;
    const metaW = this.tilemap?.width | 0;
    const metaH = this.tilemap?.height | 0;

    if (metaW > 0 && metaH > 0) {
      this.levelW = metaW * tpx;
      this.levelH = metaH * tpx;
      this.boundW = Math.max(this.levelW, this.vw);
      this.boundH = Math.max(this.levelH, this.vh);
      return;
    }

    const { cw, ch } = await this.#inferChunkSize();
    let minCX = Infinity, minCY = Infinity, maxCX = -Infinity, maxCY = -Infinity;

    for (const L of (this.tilemap?.layers || [])) {
      for (const c of (L?.chunks || [])) {
        const cx = c.x | 0, cy = c.y | 0;
        if (cx < minCX) minCX = cx;
        if (cy < minCY) minCY = cy;
        if (cx > maxCX) maxCX = cx;
        if (cy > maxCY) maxCY = cy;
      }
    }

    if (!isFinite(minCX)) {
      this.levelW = Config.WORLD?.WIDTH ?? this.vw;
      this.levelH = Config.WORLD?.HEIGHT ?? this.vh;
    } else {
      const tilesW = (maxCX - minCX + 1) * cw;
      const tilesH = (maxCY - minCY + 1) * ch;
      this.levelW = tilesW * tpx;
      this.levelH = tilesH * tpx;
    }

    this.boundW = Math.max(this.levelW, this.vw);
    this.boundH = Math.max(this.levelH, this.vh);
  }

  async #inferChunkSize() {
    let cw = this.tilemap?.chunkWidth | 0;
    let ch = this.tilemap?.chunkHeight | 0;
    if (cw > 0 && ch > 0) return { cw, ch };

    for (const L of (this.tilemap?.layers || [])) {
      const first = (L?.chunks || [])[0];
      if (!first) continue;
      const base = `${this.pathBase}/${this.tilemap.name}/${L.name.toLowerCase()}`;
      try {
        const j = await (await fetch(`${base}/${first.path}`)).json();
        const w = j?.width | 0, h = j?.height | 0;
        if (w > 0 && h > 0) return { cw: w, ch: h };
      } catch {}
    }

    const sz = Config.WORLD?.CHUNK_SIZE ?? 16;
    return { cw: sz, ch: sz };
  }

  #updateCamera(dt) {
    const gl = this.glRenderer?.gl;
    const viewW = gl?.canvas?.width ?? this.vw;
    const viewH = gl?.canvas?.height ?? this.vh;

    const pCX = this.player.x + this.player.width * 0.5;
    const pCY = this.player.y + this.player.height * 0.5;

    let tx = clamp(pCX - viewW * 0.5, 0, Math.max(0, this.levelW - viewW));
    let ty = clamp(pCY - viewH * 0.5, 0, Math.max(0, this.levelH - viewH));

    const minTiles = (Config.CAMERA?.MIN_BOTTOM_TILES ?? 8) | 0;
    const pb = this.player.y + this.player.height;
    const bottomScreen = ty + viewH;
    const tilesBelow = Math.floor((bottomScreen - pb) / this.tilePx);
    if (tilesBelow < minTiles) ty = Math.min(ty + (minTiles - tilesBelow) * this.tilePx, Math.max(0, this.levelH - viewH));

    const k = this.camLerp * dt;
    const nx = this.camera.x + (tx - this.camera.x) * k;
    const ny = this.camera.y + (ty - this.camera.y) * k;

    this.camera.x = this.pixelLock ? Math.round(nx) : nx;
    this.camera.y = this.pixelLock ? Math.round(ny) : ny;
  }

  #lockClamp(v, a, b) {
    return this.pixelLock ? clamp(Math.round(v), a, b) : clamp(v, a, b);
  }
}
