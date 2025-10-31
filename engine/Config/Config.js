// Config/Config.js
// Sumber kebenaran: TILE, SCALE, VIRTUAL_* ; nilai turunan selalu dihitung ulang.
// Nilai dari JSON project (mis. core.json) diaplikasikan via Config.apply().

class Configs {
  constructor() {
    // === Ukuran dasar tile (wajib) ===
    this.TILE = 16;
    this.SCALE = 4;

    // === Nilai turunan (jangan diset langsung dari luar) ===
    this.PX = this.TILE * this.SCALE;  // pixel per tile
    this.PX_TILE = this.PX;            // alias
    this.TILE_SIZE = this.TILE;        // alias

    // ===== Virtual Screen =====
    this.VIRTUAL_WIDTH = 1920;
    this.VIRTUAL_HEIGHT = 1080;

    // ===== Rendering =====
    this.PIXEL_ART = true;

    // ===== World / Level =====
    this.WORLD = {
      AUTO_SIZE: true,                 // fallback saat tilemap kosong
      WIDTH: this.VIRTUAL_WIDTH,
      HEIGHT: this.VIRTUAL_HEIGHT,
      CHUNK_SIZE: 16,
      PATH_BASE: "Tilemap",
      SOLID_LAYER_REGEX: "(solid|wall|terrain|ground|collid)"
    };

    // ===== Camera =====
    this.CAMERA = {
      LERP: 20,
      PIXEL_LOCK: true,
      MIN_BOTTOM_TILES: 1
    };

    // ===== Tick =====
    this.TICK_RATE = 60;

    // ===== Opsional (akan diisi loader bila ada JSON-nya) =====
    this.TILESETS = [];   // aman untuk loop/filter
    this.PLAYER = null;
    this.PHYSICS = null;

    // Catatan: Loader akan menaruh file JSON ke key sesuai nama file (uppercase),
    // misal core.json -> Config.CORE
  }

  // Hitung ulang semua nilai turunan berdasarkan nilai dasar terkini.
  recompute() {
    this.PX = this.TILE * this.SCALE;
    this.PX_TILE = this.PX;
    this.TILE_SIZE = this.TILE;

    if (this.WORLD?.AUTO_SIZE) {
      this.WORLD.WIDTH = this.VIRTUAL_WIDTH;
      this.WORLD.HEIGHT = this.VIRTUAL_HEIGHT;
    }
  }

  // Terapkan partial config dari project (mis. isi core.json)
  // Mengabaikan PX/PX_TILE di input agar selalu konsisten hasil hitung ulang.
  apply(partial = {}) {
    const p = { ...partial };

    // Aliases/back-compat
    if (p.TILE == null && p.TILE_SIZE != null) p.TILE = p.TILE_SIZE;

    // Nilai dasar
    if (p.TILE != null) this.TILE = Number(p.TILE);
    if (p.SCALE != null) this.SCALE = Number(p.SCALE);
    if (p.VIRTUAL_WIDTH != null) this.VIRTUAL_WIDTH = Number(p.VIRTUAL_WIDTH);
    if (p.VIRTUAL_HEIGHT != null) this.VIRTUAL_HEIGHT = Number(p.VIRTUAL_HEIGHT);
    if (p.PIXEL_ART != null) this.PIXEL_ART = !!p.PIXEL_ART;

    // Nested (opsional)
    if (p.WORLD && typeof p.WORLD === "object") Object.assign(this.WORLD, p.WORLD);
    if (p.CAMERA && typeof p.CAMERA === "object") Object.assign(this.CAMERA, p.CAMERA);

    // Abaikan p.PX / p.PX_TILE agar tidak menimpa hasil hitung
    this.recompute();
  }
}

const Config = new Configs();
export default Config;
