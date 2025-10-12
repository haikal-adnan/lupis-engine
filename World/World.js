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
const NAME_RE = /(solid|wall|terrain|ground|collid)/i;

export default class World {
  constructor(tilemap, tileset, image, glRenderer, glContext, input) {
    Object.assign(this, { tilemap, tileset, image, glRenderer, glContext, input });

    // ===== CONFIG SNAPSHOT =====
    this.vw = Config.VIRTUAL_WIDTH;
    this.vh = Config.VIRTUAL_HEIGHT;
    this.scale  = Config.SCALE;
    this.tilePx = Config.PX_TILE;


    const C = Config.CAMERA ?? {};
    this.camera = new Camera2D(0, 0);
    this.camera.prevX = 0;
    this.camera.prevY = 0;

    this.deadX = C.DEADZONE_X ?? [0.5, 0.5];
    this.deadY = C.DEADZONE_Y ?? [0.5, 0.5];
    this.camLerp   = C.LERP ?? 6.0;
    this.pixelLock = (C.PIXEL_LOCK ?? false) && (Config.PIXEL_ART ?? false);
    this._camSnapped = false;

    this.levelW = Config.WORLD?.WIDTH  ?? this.vw;
    this.levelH = Config.WORLD?.HEIGHT ?? this.vh;
    this.boundW = Math.max(this.levelW, this.vw);
    this.boundH = Math.max(this.levelH, this.vh);

    this.layers = [];
    this.player = null;

    this.physics   = null;
    this.gravity   = null;
    this.collision = null;
    this.collisionGrid = null;

    this.mode = Config.PHYSICS?.MODE ?? "platformer";
    this.pathBase = Config.WORLD?.PATH_BASE ?? "Tilemap";
  }

  // ===== LOAD WORLD =====
  async load() {
    await Promise.all(
      this.tilemap.layers.map(async (info) => {
        const base = `${this.pathBase}/${this.tilemap.name}/${info.name.toLowerCase()}`;
        const layer = new Layering(info.name, base, this.tileset, this.image, this.glRenderer);
        await layer.loadChunks(info.chunks);
        this.layers.push(layer);
      })
    );

    await this.#recalcBoundsFromContent();
    await this.#initWorld();
  }

  // ===== MAIN UPDATE =====
  update(dt) {
    if (!this.player || !isFinite(dt) || dt <= 0) return;

    // === PREV FRAME SNAPSHOT ===
    this.player.prevX = this.player.x;
    this.player.prevY = this.player.y;
    this.camera.prevX = this.camera.x;
    this.camera.prevY = this.camera.y;

    // === INPUT HANDLING ===
    this.input.beginFrame();
    this.player.update(dt, this.input, this.mode);

    // === PHYSICS + COLLISION ===
    const wasGrounded = this.player.grounded;
    this.physics.step(dt);
    this.collision.moveBody(this.player, dt);

    // === SNAP TO GRID IF GROUNDED ===
    if (this.player.grounded) {
      const t = this.tilePx;
      const py = Math.floor((this.player.y + this.player.height) / t);
      this.player.y = py * t - this.player.height;
    }

    // === JUMP AFTER COLLISION ===
    const landed = (!wasGrounded && this.player.grounded);
    this.player.postCollisionJump(this.input, landed);

    // === CLAMP PLAYER TO LEVEL BOUNDARIES ===
    const maxPX = Math.max(0, (this.boundW | 0) - this.player.width);
    const maxPY = Math.max(0, (this.boundH | 0) - this.player.height);
    this.player.x = this.#lockClamp(this.player.x, 0, maxPX);
    this.player.y = this.#lockClamp(this.player.y, 0, maxPY);

    // === DEBUG TILE INFO ===
    {
      const t = this.tilePx;
      const tx = Math.floor((this.player.x + this.player.width * 0.5) / t);
      const ty = Math.floor((this.player.y + this.player.height - 1) / t);
      console.log(`[Player Tile] tx=${tx}, ty=${ty}, pos=(${this.player.x.toFixed(2)}, ${this.player.y.toFixed(2)})`);
    }

    // === CAMERA FOLLOW ===
    this.#updateCamera(dt);
  }

  // ===== RENDER =====
  render(alpha) {
    const camX = this.camera.prevX + (this.camera.x - this.camera.prevX) * alpha;
    const camY = this.camera.prevY + (this.camera.y - this.camera.prevY) * alpha;
    const proj = this.glRenderer.getWorldProjection(camX, camY);

    for (const L of this.layers) L.render(camX, camY, proj);
    this.player?.render(this.glRenderer, proj, alpha);
  }

  // ===== PRIVATE INIT WORLD =====
  async #initWorld() {
    // === PLAYER RECTANGLE (DEBUG ENTITY) ===
    const poly = new Polygon(this.glContext);
    const bmp  = await poly.createRect(Config.PLAYER.WIDTH, Config.PLAYER.HEIGHT, "#2196F3");
    const img  = this.image.cloneEmpty(this.glContext);
    await img.loadFromBitmap(bmp);

