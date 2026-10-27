// Loader/InitializeTilesets.js
import Config from "../Config/Config.js";

export async function initializeTilesets(list = Config.TILESETS) {
  const out = {};
  for (const t of list) {
    const path = t?.tileset;
    if (!path) continue;
    const j = await fetch(path).then(r => r.json());
    out[t.name] = j;
  }
  return out;
}
