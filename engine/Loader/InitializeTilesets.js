// Loader/InitializeTilesets.js
import Config from "../Config/Config.js";

export async function initializeTilesets(projectId = "game-demo") {
  const baseURL = `http://api.lupis.calk.cloud/projects/${projectId}`;
  const out = {};

  for (const t of Config.TILESETS) {
    try {
      const filename = t.tileset.split("/").pop(); // "terrain.json"
      const url = `${baseURL}/file/tileset/${filename}`; // gunakan folder "tileset"
      const res = await fetch(url);

      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const json = await res.json();
      out[t.name] = json;
    } catch (err) {
      console.warn(`⚠️ Gagal memuat tileset '${t.name}':`, err.message);
    }
  }

  console.log("🧩 Tilesets berhasil dimuat:", Object.keys(out));
  return out;
}
