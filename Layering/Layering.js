import Chunk from "../Chunk/Chunk.js";

/**
 * Class Layering — menangani kumpulan Chunk untuk satu layer (misal Ground, Solid)
 */
export default class Layering {
  constructor(layerName, folderPath, tileset, image, glRenderer) {
    this.name = layerName;
    this.folderPath = folderPath;
    this.tileset = tileset;
    this.image = image;
    this.glRenderer = glRenderer;
    this.chunks = [];
    this.isLoaded = false;
  }

  /** Muat semua chunk dari meta.json */
  async loadChunks(chunkList) {
    const promises = chunkList.map(async (chunkInfo) => {
      const url = `${this.folderPath}/${chunkInfo.path}`;
      const data = await fetch(url).then((r) => r.json());
      const chunk = new Chunk(data, this.tileset, this.image, this.glRenderer);
      this.chunks.push(chunk);
    });

    await Promise.all(promises);
    this.isLoaded = true;
    console.log(`✅ Layer "${this.name}" loaded ${this.chunks.length} chunks.`);
  }

  /** Render seluruh chunk di layer ini */
  render(cameraX = 0, cameraY = 0, projection = null) {
    if (!this.isLoaded) return;
    for (const chunk of this.chunks) {
      chunk.render(cameraX, cameraY, projection);
    }
  }
}
