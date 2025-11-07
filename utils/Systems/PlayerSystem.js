// utils/Systems/PlayerSystem.js
export default class PlayerSystem {
  constructor(input) {
    this.input = input;
  }

  update(entity, dt) {
    if (entity.type !== "player") return;

    entity.prevX = entity.x;
    entity.prevY = entity.y;

    const { x: dx, y: dy, dir } = this.input.getDirection?.() || { x: 0, y: 0 };
    if (dir) entity.direction = dir;

    const move = entity.speed * dt;
    entity.x += dx * move;
    entity.y += dy * move;
  }

  render(entity, renderer, projection, alpha = 1, strict = false) {
    if (entity.type !== "player" || !entity.image) return;

    const rx = strict ? entity.x : entity.prevX + (entity.x - entity.prevX) * alpha;
    const ry = strict ? entity.y : entity.prevY + (entity.y - entity.prevY) * alpha;

    const fx = strict && entity.pixelArt ? Math.round(rx) : rx;
    const fy = strict && entity.pixelArt ? Math.round(ry) : ry;

    const s = projection.zoom ?? 1;
    const x = (fx - (projection.offsetX ?? 0)) * s;
    const y = (fy - (projection.offsetY ?? 0)) * s;
    const w = entity.width * s;
    const h = entity.height * s;

    entity.image.drawImage(x, y, w, h, projection);
  }
}
