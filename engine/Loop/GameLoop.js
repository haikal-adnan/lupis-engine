import Config from "../Config/Config.js";

export default class GameLoop {
  constructor(game) {
    this.game = game;
    this.fps = Math.max(1, Config.TICK_RATE || 60);
    this.interval = 1000 / this.fps;
    this.lastTime = performance.now();
    this.accumulator = 0;
  }

  loop(now) {
    let delta = now - this.lastTime;
    this.lastTime = now;
    if (delta > 1000) delta = this.interval;
    this.accumulator += delta;

    while (this.accumulator >= this.interval) {
      if (Config.ENGINE_MODE === "runtime") {
        this.game.update(this.interval / 1000);
      }
      this.accumulator -= this.interval;
    }

    this.game.render(this.accumulator / this.interval);
    requestAnimationFrame(t => this.loop(t));
  }

  start() {
    this.lastTime = performance.now();
    this.accumulator = 0;
    requestAnimationFrame(t => this.loop(t));
  }
}
