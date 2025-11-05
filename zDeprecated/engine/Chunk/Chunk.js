// World/Chunk.js
import Config from "../Config/Config.js";
import { decodeRLE } from "../Util/RLE.js";

export default class Chunk {
  constructor(chunkData, tileset, image, glRenderer) {
    this.x = chunkData.x;
    this.y = chunkData.y;
    this.width  = chunkData.width;
    this.height = chunkData.height;

    this.pxTile = Config.PX_TILE;
    this.scaleAtlas = Config.SCALE;

    this.encoding = chunkData.encoding || "array";
    this.rawData  = chunkData.rleData || chunkData.data;

    // simpan daftar tilesets dari file chunk
    this.tilesets = Array.isArray(chunkData.tilesets) ? chunkData.tilesets : null;

    // Bisa single atau map: {name: tilesetObj}
    this.tileset = tileset;
    this.image   = image;

    this.glRenderer = glRenderer;

    this.data = [];    // id tile
    this.dataTS = null; // index tileset utk setiap sel (paralel dengan data)
    this._decode();
  }

  _decode() {
    const isRLE = this.encoding === "rle" || !!this.rawData;
    if (isRLE && Array.isArray(this.rawData?.[0])) {
      // Ambil SEMUA tileset (jangan di-filter); kita butuh info tsIndex untuk render & collision
      const res = decodeRLE(this.rawData, this.width, this.height, {
        tilesets: this.tilesets,
        returnTilesetIndex: true
      });
      this.data   = res.rows;
      this.dataTS = res.tsRows;
      return;
    }

    if (Array.isArray(this.rawData)) {
      // Array biasa: bisa jadi berisi pasangan [tsIdx, tileId]
      if (Array.isArray(this.rawData[0]) && Array.isArray(this.rawData[0][0])) {
        this.data   = this.rawData.map(row => row.map(v => Array.isArray(v) ? (v[1] | 0) : (v | 0)));
        this.dataTS = this.rawData.map(row => row.map(v => Array.isArray(v) ? (v[0] | 0) : -1));
      } else {
        this.data   = this.rawData;
        this.dataTS = this.data.map(row => row.map(_ => -1));
      }
      return;
    }

    console.error("❌ Tidak ada data tile di chunk:", this);
    this.data   = Array.from({ length: this.height }, () => Array(this.width).fill(0));
    this.dataTS = this.data.map(row => row.map(_ => -1));
  }

  // Helper: ambil tileset/image berdasarkan nama (mendukung single atau map)
  _getTilesetByName(name) {
    if (!name) return null;
    const t = this.tileset;
    if (!t) return null;
    if (t.tiles) return t;                 // single atlas
    return t[name] || null;                // map
  }
  _getImageByName(name) {
    if (!name) return null;
    const img = this.image;
    if (!img) return null;
    if (img.isLoaded) return img;          // single image
    return img[name] || null;              // map
  }

  render(projection = null) {
    const ts = this.pxTile;
    const baseX = this.x * this.width  * ts;
    const baseY = this.y * this.height * ts;
    const snap = (Config?.PIXEL_ART ?? false) || (Config?.CAMERA?.PIXEL_LOCK ?? false);

    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        const id = this.data[r][c] | 0;
        if (!id) continue;

        // Tentukan tileset nama untuk sel ini
        const tsIdx  = this.dataTS?.[r]?.[c] ?? 0;
        const tsName = this.tilesets?.[tsIdx] ?? this.tilesets?.[0];

        // Ambil atlas & image sesuai nama
        const atlas = this._getTilesetByName(tsName);
        const image = this._getImageByName(tsName);

        // Jika tidak ada atlas (mis: 'rectangle' akan dirender GL primitive nantinya), skip render sprite
        if (!atlas?.tiles || !image?.isLoaded) {
          // TODO: jika kamu sudah punya API GL rectangle, panggil di sini berdasar id
          continue;
        }

        const tile = atlas.tiles[id];
        if (!tile) continue;

        let dx = baseX + c * ts;
        let dy = baseY + r * ts;
        if (snap) { dx = Math.round(dx); dy = Math.round(dy); }

        const dw = tile.w * this.scaleAtlas;
        const dh = tile.h * this.scaleAtlas;
        image.drawImage(tile.x, tile.y, tile.w, tile.h, dx, dy, dw, dh, projection);
      }
    }
  }
}
