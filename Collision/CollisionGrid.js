// /Collision/CollisionGrid.js
const EPS = 0.0001;
const NAME_RE = /(solid|wall|terrain|ground|collid)/i;

export default class CollisionGrid {
  constructor(tileSizePx, widthTiles, heightTiles) {
    this.tile = tileSizePx | 0;
    this.wt = widthTiles | 0;
    this.ht = heightTiles | 0;
    this.bits = new Uint8Array(this.wt * this.ht); // 0/1 solid
  }

  index(tx, ty) { return ty * this.wt + tx; }
  inBounds(tx, ty) { return tx >= 0 && ty >= 0 && tx < this.wt && ty < this.ht; }

  setSolid(tx, ty, v = 1) {
    if (this.inBounds(tx, ty)) this.bits[this.index(tx, ty)] = v ? 1 : 0;
  }

  isSolid(tx, ty) {
    if (!this.inBounds(tx, ty)) return false;
    return this.bits[this.index(tx, ty)] === 1;
  }

  tilesForRect(x, y, w, h) {
    const t = this.tile;
    const left   = Math.floor((x + EPS) / t);
    const right  = Math.floor((x + w - EPS) / t);
    const top    = Math.floor((y + EPS) / t);
    const bottom = Math.floor((y + h - EPS) / t);
    return { left, right, top, bottom };
  }

  // Resolusi axis-terpisah: move X lalu Y (sturdy untuk platformer)
  moveAABB(x, y, w, h, dx, dy) {
    let nx = x, ny = y;
    let hitL = false, hitR = false, hitT = false, hitB = false;
    const t = this.tile;

    // --- Gerak X ---
    if (dx !== 0) {
      const dir = Math.sign(dx);
      let target = nx + dx;

      if (dir > 0) {
        const edgeStart = Math.floor((nx + w - EPS) / t);
        const edgeEnd   = Math.floor((target + w - EPS) / t);
        const { top, bottom } = this.tilesForRect(nx, ny, w, h);
        for (let cx = edgeStart; cx <= edgeEnd; cx++) {
          for (let cy = top; cy <= bottom; cy++) {
            if (this.isSolid(cx, cy)) {
              target = Math.min(target, cx * t - w);
              hitR = true;
              break;
            }
          }
          if (hitR) break;
        }
      } else {
        const edgeStart = Math.floor((nx + EPS) / t);
        const edgeEnd   = Math.floor((target + EPS) / t);
        const { top, bottom } = this.tilesForRect(nx, ny, w, h);
        for (let cx = edgeStart; cx >= edgeEnd; cx--) {
          for (let cy = top; cy <= bottom; cy++) {
            if (this.isSolid(cx, cy)) {
              target = Math.max(target, (cx + 1) * t);
              hitL = true;
              break;
            }
          }
          if (hitL) break;
        }
      }
      nx = target;
    }

    // --- Gerak Y ---
    if (dy !== 0) {
      const dir = Math.sign(dy);
      let target = ny + dy;

      if (dir > 0) {
        const edgeStart = Math.floor((ny + h - EPS) / t);
        const edgeEnd   = Math.floor((target + h - EPS) / t);
        const { left, right } = this.tilesForRect(nx, ny, w, h);
        for (let cy = edgeStart; cy <= edgeEnd; cy++) {
          for (let cx = left; cx <= right; cx++) {
            if (this.isSolid(cx, cy)) {
              target = Math.min(target, cy * t - h);
              hitB = true;
              break;
            }
          }
          if (hitB) break;
        }
      } else {
        const edgeStart = Math.floor((ny + EPS) / t);
        const edgeEnd   = Math.floor((target + EPS) / t);
        const { left, right } = this.tilesForRect(nx, ny, w, h);
        for (let cy = edgeStart; cy >= edgeEnd; cy--) {
          for (let cx = left; cx <= right; cx++) {
            if (this.isSolid(cx, cy)) {
              target = Math.max(target, (cy + 1) * t);
              hitT = true;
              break;
            }
          }
          if (hitT) break;
        }
      }
      ny = target;
    }

    return { x: nx, y: ny, hitLeft: hitL, hitRight: hitR, hitTop: hitT, hitBottom: hitB };
  }

  // Bangun grid dari tilemap/chunk RLE (pilih layer yang bernuansa "solid/wall/terrain...")
  static async fromTilemap(tilemap, decodeRLE, tilePx, layerNameRegex = NAME_RE) {
    const wt = tilemap.width  ?? 0;
    const ht = tilemap.height ?? 0;
    const grid = new CollisionGrid(tilePx, wt, ht);

    for (const L of tilemap.layers) {
      if (!layerNameRegex.test(L.name)) continue; // lewati dekorasi/background
      const base = `Tilemap/${tilemap.name}/${L.name.toLowerCase()}`;
      for (const c of L.chunks) {
        try {
          const j = await (await fetch(`${base}/${c.path}`)).json();
          const w = j?.width ?? 16, h = j?.height ?? 16;
          const rle = j?.rleData;
          if (!Array.isArray(rle)) continue;

          const arr = decodeRLE(rle, w, h);
          for (let y = 0; y < h; y++) {
            const row = arr[y];
            for (let x = 0; x < w; x++) {
              if (row[x]) {
                const tx = c.x * w + x;
                const ty = c.y * h + y;
                grid.setSolid(tx, ty, 1);
              }
            }
          }
        } catch (e) {
          console.warn("[CollisionGrid] chunk load fail:", L.name, c, e);
        }
      }
    }
    return grid;
  }
}
