// Util/RLE.js
export function decodeRLE(rleData, width, height, opts = {}) {
  if (!rleData) return [];

  const {
    tilesets = null,               // ["terrain","rectangle","stair"]
    includeTilesets = null,        // array nama/indeks; jika null → ambil semua
    returnTilesetIndex = false     // true → kembalikan { rows, tsRows }
  } = opts;

  // Bangun set tileset yang diizinkan (bisa nama atau index)
  let allowIdx = null;
  if (includeTilesets && includeTilesets.length) {
    allowIdx = new Set();
    for (const v of includeTilesets) {
      if (typeof v === "number") allowIdx.add(v | 0);
      else if (tilesets) {
        const idx = tilesets.findIndex(nm => String(nm) === String(v));
        if (idx >= 0) allowIdx.add(idx);
      }
    }
  }

  const total = width * height;
  const flatIds = new Array(total);
  const flatTs  = returnTilesetIndex ? new Array(total) : null;

  let p = 0;
  outer:
  for (const [count, value] of rleData) {
    for (let i = 0; i < count; i++) {
      if (Array.isArray(value)) {
        const tsIdx  = value[0] | 0;
        const tileId = value[1] | 0;
        const allowed = allowIdx ? allowIdx.has(tsIdx) : true;
        flatIds[p] = allowed ? tileId : 0;
        if (flatTs) flatTs[p] = allowed ? tsIdx : -1;
      } else {
        // Format lama: angka tunggal
        flatIds[p] = value | 0;
        if (flatTs) flatTs[p] = -1;
      }
      p++; if (p >= total) break outer;
    }
  }
  // Isi sisanya dengan 0 jika kurang
  while (p < total) {
    flatIds[p] = 0;
    if (flatTs) flatTs[p] = -1;
    p++;
  }

  const rows = [], tsRows = returnTilesetIndex ? [] : null;
  for (let y = 0; y < height; y++) {
    const start = y * width, end = start + width;
    rows.push(flatIds.slice(start, end));
    if (tsRows) tsRows.push(flatTs.slice(start, end));
  }
  return returnTilesetIndex ? { rows, tsRows } : rows;
}
