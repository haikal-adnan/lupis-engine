import Chunk from "../Chunk/Chunk.js";
import Camera2D from "../Util/Camera2D.js";

export default class World {
  constructor(tilemap, tileset, image, glRenderer) {
    this.tilemap = tilemap;
    this.tileset = tileset;
    this.image = image;
    this.glRenderer = glRenderer;
    this.chunks = [];

    this.camera = new Camera2D(0, 0);

    // Muat semua chunk dari layer
    for (const layer of tilemap.layers) {
    for (const chunkData of layer.chunks) {
        const chunk = new Chunk(chunkData, tileset, image, glRenderer);
        this.chunks.push(chunk);
    }
    }

  }

  update(dt) {
    // misal: kamera mengikuti player (sementara scroll otomatis)
    // this.camera.x += 100 * dt; // scroll ke kanan pelan
  }

  render(alpha) {
    for (const chunk of this.chunks) {
      chunk.render(this.camera.x, this.camera.y);
    }
  }
}
