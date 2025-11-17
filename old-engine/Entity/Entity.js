// src/engine/Entity/Entity.js
export default class Entity {
  constructor(x = 0, y = 0, width = 16, height = 16) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.visible = true;
    this.world = null;
    this.type = "generic"; // bisa digunakan untuk filtering
  }

  onAddedToWorld(world) {
    this.world = world;
  }

  update(dt) {}
  render(renderer, projection, alpha, strict) {}
}
