// /Layering/Layering.js
import Chunk from "../Chunk/Chunk.js";
import { game } from "../main.js";

export default class Layering {
  constructor(projectId, levelName, layerName, tilesetMap, imageMap, glRenderer) {
    this.projectId = projectId;
    this.levelName = levelName;
    this.name = layerName;
    this.tilesetMap = tilesetMap;   // { terrain, rectangle, stair }
    this.imageMap   = imageMap;     // { terrain, rectangle, stair }
    this.glRenderer = glRenderer;
    this.chunks = [];
    this.isLoaded = false;
  }

  async loadChunks(chunkList) {
    const baseURL = `http://lupis.calk.cloud/api/projects/${this.projectId}`;
    const folderPath = `tilemap/${this.levelName}/${this.name.toLowerCase()}`;

    const tasks = chunkList.map(async (info) => {
      try {
        const url = `${baseURL}/file/${folderPath}/${info.path}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const data = await res.json();

        this.chunks.push(new Chunk(data, this.tilesetMap, this.imageMap, this.glRenderer));
      } catch (err) {
        console.warn(`⚠️ Gagal memuat chunk "${this.name}/${info.path}":`, err.message);
      }
    });

    await Promise.all(tasks);
    this.isLoaded = true;
    console.log(`✅ Layer "${this.name}" loaded ${this.chunks.length} chunks.`);
  }

  render(cameraX = 0, cameraY = 0, projection = null) {
    if (!this.isLoaded) return;
    for (const c of this.chunks) c.render(projection);
  }
}
