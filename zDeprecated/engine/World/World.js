import Layering from "../Layering/Layering.js";
import Camera2D from "../Camera/Camera2D.js";
import Player from "../Entity/Player.js";
import Polygon from "../Entity/Polygon.js";
import Config from "../Config/Config.js";
import { decodeRLE } from "../Util/RLE.js";
import CollisionSystem from "../Collision/CollisionSystem.js";
import CollisionGrid from "../Collision/CollisionGrid.js";
import GLImage from "../Renderer/GLImage.js";
import { game } from "../main.js";

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export default class World {
  constructor(tilemap, tileset, image, glRenderer, glContext, input) {
    Object.assign(this, { tilemap, tileset, image, glRenderer, glContext, input });

    this.vw = Config.VIRTUAL_WIDTH;
    this.vh = Config.VIRTUAL_HEIGHT;
    this.tilePx = Config.PX_TILE;

    this.mode = Config.PHYSICS.MODE;
    this.pathBase = Config.WORLD.PATH_BASE;

    const C = Config.CAMERA;
    this.camera = new Camera2D(0, 0);
    this.camera.prevX = 0;
    this.camera.prevY = 0;
    this.camLerp = C.LERP;
    this.pixelLock = C.PIXEL_LOCK && Config.PIXEL_ART;

    this.levelW = Config.WORLD.WIDTH;
    this.levelH = Config.WORLD.HEIGHT;
    this.boundW = Math.max(this.levelW, this.vw);
    this.boundH = Math.max(this.levelH, this.vh);
    this.layers = [];

    this.player = null;
    this.physics = null;
    this.gravity = null;
    this.collision = null;
    this.collisionGrid = null;
  }

  async load() {
    const layers = this.tilemap?.layers || [];
    const tilesetMap = {};
    const imageMap = {};

    for (const t of (Config.TILESETS || [])) {
      const name = String(t.name);
      if (this.tileset?.[name]) tilesetMap[name] = this.tileset[name];
      else if (name === "terrain" && this.tileset) tilesetMap[name] = this.tileset;
      if (this.image?.[name]) imageMap[name] = this.image[name];
      else if (name === "terrain" && this.image) imageMap[name] = this.image;
    }

    await Promise.all(
      layers.map(async (info) => {
        const L = new Layering(game.project, game.level, info.name, tilesetMap, imageMap, this.glRenderer);
        await L.loadChunks(info.chunks);
        this.layers.push(L);
      })
    );

    if (Config.WORLD.AUTO_SIZE) await this.#recalcBoundsFromMetaChunks();
    await this.#initWorld();
  }

  update(dt) {
    if (!this.player || !isFinite(dt) || dt <= 0) return;

    this.player.prevX = this.player.x;
    this.player.prevY = this.player.y;
    this.camera.prevX = this.camera.x;
    this.camera.prevY = this.camera.y;

    this.input.beginFrame();
    this.player.update(dt, this.input, this.mode);
    this.physics?.step(dt);

    const wasGrounded = this.player.grounded;
    this.collision?.moveBody(this.player, dt);

    if (this.player.grounded) {
      const t = this.tilePx;
      const py = Math.floor((this.player.y + this.player.height) / t);
      this.player.y = py * t - this.player.height;
    }

    const landed = (!wasGrounded && this.player.grounded);
    this.player.postCollisionJump(this.input, landed);

    const maxPX = Math.max(0, this.boundW - this.player.width);
    const maxPY = Math.max(0, this.boundH - this.player.height);
    this.player.x = this.#lockClamp(this.player.x, 0, maxPX);
    this.player.y = this.#lockClamp(this.player.y, 0, maxPY);

    this.#updateCamera(dt);
  }

  render(alpha) {
    const useStrict = this.pixelLock === true;
    const a = useStrict ? 1 : alpha;

    const camX = useStrict
      ? Math.round(this.camera.x)
      : this.camera.prevX + (this.camera.x - this.camera.prevX) * a;

    const camY = useStrict
      ? Math.round(this.camera.y)
      : this.camera.prevY + (this.camera.y - this.camera.prevY) * a;

    const proj = this.glRenderer.getWorldProjection(camX, camY);

    for (const L of this.layers) L.render(camX, camY, proj);
    this.player?.render(this.glRenderer, proj, a, useStrict);
  }

  async #initWorld() {
    const poly = new Polygon(this.glContext);
    const bmp = await poly.createRect(Config.PLAYER.WIDTH, Config.PLAYER.HEIGHT, "#2196F3");
    const img = new GLImage(this.glContext);
    await img.loadFromBitmap(bmp);

    const startX = Config.PLAYER.X;
    const startY = Config.PLAYER.Y;
    this.player = new Player(img, startX, startY);
    this.player.prevX = startX;
    this.player.prevY = startY;

    const regex = new RegExp(Config.WORLD.SOLID_LAYER_REGEX, "i");
    if (this.tilemap?.layers?.length) {
      this.collisionGrid = await CollisionGrid.fromTilemap(
        game.project, game.level, this.tilemap, decodeRLE, this.tilePx, regex
      );
    }

    if (this.collisionGrid && this.player) {
      this.collision = new CollisionSystem(this.collisionGrid, this.mode);
    }
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
      this.levelW = Config.WORLD.WIDTH;
      this.levelH = Config.WORLD.HEIGHT;
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
    const sz = Config.WORLD.CHUNK_SIZE;
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

    const minTiles = Config.CAMERA.MIN_BOTTOM_TILES;
    const pb = this.player.y + this.player.height;
    const bottomScreen = ty + viewH;
    const tilesBelow = Math.floor((bottomScreen - pb) / this.tilePx);
    if (tilesBelow < minTiles) {
      ty = Math.min(ty + (minTiles - tilesBelow) * this.tilePx, Math.max(0, this.levelH - viewH));
    }

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
