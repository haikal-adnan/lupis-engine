// src/engine/Entity/Entity.js
export default class Entity {
  constructor(x = 0, y = 0, width = 16, height = 16) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.visible = true;
    this.world = null; // referensi world saat ditambahkan
  }

  onAddedToWorld(world) {
    this.world = world;
  }

  // === Optional hooks ===
  update(dt) {}
  render(renderer, projection, alpha, strict) {}
}