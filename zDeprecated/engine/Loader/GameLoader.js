// engine/Loader/GameLoader.js
import GameLoop from "../Loop/GameLoop.js";
import GLRenderer from "../Renderer/GLRenderer.js";
import UIRenderer from "../Renderer/UIRenderer.js";
import InputHandler from "../Interaction/InputHandler.js";
import TouchHandler from "../Interaction/TouchHandler.js";
import World from "../World/World.js";
import { initializeTilesets } from "./InitializeTilesets.js";
import { initializeAtlases } from "./InitializeAtlases.js";
import { initializeTilemap } from "./InitializeTilemap.js";
import { game } from "../main.js";
import Grid from "../Util/Grid.js";
import Config from "../Config/Config.js";

export default class GameLoader {
  async initializeGame() {
    // === 1) Renderer & context ===
    const glCanvas = document.getElementById("glCanvas");
    const uiCanvas = document.getElementById("uiCanvas");

    game.glRenderer = new GLRenderer(glCanvas);
    game.glContext = glCanvas.getContext("webgl");
    game.uiRenderer = new UIRenderer(uiCanvas);
    game.uiContext = uiCanvas.getContext("2d");

    // === 2) Input handlers ===
    game.input = new InputHandler();
    game.input.initListeners();

    game.touch = new TouchHandler();
    game.touch.initListeners();

    // === 3) Identitas runtime ===
    game.project = game.project ?? "game-demo";
    game.level = game.level ?? "level1";

    const baseURL = `http://api.lupis.calk.cloud/projects/${game.project}`;

    // ===================================================
    // (A) MUAT SEMUA CONFIG JSON DINAMIS DARI PROJECT
    //     - Disimpan ke Config[UPPERCASE_FILENAME]
    //     - Setelah semua masuk, apply(Config.CORE) -> top-level
    // ===================================================
    try {
      const res = await fetch(`${baseURL}/tree`);
      if (!res.ok) throw new Error(`Gagal ambil tree: ${res.status}`);
      const tree = await res.json();

      const configFolder = tree.find(n => n.name === "config" && n.type === "folder");
      if (configFolder?.children?.length) {
        for (const file of configFolder.children) {
          if (file.type !== "file" || !file.name.endsWith(".json")) continue;

          const fileURL = `${baseURL}/file/config/${file.name}`;
          try {
            const jsonRes = await fetch(fileURL);
            if (!jsonRes.ok) throw new Error(`HTTP ${jsonRes.status} ${jsonRes.statusText}`);
            const data = await jsonRes.json();
            const key = file.name.replace(/\.json$/i, "").toUpperCase();

            if (Array.isArray(data)) {
              Config[key] = data; // array: replace
            } else if (data && typeof data === "object") {
              // object: merge jika sudah ada object, selain itu replace
              if (Config[key] && typeof Config[key] === "object") {
                Object.assign(Config[key], data);
              } else {
                Config[key] = data;
              }
            } else {
              Config[key] = data; // primitive
            }

            console.log(`📦 Config dimuat: ${file.name} -> Config.${key}`);
          } catch (err) {
            console.warn(`⚠️ Gagal baca ${file.name}:`, err.message);
          }
        }
      }
    } catch (err) {
      console.warn("⚠️ Lewati config dinamis (pakai default minimal):", err.message);
    }

    // Terapkan core (jika ada) ke top-level, lalu hitung ulang turunan.
    // Ini memastikan TILE, SCALE, PX, dll konsisten sebelum komponen lain dibuat.
    Config.apply(Config.CORE || {});

    // Pastikan properti opsional tetap aman
    if (!Array.isArray(Config.TILESETS)) Config.TILESETS = [];

    // === 4) Setelah Config final -> baru buat Grid (pakai ukuran PX aktual) ===
    game.grid = new Grid(game.uiContext, Config.PX);

    // ===================================================
    // (B) SIAPKAN ASET (rewrite path image tileset -> API)
    // ===================================================
    const tilesetWithImage = Config.TILESETS.filter(t => t && t.image);
    for (const t of tilesetWithImage) {
      const filename = String(t.image).replace(/^Asset\/Atlas\/|^Asset\/|^assets\//i, "");
      t.image = `${baseURL}/file/assets/${filename}`;
    }

    // ===================================================
    // (C) MUAT TILESET, ATLAS, TILEMAP
    // ===================================================
    let tilesets = {};
    let images = {};
    let tilemap = { layers: [] };

    try { tilesets = await initializeTilesets(game.project); } catch { tilesets = {}; }
    try { images   = await initializeAtlases(game.glContext, Config.TILESETS); } catch { images = {}; }
    try { tilemap  = (await initializeTilemap(game.project, game.level)) || { layers: [] }; }
    catch { tilemap = { layers: [] }; }

    console.log("🧩 Tilesets berhasil dimuat:", Array.isArray(Config.TILESETS) ? Config.TILESETS : []);
    console.log("🗺️ Tilemap final:", tilemap);
    

    // ===================================================
    // (D) BUAT WORLD DAN MUAT SEMUA ENTITAS
    // ===================================================
    const world = new World(
      tilemap,
      tilesets,
      images,
      game.glRenderer,
      game.glContext,
      game.input
    );
    
    await world.load();
    game.attachWorld(world);
    // ===================================================
    // (E) CARI & EKSEKUSI init.js PROJECT (opsional)
    // ===================================================
    try {
      const initModule = await import(
        `../../projects/${game.project}/config/init.js`
      );

      if (initModule?.setupPhysics) {
        await initModule.setupPhysics(world, Config);
      } else {
        console.log("ℹ️ Tidak ada setupPhysics() di init.js, lewati inisialisasi fisika.");
      }
    } catch (err) {
      console.warn("⚠️ Tidak menemukan init.js project (lewati tahap inisialisasi tambahan):", err.message);
    }

    // ===================================================
    // (F) MULAI GAME LOOP
    // ===================================================
    game.loop = new GameLoop(game);
  }

  gameStart() {
    console.log(`✅ Game dimulai pada project "${game.project}" level "${game.level}"`);
    game.loop?.start();
  }
}
