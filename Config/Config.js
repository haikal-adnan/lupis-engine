// Config/Config.js

const TILE  = 16;          // ukuran dasar tile (tanpa skala)
const SCALE = 4;           // faktor skala pixel art
const PX    = TILE * SCALE; // ukuran tile akhir (px)

const Config = {
  // ===== Virtual Screen =====
  VIRTUAL_WIDTH: 1920,     // lebar viewport virtual
  VIRTUAL_HEIGHT: 1080,    // tinggi viewport virtual

  // ===== Tile / Rendering =====
  TILE_SIZE: TILE,         // ukuran tile asli (px)
  SCALE,                   // faktor skala visual
  PX_TILE: PX,             // ukuran tile hasil skala
  PIXEL_ART: true,         // aktifkan pixel snapping

  // ===== World / Level =====
  WORLD: {
    AUTO_SIZE: true,                    // auto hitung world dari meta/chunk
    WIDTH: 1920,                        // fallback width (px)
    HEIGHT: 1080,                       // fallback height (px)
    CHUNK_SIZE: 16,                     // ukuran chunk dalam tile
    PATH_BASE: "Tilemap",               // path dasar world
    SOLID_LAYER_REGEX: "(solid|wall|terrain|ground|collid)" // regex layer solid
  },

  TILESETS: [
    {
      name: "terrain",
      tileset: "Tileset/terrain.json",
      image:   "Asset/Atlas/terrain.png",
      solid: true
    },
    {
      name: "stair",
      tileset: "Tileset/stair.json",
      image:   "Asset/Atlas/stair.png",
      solid: true
    },
    {
      name: "rectangle",
      tileset: "Tileset/rectangle.json",
      image:   null,             
      procedural: { color: "#FFFFFF", size: 16 },
      solid: false
    }
  ],

  // ===== Player =====
  PLAYER: {
    WIDTH: 1 * PX,                      // lebar player (1 tile)
    HEIGHT: 1 * PX,                     // tinggi player (1 tile)
    SPEED: 6 * PX,                      // kecepatan horizontal
    START_POS: { X: 0 * PX, Y: 10 * PX } // posisi awal player
  },

  // ===== Physics =====
  PHYSICS: {
    MODE: "platformer",                 // mode fisika
    GRAVITY: 9.8 * PX,                    // gaya gravitasi
    MAX_VELOCITY_Y: 62 * PX,            // batas kecepatan jatuh
    FRICTION: 0.9,                      // gesekan umum
    JUMP_VELOCITY: 5 * PX,             // kecepatan awal lompat
    CUT_JUMP_FACTOR: 1              // potongan kecepatan saat tombol dilepas
  },

  // ===== Camera =====
  CAMERA: {
    LERP: 20,                           // kehalusan gerak kamera
    PIXEL_LOCK: true,                   // snap ke pixel terdekat
    MIN_BOTTOM_TILES: 1                 // jarak minimal tile di bawah player
  },

  // ===== Timing =====
  TICK_RATE: 60                         // target update per detik
};

export default Config;
