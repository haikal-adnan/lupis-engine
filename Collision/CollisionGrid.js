// /Collision/CollisionGrid.js
const EPS = 1e-4;
const NAME_RE = /(solid|wall|terrain|ground|collid)/i;

export default class CollisionGrid {
  constructor(tileSizePx, widthTiles, heightTiles) {
    this.tile = tileSizePx | 0;
    this.wt = widthTiles | 0;
    this.ht = heightTiles | 0;
    this.bits = new Uint8Array(this.wt * this.ht);
    this.SKIN  = Math.max(0.5, this.tile * 0.02);
    this.NUDGE = Math.max(0.01, this.tile * 0.001);
  }

  index(tx, ty) { return ty * this.wt + tx; }
  inBounds(tx, ty) { return tx >= 0 && ty >= 0 && tx < this.wt && ty < this.ht; }
  setSolid(tx, ty, v = 1) { if (this.inBounds(tx, ty)) this.bits[this.index(tx, ty)] = v ? 1 : 0; }
  isSolid(tx, ty) { return this.inBounds(tx, ty) && this.bits[this.index(tx, ty)] === 1; }

  tilesForRect(x, y, w, h, s = 0) {
    const t = this.tile, k = Math.max(0, s);
    return {
      left:   Math.floor((x + k)     / t),
      right:  Math.floor((x + w - k) / t),
      top:    Math.floor((y + k)     / t),
      bottom: Math.floor((y + h - k) / t),
    };
  }

  // sweep generik 1D (axis: 'x' | 'y')
  #sweep(pos, oth, size, span, d, axis) {
    if (!d) return { pos, hitL: false, hitR: false, hitT: false, hitB: false };
    const t = this.tile, dir = Math.sign(d), SKIN = this.SKIN, NUDGE = this.NUDGE;
    const offA = dir > 0 ? size - EPS : EPS;
    const a0 = Math.floor((pos + offA)      / t);
    const a1 = Math.floor((pos + d + offA)  / t);
    const step = dir > 0 ? 1 : -1;
    let target = pos + d, hit = false;

    if (axis === "x") {
      const { top, bottom } = this.tilesForRect(pos, oth, size, span, SKIN);
      for (let cx = a0; !hit && (step > 0 ? cx <= a1 : cx >= a1); cx += step) {
        for (let cy = top; cy <= bottom; cy++) if (this.isSolid(cx, cy)) {
          target = dir > 0 ? Math.min(target, cx * t - size) : Math.max(target, (cx + 1) * t);
          hit = true; break;
        }
      }
      if (hit) target += dir > 0 ? -NUDGE : +NUDGE;
      return { pos: target, hitL: dir < 0 && hit, hitR: dir > 0 && hit, hitT: false, hitB: false };
    } else {
      const { left, right } = this.tilesForRect(oth, pos, span, size, SKIN);
      for (let cy = a0; !hit && (step > 0 ? cy <= a1 : cy >= a1); cy += step) {
        for (let cx = left; cx <= right; cx++) if (this.isSolid(cx, cy)) {
          target = dir > 0 ? Math.min(target, cy * t - size) : Math.max(target, (cy + 1) * t);
          hit = true; break;
        }
      }
      if (hit) target += dir > 0 ? -NUDGE : +NUDGE;
      return { pos: target, hitL: false, hitR: false, hitT: dir < 0 && hit, hitB: dir > 0 && hit };
    }
  }

  moveAABB(x, y, w, h, dx, dy) {
    let r = this.#sweep(x, y, w, h, dx, "x");
    const nx = Math.round(r.pos * 1000) / 1000;

    let r2 = this.#sweep(y, nx, h, w, dy, "y");
    const ny = Math.round(r2.pos * 1000) / 1000;

    return {
      x: nx, y: ny,
      hitLeft:   r.hitL,
      hitRight:  r.hitR,
      hitTop:    r2.hitT,
      hitBottom: r2.hitB,
    };
  }

  static async fromTilemap(tilemap, decodeRLE, tilePx, layerNameRegex = NAME_RE, pathBase = "Tilemap") {
    const cached = [];
    for (const L of tilemap.layers) {
      if (!layerNameRegex.test(L.name)) continue;
      const base = `${pathBase}/${tilemap.name}/${L.name.toLowerCase()}`;
      for (const c of L.chunks) {
        try {
          const j = await (await fetch(`${base}/${c.path}`)).json();
          const w = j?.width ?? 16, h = j?.height ?? 16;
          const arr = Array.isArray(j?.rleData) ? decodeRLE(j.rleData, w, h) : null;
          if (arr) cached.push({ arr, w, h, cx: c.x, cy: c.y });
        } catch {}
      }
    }

    const guess = (mul) => {
      let mx = -1, my = -1;
      for (const { w, h, cx, cy } of cached) {
        const bx = mul ? cx * w : cx, by = mul ? cy * h : cy;
        mx = Math.max(mx, bx + (w - 1)); my = Math.max(my, by + (h - 1));
      }
      return { wt: mx + 1, ht: my + 1 };
    };

    const wt = (tilemap.width  ?? 0) || guess(true).wt;
    const ht = (tilemap.height ?? 0) || guess(true).ht;
    const grid = new CollisionGrid(tilePx, wt | 0, ht | 0);

    // pilih skema index chunk: mul(c*w) vs add(c)
    let sm = 0, sa = 0;
    for (const { arr, w, h, cx, cy } of cached) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (!arr[y][x]) continue;
          const xm = cx * w + x, ym = cy * h + y;
          const xa = cx + x,     ya = cy + y;
          if (xm >= 0 && xm < grid.wt && ym >= 0 && ym < grid.ht) sm++;
          if (xa >= 0 && xa < grid.wt && ya >= 0 && ya < grid.ht) sa++;
        }
      }
    }
    const useMul = sm >= sa;

    // isi grid + auto-offset leading empty rows per chunk
    let solidCount = 0;
    const firstSolidRow = (arr, w, h) => {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (arr[y][x] !== 0) return y;
      return 0;
    };

    for (const { arr, w, h, cx, cy } of cached) {
      const baseX = useMul ? cx * w : cx;
      const baseY = useMul ? cy * h : cy;
      const offsetY = firstSolidRow(arr, w, h);

      for (let y = 0; y < h; y++) {
        const row = arr[y];
        for (let x = 0; x < w; x++) {
          const tile = row[x];
          if (!tile) continue;
          const tx = baseX + x, ty = baseY + y - offsetY;
          if (grid.inBounds(tx, ty)) { grid.setSolid(tx, ty, 1); solidCount++; }
        }
      }
    }

    console.log("[CollisionGrid] tiles:", grid.wt, "x", grid.ht, "tilePx:", tilePx, "| mode:", useMul ? "mul" : "add");
    console.log("[CollisionGrid] solidCount:", solidCount);
    return grid;
  }
}
