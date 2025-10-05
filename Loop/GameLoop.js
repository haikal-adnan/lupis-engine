// GameLoop.js

// Ini testing
import Config from "../Config/Config.js";

export default class GameLoop {
  constructor(game) {
    this.game = game; // instance dari class Game
    this.fps = Config.TICK_RATE || 60;
    this.interval = 1000 / this.fps;

    this.lastTime = performance.now();
    this.accumulator = 0;
  }

  loop(now) {
    let delta = now - this.lastTime;
    this.lastTime = now;
    this.accumulator += delta;

    // update sesuai tick rate
    while (this.accumulator >= this.interval) {
      this.game.update(this.interval / 1000);
      this.accumulator -= this.interval;
    }

    // interpolasi render
    let alpha = this.accumulator / this.interval;
    this.game.render(alpha);

    requestAnimationFrame(t => this.loop(t));
  }

  start() {
    requestAnimationFrame(t => this.loop(t));
  }
}
