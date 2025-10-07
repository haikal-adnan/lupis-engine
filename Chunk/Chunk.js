import Config from "../Config/Config.js";
import { decodeRLE } from "../Util/RLE.js";

export default class Chunk {
  constructor(chunkData, tileset, image, glRenderer) {
    this.x = chunkData.x;
    this.y = chunkData.y;
    this.width = chunkData.width;
    this.height = chunkData.height;
    this.tileSize = Config.TILE_SIZE;
    this.scale = Config.SCALE;
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
    if (isRLE && Array.isArray(this.rawData[0])) {
      this.data = decodeRLE(this.rawData, this.width, this.height);
    } else if (Array.isArray(this.rawData)) {
      this.data = this.rawData;
    } else {
      console.error("❌ Tidak ada data tile di chunk:", this);
      this.data = Array.from({ length: this.height }, () =>
        Array(this.width).fill(0)
      );
    }
  }

  render(cameraX = 0, cameraY = 0, projection = null) {
    if (!this.image?.isLoaded) return;
    const t = this.tileSize, s = this.scale, ts = t * s;
    const baseX = this.x * this.width * ts;
    const baseY = this.y * this.height * ts;

    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        const id = this.data[r][c];
        if (!id) continue;
        const tile = this.tileset.tiles[id];
        if (!tile) continue;
        const dx = baseX + c * ts - cameraX;
        const dy = baseY + r * ts - cameraY;
        const dw = tile.w * s, dh = tile.h * s;
        this.image.drawImage(tile.x, tile.y, tile.w, tile.h, dx, dy, dw, dh, projection);
      }
    }
  }
}
