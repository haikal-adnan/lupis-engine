// src/engine/World/World.js
import Camera from "../Camera/Camera.js";
import Config from "../Config/Config.js";
import { bus } from "../Core/EventBus.js";   // ✅ BENAR

export default class World {
  constructor(glRenderer, uiRenderer) {
    this.glRenderer = glRenderer;
    this.uiRenderer = uiRenderer;

    this.camera = new Camera(0, 0);
    this.player = null;
  }

  update(dt) {
    if (this.player) {
      this.camera.updateFollow(
        this.player,
        dt,
        Config.WORLD.WIDTH,
        Config.WORLD.HEIGHT,
        this.glRenderer?.gl
      );
    }
  }

  async load() {
    console.log("🌍 World mulai dimuat...");
    await new Promise(r => setTimeout(r, 500)); // simulasi delay loading
    bus.emit("world:ready", { message: "World sudah siap dimainkan!" });
  }

  render(alpha) {
    const cam = this.camera.getInterpolated(alpha);
    const proj = this.glRenderer.getWorldProjection(cam.x, cam.y);

    this.player?.render(this.glRenderer, proj, alpha);
  }
}
