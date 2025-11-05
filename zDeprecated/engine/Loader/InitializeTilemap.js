// Loader/InitializeTilemap.js
import Config from "../Config/Config.js";

// blank tilemap yang valid
function makeBlankTilemap(level = "level1") {
  const px = Config.PX_TILE;
  const wTiles = Math.max(1, Math.round(Config.WORLD.WIDTH  / px));
  const hTiles = Math.max(1, Math.round(Config.WORLD.HEIGHT / px));
  return {
    level,
    width: wTiles,          // dalam tile
    height: hTiles,         // dalam tile
    chunkWidth: Config.WORLD.CHUNK_SIZE,
    chunkHeight: Config.WORLD.CHUNK_SIZE,
    layers: []
  };
}

export async function initializeTilemap(projectId = "game-demo", level = "level1") {
  const baseURL = `http://api.lupis.calk.cloud/projects/${projectId}`;

  // 1) PRE-CHECK: cek struktur dulu → hindari fetch 404 ke meta.json
  try {
    const treeRes = await fetch(`${baseURL}/tree`, { cache: "no-store" });
    if (!treeRes.ok) throw new Error(`HTTP ${treeRes.status} ${treeRes.statusText}`);
    const tree = await treeRes.json();

    const tilemapFolder = tree.find(n => n.type === "folder" && n.name.toLowerCase() === "tilemap");
    const levelFolder   = tilemapFolder?.children?.find(n => n.type === "folder" && n.name === level);
    const hasMeta       = !!levelFolder?.children?.find(n => n.type === "file" && n.name === "meta.json");

    if (!hasMeta) {
      console.info(`🧪 Empty Project Mode: folder tilemap/level "${level}" atau meta.json tidak ditemukan → gunakan blank tilemap`);
      return makeBlankTilemap(level);
    }
  } catch (e) {
    console.warn(`⚠️ Gagal cek /tree (${e.message}). Empty Project Mode aktif.`);
    return makeBlankTilemap(level);
  }

  // 2) meta.json ada → fetch seperti biasa
  const metaURL = `${baseURL}/file/tilemap/${level}/meta.json`;
  try {
    const res = await fetch(metaURL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const meta = await res.json();
    meta.level = level;
    console.log(`🗺️ Tilemap ${level} dimuat:`, meta);
    return meta;
  } catch (err) {
    // Secara teori tak terjadi karena kita sudah pre-check, tapi tetap fallback
    console.warn(`⚠️ meta.json gagal dimuat (${err.message}). Empty Project Mode aktif.`);
    return makeBlankTilemap(level);
  }
}
