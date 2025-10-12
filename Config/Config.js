// Config/Config.js
const Config = {
  // ===== Virtual screen =====
  VIRTUAL_WIDTH: 1920,
  VIRTUAL_HEIGHT: 1080,

  // ===== Tile / Rendering =====
  TILE_SIZE: 16,      // ukuran tile dasar (px)
  SCALE: 4,           // skala pixel-art
  PIXEL_ART: true,    // rounding & pixel snapping optional via CAMERA.PIXEL_LOCK

  // ===== World / Level =====
  WORLD: {
    WIDTH: 1920 * 2,       // fallback lebar world (px)
    HEIGHT: 1080 * 2,      // fallback tinggi world (px)
    CHUNK_SIZE: 16,        // jumlah tile per chunk default
    PATH_BASE: "Tilemap",  // folder dasar untuk tilemap
    // Opsional: regex nama layer solid; dipakai jika diintegrasikan ke CollisionGrid.fromTilemap
    SOLID_LAYER_REGEX: "(solid|wall|terrain|ground|collid)"
  },

  // ===== Player =====
  PLAYER: {
    WIDTH: 16 * 4,
    HEIGHT: 16 * 4,
    SPEED: 400,
    START_POS: { X: 0*16, Y: 56*16 }
  },

  // ===== Physics =====
  PHYSICS: {
    MODE: "platformer",
    GRAVITY: 9.8 * 100,
    MAX_VELOCITY_Y: 2000,
    FRICTION: 0.9,

    JUMP_VELOCITY: 900,
    COYOTE_TIME: 0.08,          // ← wajib 0 untuk “harus menyentuh dulu”
    JUMP_BUFFER_TIME: 0.10,  // boleh 0 kalau mau super ketat
    CUT_JUMP_FACTOR: 0.5
  },


  // ===== Camera =====
  CAMERA: {
    DEADZONE_X: [0.5, 0.5],
    DEADZONE_Y: [0.5, 0.5],
    LERP: 10.0,
    PIXEL_LOCK: false       // true jika ingin pixel-perfect follow
  },

  // ===== Timing =====
  TICK_RATE: 60
};

export default Config;
