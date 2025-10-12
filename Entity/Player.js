// Entity/Player.js
import Config from "../Config/Config.js";

export default class Player {
  constructor(image, x = (Config.PLAYER?.START_POS?.X ?? 100), y = (Config.PLAYER?.START_POS?.Y ?? 1000), layer = "PLAYER") {
    this.image = image;
    this.width  = Config.PLAYER?.WIDTH  ?? 64;
    this.height = Config.PLAYER?.HEIGHT ?? 64;
    this.speed  = Config.PLAYER?.SPEED  ?? 400;

    this.x = x; this.y = y;
    this.prevX = x; this.prevY = y;

    this.vx = 0;
    this.vy = 0;
    this.grounded = false;

    this.direction = "down";
    this.layer = layer;

    this.hitLeft = this.hitRight = this.hitTop = this.hitBottom = false;

    // timers untuk jump quality
    this._coyoteT = 0;
    this._jumpBufT = 0;
  }

  update(dt, input, mode = (Config.PHYSICS?.MODE ?? "platformer")) {
    this.prevX = this.x;
    this.prevY = this.y;

    const { x: dx, y: dy, dir } = input.getDirection();
    if (dir) this.direction = dir;

    if (mode === "platformer") {
      // gerak horizontal dari input
      this.vx = dx * this.speed;

      // === Jump QoL ===
      const COYOTE  = Config.PHYSICS?.COYOTE_TIME ?? 0.08;
      const BUF     = Config.PHYSICS?.JUMP_BUFFER_TIME ?? 0.10;
      const JUMPV   = Config.PHYSICS?.JUMP_VELOCITY ?? 900;
      const CUTFAC  = Config.PHYSICS?.CUT_JUMP_FACTOR ?? 0.5;

      // refresh coyote saat menapak
      if (this.grounded) this._coyoteT = COYOTE;
      else this._coyoteT = Math.max(0, this._coyoteT - dt);

      // catat tombol jump: edge press → isi buffer
      if (input.isPressed("jump")) this._jumpBufT = BUF;
      else this._jumpBufT = Math.max(0, this._jumpBufT - dt);

      // eksekusi jump bila memenuhi syarat (buffer + coyote / grounded)
      if (this._jumpBufT > 0 && (this.grounded || this._coyoteT > 0)) {
        this.vy = -JUMPV;
        this.grounded = false;
        this._coyoteT = 0;
        this._jumpBufT = 0;
      }

      // cut jump: jika tombol dilepas saat naik, potong kecepatan
      if (input.isReleased("jump") && this.vy < 0) {
        this.vy *= CUTFAC;
      }

    } else if (mode === "topdown") {
      this.vx = dx * this.speed;
      this.vy = dy * this.speed;
    }
  }

  render(glRenderer, projection, alpha = 1) {
    const rx = this.prevX + (this.x - this.prevX) * alpha;
    const ry = this.prevY + (this.y - this.prevY) * alpha;
    this.image.drawImage(rx, ry, this.width, this.height, projection);
  }

  getLayer() { return this.layer; }
}
