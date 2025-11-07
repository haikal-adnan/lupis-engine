// src/engine/World/World.js
import Camera from "../Camera/Camera.js";
import Config from "../Config/Config.js";
import { bus } from "../Core/EventBus.js";

export default class World {
  constructor(glRenderer) {
    this.glRenderer = glRenderer;
    this.camera = new Camera(0, 0);
    this.entities = [];
    this.systems = []; // daftar sistem
  }

  addEntity(entity) {
    entity.onAddedToWorld(this);
    this.entities.push(entity);
    if (entity.type === "player") this.player = entity;
  }

  addSystem(system) {
    this.systems.push(system);
  }

  update(dt) {
    for (const system of this.systems)
      for (const e of this.entities)
        system.update?.(e, dt);

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

  render(alpha) {
    const isEditor = Config.ENGINE_MODE === "editor";
    const cam = isEditor
      ? { x: this.camera.x, y: this.camera.y, scale: this.camera.scale ?? 1 }
      : this.camera.getInterpolated(alpha);

    const proj = this.glRenderer.getWorldProjection(cam.x, cam.y, cam.scale);
    const strict = isEditor;

    for (const system of this.systems)
      for (const e of this.entities)
        system.render?.(e, this.glRenderer, proj, alpha, strict);
  }

  async load() {
    console.log("🌍 World mulai dimuat...");
    await new Promise(r => setTimeout(r, 500));
    bus.emit("world:ready", { message: "World sudah siap dimainkan!" });
  }
}
