// /Layering/Layering.js
import Chunk from "../Chunk/Chunk.js";
import Config from "../Config/Config.js";

export default class Layering {
  constructor(layerName, folderPath, tilesetMap, imageMap, glRenderer) {
    this.name = layerName;
    this.folderPath = folderPath;
    this.tilesetMap = tilesetMap;   // { terrain, rectangle, stair }
    this.imageMap   = imageMap;     // { terrain, rectangle, stair }
    this.glRenderer = glRenderer;
    this.chunks = [];
    this.isLoaded = false;
  }

  async loadChunks(chunkList) {
    const tasks = chunkList.map(async info => {
      const data = await fetch(`${this.folderPath}/${info.path}`).then(r => r.json());
      // 🔹 data.tilesets: ["terrain", "rectangle", "stair"]
      // otomatis diproses oleh Chunk agar tiap sel tahu index tileset-nya
      this.chunks.push(new Chunk(data, this.tilesetMap, this.imageMap, this.glRenderer));
    });

    await Promise.all(tasks);
    this.isLoaded = true;
    console.log(`✅ Layer "${this.name}" loaded ${this.chunks.length} chunks.`);
  }

  render(cameraX = 0, cameraY = 0, projection = null) {
    if (!this.isLoaded) return;
    for (const c of this.chunks) c.render(projection); // cukup projection
  }
}
