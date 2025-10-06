import Config from "../Config/Config.js";
import { decodeRLE } from "../Util/RLE.js";

export default class Chunk {
  constructor(chunkData, tileset, image, glRenderer) {
    this.x = chunkData.x;             // posisi chunk dalam grid chunk
    this.y = chunkData.y;
    this.width = chunkData.width;
    this.height = chunkData.height;
    this.tileSize = Config.TILE_SIZE;

    this.encoding = chunkData.encoding || "array";
    this.rawData = chunkData.rleData || chunkData.data;
    this.tileset = tileset;           // data tile (atlas info)
    this.image = image;               // GLImage instance
    this.glRenderer = glRenderer;     // akses context render
    this.scale = Config.SCALE;

    // Hasil decoding tile ID ke array 2D
    this.data = [];

    this._decode();
  }

  /** Dekode data tile dari RLE → array 2D */
    _decode() {
        // kalau tidak ada encoding di chunk, tapi ada rleData → anggap RLE
        const isRLE = this.encoding === "rle" || !!this.rawData;

        if (isRLE && Array.isArray(this.rawData[0])) {
            this.data = decodeRLE(this.rawData, this.width, this.height);
        } else if (Array.isArray(this.rawData)) {
            this.data = this.rawData;
        } else {
            console.error("❌ Tidak ada data tile di chunk:", this);
            this.data = Array.from({ length: this.height }, () => Array(this.width).fill(0));
        }

        console.log("✅ Chunk decoded:", {
            width: this.width,
            height: this.height,
            flatLength: Array.isArray(this.rawData) ? this.rawData.flat().length : 0,
            dataRows: this.data.length,
            firstRowLength: this.data[0]?.length
        });
    }



  /** Render semua tile di chunk ini */
  render(cameraX = 0, cameraY = 0) {
    if (!this.image?.isLoaded) return;

    const gl = this.glRenderer.gl;
    const tileSize = this.tileSize;
    const scale = this.scale;
    const tileScreenSize = tileSize * scale;

    // Posisi chunk dalam pixel (di dunia)
    const chunkWorldX = this.x * this.width * tileScreenSize;
    const chunkWorldY = this.y * this.height * tileScreenSize;

    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        const tileId = this.data[row][col];
        if (tileId === 0) continue; // 0 = kosong (udara)

        const tile = this.tileset.tiles[tileId];
        if (!tile) continue;

        const dx = chunkWorldX + col * tileScreenSize - cameraX;
        const dy = chunkWorldY + row * tileScreenSize - cameraY;
        const dw = tile.w * scale;
        const dh = tile.h * scale;

        // gambar tile dari atlas
        this.image.drawImage(tile.x, tile.y, tile.w, tile.h, dx, dy, dw, dh);
      }
    }
  }
}
