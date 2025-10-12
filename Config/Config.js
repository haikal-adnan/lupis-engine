// Config/Config.js
const TILE  = 16;        // ukuran dasar tile (tanpa skala)
const SCALE = 2;       // faktor skala pixel art
const PX    = TILE * SCALE; // ukuran tile final (px)

const Config = {
  // ===== Virtual Screen =====
  VIRTUAL_WIDTH: 1920,
  VIRTUAL_HEIGHT: 1080,

  // ===== Tile / Rendering =====
  TILE_SIZE: TILE,
  SCALE,
  PX_TILE: PX,
  PIXEL_ART: true,

  // ===== World / Level =====
  WORLD: {
    WIDTH: 10000,
    HEIGHT: 10000,
    CHUNK_SIZE: 16,
    PATH_BASE: "Tilemap",
    SOLID_LAYER_REGEX: "(solid|wall|terrain|ground|collid)"
  },

  // ===== Player (semua sudah dalam px final) =====
  PLAYER: {
    WIDTH: 1 * PX,           // 1 tile
    HEIGHT: 1 * PX,          // 1 tile
    SPEED: 6 * PX,           // 6 tile per detik
    START_POS: { X: 0 * PX, Y: 10 * PX }
  },

  // ===== Physics (semua dalam px/s, px/s²) =====
  PHYSICS: {
    MODE: "platformer",
    GRAVITY: 9.8 * PX,        // 60 tile/s²
    MAX_VELOCITY_Y: 62 * PX, // batas kecepatan jatuh
    FRICTION: 0.9,

    STRICT_GROUNDED_JUMP: true,
    JUMP_VELOCITY: 12 * PX,  // 12 tile/s
    COYOTE_TIME: 0,
    JUMP_BUFFER_TIME: 0,
    CUT_JUMP_FACTOR: 0.5
  },

  // ===== Camera =====
  CAMERA: {
    DEADZONE_X: [0.5, 0.5],
    DEADZONE_Y: [0.5, 0.5],
    LERP: 20.0,
    PIXEL_LOCK: false
  },

  // ===== Timing =====
  TICK_RATE: 60
};

export default Config;
