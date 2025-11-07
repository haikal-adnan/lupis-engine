// utils/Entity/Player.js
import Entity from "@engine/Entity/Entity.js";

export default class EntityPlayer extends Entity {
  constructor(image, x, y, options = {}) {
    super(x, y, options.width ?? 32, options.height ?? 32);
    this.image = image;
    this.type = "player";

    this.vx = 0;
    this.vy = 0;
    this.direction = "down";
    this.pixelArt = options.pixelArt ?? true;

    // konfigurasi tambahan
    this.speed = options.speed ?? 150;
    this.jumpVelocity = options.jumpVelocity ?? 600;
    this.cutJumpFactor = options.cutJumpFactor ?? 0.5;
    this.prevX = x;
    this.prevY = y;
  }
}
