import Chunk from "../Chunk/Chunk.js";

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

  async loadChunks(chunkList) {
    const tasks = chunkList.map(async info => {
      const data = await fetch(`${this.folderPath}/${info.path}`).then(r => r.json());
      this.chunks.push(new Chunk(data, this.tileset, this.image, this.glRenderer));
    });
    await Promise.all(tasks);
    this.isLoaded = true;
    console.log(`✅ Layer "${this.name}" loaded ${this.chunks.length} chunks.`);
  }

  render(cameraX = 0, cameraY = 0, projection = null) {
    if (!this.isLoaded) return;
    for (const c of this.chunks) c.render(projection); // <- cukup projection
  }
}
