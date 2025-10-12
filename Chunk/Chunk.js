import Config from "../Config/Config.js";
import { decodeRLE } from "../Util/RLE.js";

export default class Chunk {
  constructor(chunkData, tileset, image, glRenderer) {
    this.x = chunkData.x;
    this.y = chunkData.y;
    this.width = chunkData.width;
    this.height = chunkData.height;

    // Gunakan px dunia final biar konsisten dengan physics/collision
    this.pxTile = Config.PX_TILE;           // = TILE_SIZE * SCALE
    this.scaleAtlas = Config.SCALE;         // untuk ukuran sprite atlas (w,h)

    this.encoding = chunkData.encoding || "array";
    this.rawData = chunkData.rleData || chunkData.data;
    this.tileset = tileset;
    this.image = image;
    this.glRenderer = glRenderer;
    this.data = [];
    this._decode();
  }

  _decode() {
    const isRLE = this.encoding === "rle" || !!this.rawData;
    if (isRLE && Array.isArray(this.rawData?.[0])) {
      this.data = decodeRLE(this.rawData, this.width, this.height);
    } else if (Array.isArray(this.rawData)) {
      this.data = this.rawData;
    } else {
      console.error("❌ Tidak ada data tile di chunk:", this);
      this.data = Array.from({ length: this.height }, () => Array(this.width).fill(0));
    }
  }

  render(projection = null) {
    if (!this.image?.isLoaded) return;

    const ts = this.pxTile; // ukuran tile di dunia (px final)
    const baseX = this.x * this.width  * ts;
    const baseY = this.y * this.height * ts;

    // (opsional) snap pixel untuk hindari seams
    const snap = (Config?.PIXEL_ART ?? false) || (Config?.CAMERA?.PIXEL_LOCK ?? false);

    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        const id = this.data[r][c];
        if (!id) continue;
        const tile = this.tileset.tiles[id];
        if (!tile) continue;

        let dx = baseX + c * ts;
        let dy = baseY + r * ts;
        if (snap) { dx = Math.round(dx); dy = Math.round(dy); }

        // Ukuran gambar atlas → skala ke dunia
        const dw = tile.w * this.scaleAtlas;
        const dh = tile.h * this.scaleAtlas;

        this.image.drawImage(tile.x, tile.y, tile.w, tile.h, dx, dy, dw, dh, projection);
      }
    }
  }
}
