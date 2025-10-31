// /Collision/AABB.js
export default class AABB {
  static overlaps(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  static fromEntity(e) {
    return { x: e.x, y: e.y, w: e.width ?? 0, h: e.height ?? 0 };
  }
}
