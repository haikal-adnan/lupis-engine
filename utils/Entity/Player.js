export default class Player {
  /**
   * @param {GLImage} image - gambar/sprite pemain
   * @param {number} x - posisi awal X
   * @param {number} y - posisi awal Y
   * @param {object} options - konfigurasi pemain
   * @param {number} options.width - lebar pemain (px)
   * @param {number} options.height - tinggi pemain (px)
   * @param {number} options.speed - kecepatan dasar
   * @param {number} options.jumpVelocity - kecepatan lompatan (platformer)
   * @param {number} options.cutJumpFactor - pengurang lompatan saat dilepas
   * @param {boolean} options.pixelArt - apakah pakai rounding pixel
   * @param {string} layer - nama layer entity
   */
  constructor(image, x = 0, y = 0, options = {}, layer = "PLAYER") {
    this.image = image;
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.direction = "down";
    this.layer = layer;

    // konfigurasi
    this.width = options.width ?? 32;
    this.height = options.height ?? 32;
    this.speed = options.speed ?? 150;
    this.jumpVelocity = options.jumpVelocity ?? 600;
    this.cutJumpFactor = options.cutJumpFactor ?? 0.5;
    this.pixelArt = options.pixelArt ?? false;
  }

  // update(dt, input, mode = "platformer") {
  //   const { x: dx, y: dy, dir } = input.getDirection?.() || { x: 0, y: 0 };
  //   if (dir) this.direction = dir;

  //   if (mode === "platformer") {
  //     this.vx = dx * this.speed;
  //     if (input.isReleased?.("jump") && this.vy < 0)
  //       this.vy *= this.cutJumpFactor;
  //   } else {
  //     this.vx = dx * this.speed;
  //     this.vy = dy * this.speed;
  //   }
  // }

  update(dt, input, mode = "platformer") {
    // Simpan posisi sebelumnya sebelum berubah
    this.prevX = this.x;
    this.prevY = this.y;

    const { x: dx, y: dy, dir } = input.getDirection?.() || { x: 0, y: 0 };
    if (dir) this.direction = dir;

    // Gunakan kecepatan berdasarkan dt
    const move = this.speed * dt;
    this.x += dx * move;
    this.y += dy * move;
  }

  postCollisionJump(input, landed) {
    if (!this.grounded) return;
    if (landed && input.isDown?.("jump")) {
      this.vy = -this.jumpVelocity;
      this.grounded = false;
    } else if (input.isPressed?.("jump")) {
      this.vy = -this.jumpVelocity;
      this.grounded = false;
    }
  }

  render(glRenderer, projection, alpha = 1, strict = false) {
    const rx = strict ? this.x : this.prevX + (this.x - this.prevX) * alpha;
    const ry = strict ? this.y : this.prevY + (this.y - this.prevY) * alpha;
    const fx = strict && this.pixelArt ? Math.round(rx) : rx;
    const fy = strict && this.pixelArt ? Math.round(ry) : ry;

    this.image?.drawImage(fx, fy, this.width, this.height, projection);
  }
}
