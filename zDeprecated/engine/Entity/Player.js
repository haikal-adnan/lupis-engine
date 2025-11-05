import Config from "../Config/Config.js";

export default class Player {
  constructor(image, x = Config.PLAYER.X, y = Config.PLAYER.Y, layer = "PLAYER") {
    this.image = image;
    this.width  = Config.PLAYER.WIDTH;
    this.height = Config.PLAYER.HEIGHT;
    this.speed  = Config.PLAYER.SPEED;

    this.x = x; this.y = y;
    this.prevX = x; this.prevY = y;
    this.vx = 0; this.vy = 0;
    this.grounded = false;
    this.direction = "down";
    this.layer = layer;
  }

  update(dt, input, mode = Config.PHYSICS.MODE) {
    const { x: dx, y: dy, dir } = input.getDirection();
    if (dir) this.direction = dir;

    if (mode === "platformer") {
      this.vx = dx * this.speed;
      if (input.isReleased("jump") && this.vy < 0)
        this.vy *= Config.PHYSICS.CUT_JUMP_FACTOR;
    } else {
      this.vx = dx * this.speed;
      this.vy = dy * this.speed;
    }
  }

  postCollisionJump(input, landed) {
    if (!this.grounded) return;
    const JUMP = Config.PHYSICS.JUMP_VELOCITY;
    if (landed && input.isDown("jump")) { this.vy = -JUMP; this.grounded = false; }
    else if (input.isPressed("jump"))   { this.vy = -JUMP; this.grounded = false; }
  }

  render(glRenderer, projection, alpha = 1, strict = false) {
    const rx = strict ? this.x : this.prevX + (this.x - this.prevX) * alpha;
    const ry = strict ? this.y : this.prevY + (this.y - this.prevY) * alpha;
    const fx = strict && Config.PIXEL_ART ? Math.round(rx) : rx;
    const fy = strict && Config.PIXEL_ART ? Math.round(ry) : ry;

    this.image.drawImage(fx, fy, this.width, this.height, projection);
  }
}