    const start = Config.PLAYER?.START_POS ?? { X: 100, Y: 1000 };
    this.player = new Player(img, start.X, start.Y);
    this.player.prevX = start.X;
    this.player.prevY = start.Y;

    // === COLLISION GRID ===
    this.collisionGrid = await CollisionGrid.fromTilemap(
      this.tilemap, decodeRLE, this.tilePx,
      NAME_RE, this.pathBase
    );

    // === PHYSICS + GRAVITY ===
    this.physics = new Physics({ mode: this.mode });
    this.gravity = new Gravity({ gy: Config.PHYSICS.GRAVITY });
    this.physics.addForce(this.gravity);
    this.physics.addBody(this.player, {
      mass: 1,
      damping: Config.PHYSICS.FRICTION,
      useGravity: this.mode === "platformer",
      maxFallSpeed: Config.PHYSICS.MAX_VELOCITY_Y
    });

    // === COLLISION SYSTEM ===
    this.collision = new CollisionSystem(this.collisionGrid, this.mode);
  }

  // ===== RECALCULATE LEVEL BOUNDS =====
  async #recalcBoundsFromContent() {
    const cw = this.tilemap.chunkWidth  ?? Config.WORLD.CHUNK_SIZE;
    const ch = this.tilemap.chunkHeight ?? Config.WORLD.CHUNK_SIZE;
    let occMaxX = -1, occMaxY = -1;

    for (const L of this.tilemap.layers) {
      const base = `${this.pathBase}/${this.tilemap.name}/${L.name.toLowerCase()}`;
      for (const c of L.chunks) {
        try {
          const j = await (await fetch(`${base}/${c.path}`)).json();
          const w = j?.width ?? cw, h = j?.height ?? ch;
          const rle = j?.rleData; if (!Array.isArray(rle)) continue;
          const grid = decodeRLE(rle, w, h);
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              if (!grid[y][x]) continue;
              const gx = c.x * w + x;
              const gy = c.y * h + y;
              if (gx > occMaxX) occMaxX = gx;
              if (gy > occMaxY) occMaxY = gy;
            }
          }
        } catch {}
      }
    }

    const metaW  = this.tilemap.width  ?? Math.ceil(Config.WORLD.WIDTH  / this.tilePx);
    const metaH  = this.tilemap.height ?? Math.ceil(Config.WORLD.HEIGHT / this.tilePx);
    const tilesW = occMaxX >= 0 ? occMaxX + 1 : metaW;
    const tilesH = occMaxY >= 0 ? occMaxY + 1 : metaH;

    this.levelW = tilesW * this.tilePx;
    this.levelH = tilesH * this.tilePx;

    const guardX = Math.max(0, Math.ceil((this.levelW - this.vw) / 2));
    const guardY = Math.max(0, Math.ceil((this.levelH - this.vh) / 2));

    this.boundW = Math.max(this.vw, this.levelW - guardX);
    this.boundH = Math.max(this.vh, this.levelH - guardY);
  }

  // ===== CAMERA FOLLOW =====
  #updateCamera(dt) {
    const gl = this.glRenderer?.gl;
    const viewW = gl?.canvas?.width  ?? this.vw;
    const viewH = gl?.canvas?.height ?? this.vh;

    const pw = this.player.width;
    const ph = this.player.height;

    // posisi tengah player (world)
    const pCX = this.player.x + pw * 0.5;
    const pCY = this.player.y + ph * 0.5;

    // target kamera supaya player di tengah
    let tx = pCX - viewW * 0.5;
    let ty = pCY - viewH * 0.5;

    // jaga batas world
    const maxCamX = Math.max(0, this.levelW - viewW);
    const maxCamY = Math.max(0, this.levelH - viewH);
    tx = Math.max(0, Math.min(tx, maxCamX));
    ty = Math.max(0, Math.min(ty, maxCamY));

    // ===== tambahkan margin bawah minimal N tile =====
    const minTiles = (Config.CAMERA?.MIN_BOTTOM_TILES ?? 8) | 0;
    const t = this.tilePx;
    const pb = this.player.y + ph;
    const bottomScreen = ty + viewH;
    const tilesBelow = Math.floor((bottomScreen - pb) / t);
    if (tilesBelow < minTiles) ty += (minTiles - tilesBelow) * t;
    ty = Math.min(ty, maxCamY);
    // =================================================

    // LERP halus
    const k = this.camLerp * dt;
    const nx = this.camera.x + (tx - this.camera.x) * k;
    const ny = this.camera.y + (ty - this.camera.y) * k;

    this.camera.x = this.pixelLock ? Math.round(nx) : nx;
    this.camera.y = this.pixelLock ? Math.round(ny) : ny;
  }


  // ===== HELPER =====
  #lockClamp(v, a, b) {
    return this.pixelLock ? clamp(Math.round(v), a, b) : clamp(v, a, b);
  }
}