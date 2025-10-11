// /Collision/CollisionSystem.js
// Orkestrator collision: pakai CollisionGrid (world tiles) + AABB util.
// mode: "platformer" | "topdown"
export default class CollisionSystem {
  constructor(grid, mode = "platformer") {
    this.grid = grid;
    this.mode = mode;
  }

  // body wajib punya: x,y,width,height,vx,vy
  moveBody(body, dt) {
    const dx = (body.vx ?? 0) * dt;
    const dy = (body.vy ?? 0) * dt;

    const { x, y, width: w = 0, height: h = 0 } = body;
    const res = this.grid.moveAABB(x, y, w, h, dx, dy);

    // Update posisi
    body.x = res.x;
    body.y = res.y;

    // Tindak lanjut sesuai mode
    if (res.hitLeft || res.hitRight) {
      body.vx = 0;
      body.hitLeft = res.hitLeft;
      body.hitRight = res.hitRight;
    } else {
      body.hitLeft = body.hitRight = false;
    }

    if (res.hitTop || res.hitBottom) {
      body.vy = 0;
      body.hitTop = res.hitTop;
      body.hitBottom = res.hitBottom;
    } else {
      body.hitTop = body.hitBottom = false;
    }

    // Flag grounded untuk platformer
    body.grounded = this.mode === "platformer" ? !!res.hitBottom : false;

    return res;
  }
}
