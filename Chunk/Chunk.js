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

  /** Dekode data tile dari RLE → array 2D */
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

  /** Render semua tile di chunk ini */
  render(cameraX = 0, cameraY = 0, projection = null) {
    if (!this.image?.isLoaded) return;

    const tileSize = this.tileSize;
    const scale = this.scale;
    const tileScreenSize = tileSize * scale;

    // Posisi chunk dalam pixel (di dunia)
    const chunkWorldX = this.x * this.width * tileScreenSize;
    const chunkWorldY = this.y * this.height * tileScreenSize;

    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        const tileId = this.data[row][col];
        if (tileId === 0) continue;

        const tile = this.tileset.tiles[tileId];
        if (!tile) continue;

        const dx = chunkWorldX + col * tileScreenSize - cameraX;
        const dy = chunkWorldY + row * tileScreenSize - cameraY;
        const dw = tile.w * scale;
        const dh = tile.h * scale;

        // 🧠 Kirim projection agar layer ikut pergerakan kamera
        this.image.drawImage(tile.x, tile.y, tile.w, tile.h, dx, dy, dw, dh, projection);
      }
    }
  }
}
