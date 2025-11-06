// src/engine/Config/Config.js
class Configs {
  constructor() {
    this.TILE = 16;
    this.SCALE = 4;
    this.PX_TILE = this.TILE * this.SCALE;
    this.ENGINE_MODE = "runtime"; // atau "pause, restart"

    this.VIRTUAL_WIDTH = 1920;
    this.VIRTUAL_HEIGHT = 1080;
    this.PIXEL_ART = true;

    this

    this.WORLD = {
      WIDTH: this.VIRTUAL_WIDTH,
      HEIGHT: this.VIRTUAL_HEIGHT
    };

    this.CAMERA = {
      LERP: 20,
      PIXEL_LOCK: true
    };

    this.TICK_RATE = 60;
  }

  recompute() {
    this.PX_TILE = this.TILE * this.SCALE;
  }

  apply(partial = {}) {
    const p = { ...partial };
    if (p.TILE == null && p.TILE_SIZE != null) p.TILE = p.TILE_SIZE;

    if (p.TILE != null) this.TILE = Number(p.TILE);
    if (p.SCALE != null) this.SCALE = Number(p.SCALE);
    if (p.VIRTUAL_WIDTH != null) this.VIRTUAL_WIDTH = Number(p.VIRTUAL_WIDTH);
    if (p.VIRTUAL_HEIGHT != null) this.VIRTUAL_HEIGHT = Number(p.VIRTUAL_HEIGHT);
    if (p.PIXEL_ART != null) this.PIXEL_ART = !!p.PIXEL_ART;

    if (p.WORLD) Object.assign(this.WORLD, p.WORLD);
    if (p.CAMERA) Object.assign(this.CAMERA, p.CAMERA);

    this.recompute();
  }
}

const Config = new Configs();
export default Config;