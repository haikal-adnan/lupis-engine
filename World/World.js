import Layering from "../Layering/Layering.js";
import Camera2D from "../Util/Camera2D.js";
import Player from "../Entity/Player.js";
import Polygon from "../Entity/Polygon.js";
import Config from "../Config/Config.js";

export default class World {
  constructor(tilemap, tileset, image, glRenderer, glContext, input) {
    this.tilemap = tilemap;
    this.tileset = tileset;
    this.image = image;
    this.glRenderer = glRenderer;
    this.glContext = glContext;
    this.input = input;

    this.layers = [];
    this.camera = new Camera2D(0, 0);
    this.player = null;

    this.worldWidth = tilemap.width * tilemap.chunkWidth;
    this.worldHeight = tilemap.height * tilemap.chunkHeight;
  }

  async load() {
    console.log("🌍 Memuat world dari tilemap...");

    for (const layerInfo of this.tilemap.layers) {
      const layerPath = `Tilemap/${this.tilemap.name}/${layerInfo.name.toLowerCase()}`;
      const layer = new Layering(
        layerInfo.name,
        layerPath,
        this.tileset,
        this.image,
        this.glRenderer
      );
      await layer.loadChunks(layerInfo.chunks);
      this.layers.push(layer);
    }

    console.log(`✅ Semua layer (${this.layers.length}) berhasil dimuat.`);

    // Buat player sementara
    const poly = new Polygon(this.glContext);
    const playerBitmap = await poly.createRect(32, 32, "#2196F3");

    const playerImage = this.image.cloneEmpty(this.glContext);
    await playerImage.loadFromBitmap(playerBitmap);

    this.player = new Player(playerImage, 100, 100, 124, 124);
  }

  update(dt) {
    if (!this.player) return;

    // Validasi dt
    if (!isFinite(dt) || dt <= 0) {
      console.warn("⚠️ dt tidak valid:", dt);
      return;
    }

        // Update posisi player
    this.player.update(dt, this.input);

    // Pastikan world dimension valid
    // Dead zone agar kamera tidak langsung gerak
    const viewW = Config.VIRTUAL_WIDTH;
    const viewH = Config.VIRTUAL_HEIGHT;
    const worldW = this.worldWidth;
    const worldH = this.worldHeight;

    const centerX = this.camera.x + viewW / 2;
    const centerY = this.camera.y + viewH / 2;

    // Dead zone radius (misal 1/4 layar)
    const deadZoneX = viewW * 0.25;
    const deadZoneY = viewH * 0.25;

    // Target posisi kamera default
    let targetCamX = this.camera.x;
    let targetCamY = this.camera.y;

    // Geser kamera jika player keluar dari dead zone
    if (this.player.x > centerX + deadZoneX) targetCamX = this.player.x - deadZoneX - viewW / 2;
    if (this.player.x < centerX - deadZoneX) targetCamX = this.player.x + deadZoneX - viewW / 2;
    if (this.player.y > centerY + deadZoneY) targetCamY = this.player.y - deadZoneY - viewH / 2;
    if (this.player.y < centerY - deadZoneY) targetCamY = this.player.y + deadZoneY - viewH / 2;

    // Smooth follow (lerp)
    const lerp = (a, b, t) => a + (b - a) * t;
    this.camera.x = lerp(this.camera.x, targetCamX, 8 * dt);
    this.camera.y = lerp(this.camera.y, targetCamY, 8 * dt);

    // Clamp kamera agar tidak keluar dunia
    this.camera.x = Math.max(0, Math.min(this.camera.x, worldW - viewW));
    this.camera.y = Math.max(0, Math.min(this.camera.y, worldH - viewH));


    // Deteksi NaN terakhir
    if (!isFinite(this.camera.x) || !isFinite(this.camera.y)) {
      console.error("⚠️ Kamera posisi NaN!", this.camera, {
        dt, worldW, worldH, viewW, viewH,
        player: { x: this.player.x, y: this.player.y }
      });
      this.camera.x = 0;
      this.camera.y = 0;
    }
  }

  render(alpha) {
    const proj = this.glRenderer.getWorldProjection(this.camera.x, this.camera.y);

    for (const layer of this.layers) {
      layer.render(this.camera.x, this.camera.y, proj);
    }

    if (this.player) {
      this.player.render(this.glRenderer, proj);
    }
  }

}
