export default class CollisionSystem {
  constructor(grid, mode = "platformer") {
    this.grid = grid;
    this.mode = mode;
  }

  moveBody(body, dt) {
    const dx = (body.vx ?? 0) * dt;
    const dy = (body.vy ?? 0) * dt;

    const res = this.grid.moveAABB(body.x, body.y, body.width | 0, body.height | 0, dx, dy);

    body.x = res.x;
    body.y = res.y;

    if (res.hitLeft || res.hitRight) {
      body.vx = 0;
      body.hitLeft = res.hitLeft;
      body.hitRight = res.hitRight;
    } else body.hitLeft = body.hitRight = false;

    if (res.hitTop || res.hitBottom) {
      body.vy = 0;
      body.hitTop = res.hitTop;
      body.hitBottom = res.hitBottom;
    } else body.hitTop = body.hitBottom = false;

    body.grounded = (this.mode === "platformer") ? !!res.hitBottom : false;
    return res;
  }
}
