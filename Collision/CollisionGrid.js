const LAYER_RE_DEFAULT = /(solid|wall|terrain|ground|collid)/i;


export default class CollisionGrid {
  constructor(tilePx, widthTiles, heightTiles) {
    this.t = tilePx | 0;
    this.wt = widthTiles | 0;
    this.ht = heightTiles | 0;
    this.bits = new Uint8Array(this.wt * this.ht); // 0/1
  }

  index(tx, ty) { return ty * this.wt + tx; }
  inBounds(tx, ty) { return tx >= 0 && ty >= 0 && tx < this.wt && ty < this.ht; }
  setSolid(tx, ty, v = 1) { if (this.inBounds(tx, ty)) this.bits[this.index(tx, ty)] = v ? 1 : 0; }
  isSolid(tx, ty) { return this.inBounds(tx, ty) && this.bits[this.index(tx, ty)] === 1; }

  spanX(x, w) {
    const t = this.t;
    const left  = Math.floor(x / t);
    const right = Math.ceil((x + w) / t) - 1;
    return { left, right };
  }
  spanY(y, h) {
    const t = this.t;
    const top    = Math.floor(y / t);
    const bottom = Math.ceil((y + h) / t) - 1;
    return { top, bottom };
  }

  sweepX(x, y, w, h, dx) {
    if (dx === 0) return { x, hitLeft: false, hitRight: false };
    const t = this.t;
    const { top, bottom } = this.spanY(y, h);

    if (dx > 0) {
      const a = x + w;
      const startCol = Number.isInteger(a / t) ? (a / t) : Math.floor(a / t) + 1;
      const endCol   = Math.floor((x + w + dx) / t);
      let target = x + dx, hit = false;

      for (let col = startCol; col <= endCol && !hit; col++) {
        for (let row = top; row <= bottom; row++) {
          if (this.isSolid(col, row)) {
            target = col * t - w;
            hit = true; break;
          }
        }
      }
      return { x: hit ? target : x + dx, hitLeft: false, hitRight: hit };
    } else {
      const a = x;
      const startCol = Number.isInteger(a / t) ? (a / t) - 1 : Math.floor(a / t);
      const endCol   = Math.floor((x + dx) / t);
      let target = x + dx, hit = false;

      for (let col = startCol; col >= endCol && !hit; col--) {
        for (let row = top; row <= bottom; row++) {
          if (this.isSolid(col, row)) {
            target = (col + 1) * t;
            hit = true; break;
          }
        }
      }
      return { x: hit ? target : x + dx, hitLeft: hit, hitRight: false };
    }
  }

  sweepY(nx, y, w, h, dy) {
    if (dy === 0) return { y, hitTop: false, hitBottom: false };
    const t = this.t;
    const { left, right } = this.spanX(nx, w);

    if (dy > 0) {
      const a = y + h;
      const startRow = Number.isInteger(a / t) ? (a / t) : Math.floor(a / t) + 1;
      const endRow   = Math.floor((y + h + dy) / t);
      let target = y + dy, hit = false;

      for (let row = startRow; row <= endRow && !hit; row++) {
        for (let col = left; col <= right; col++) {
          if (this.isSolid(col, row)) {
            target = row * t - h;
            hit = true; break;
          }
        }
      }
      return { y: hit ? target : y + dy, hitTop: false, hitBottom: hit };
    } else {
      const a = y;
      const startRow = Number.isInteger(a / t) ? (a / t) - 1 : Math.floor(a / t);
      const endRow   = Math.floor((y + dy) / t);
      let target = y + dy, hit = false;

      for (let row = startRow; row >= endRow && !hit; row--) {
        for (let col = left; col <= right; col++) {
          if (this.isSolid(col, row)) {
            target = (row + 1) * t;
            hit = true; break;
          }
        }
      }
      return { y: hit ? target : y + dy, hitTop: hit, hitBottom: false };
    }
  }

  moveAABB(x, y, w, h, dx, dy) {
    const sx = this.sweepX(x, y, w, h, dx);
    const sy = this.sweepY(sx.x, y, w, h, dy);
    return {
      x: sx.x,
      y: sy.y,
      hitLeft:  sx.hitLeft,
      hitRight: sx.hitRight,
      hitTop:   sy.hitTop,
      hitBottom: sy.hitBottom,
    };
  }

  static async fromTilemap(tilemap, decodeRLE, tilePx, layerRegex = LAYER_RE_DEFAULT, pathBase = "Tilemap") {
    const wt = (tilemap?.width  | 0) || 0;
    const ht = (tilemap?.height | 0) || 0;
    const grid = new CollisionGrid(tilePx, wt, ht);
    const cw = tilemap?.chunkWidth  | 0;
    const ch = tilemap?.chunkHeight | 0;

    for (const L of tilemap.layers) {
      if (!layerRegex.test(L.name)) continue;
      const base = `${pathBase}/${tilemap.name}/${L.name.toLowerCase()}`;
      for (const c of L.chunks) {
        try {
          const j  = await (await fetch(`${base}/${c.path}`)).json();
          const w  = (j?.width  | 0) || cw || 16;
          const h  = (j?.height | 0) || ch || 16;
          const arr = Array.isArray(j?.rleData) ? decodeRLE(j.rleData, w, h)
                     : Array.isArray(j?.data)   ? j.data
                     : null;
          if (!arr) continue;

          const ox = (c.x | 0) * w;
          const oy = (c.y | 0) * h;
          for (let yy = 0; yy < h; yy++) {
            for (let xx = 0; xx < w; xx++) {
              if (!arr[yy][xx]) continue;
              grid.setSolid(ox + xx, oy + yy, 1);
            }
          }
        } catch (e) {
          console.warn("[CollisionGrid] gagal muat chunk:", L.name, c, e);
        }
      }
    }
    return grid;
  }
}
