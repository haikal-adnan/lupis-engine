import Config from "../Core/Config.js";

export default class GameLoop {
  constructor(game) {
    this.game = game;
    this.fps = Math.max(1, Config.TICK_RATE || 60);
    this.interval = 1000 / this.fps;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = null;
  }

  loop(now) {
    let delta = now - this.lastTime;
    this.lastTime = now;
    
    if (delta > 1000) delta = this.interval;

    if (Config.ENGINE_MODE === "editor") {
        this.game.update(delta / 1000); 
        this.game.render(1); 
    } 
    else {
        this.accumulator += delta;

        while (this.accumulator >= this.interval) {
            this.game.update(this.interval / 1000);
            this.accumulator -= this.interval;
        }

        this.game.render(this.accumulator / this.interval);
    }

    this.rafId = requestAnimationFrame(t => this.loop(t));
  }

  start() {
    if (this.rafId) return;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(t => this.loop(t));
  }

  stop() {
    if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
    }
  }
}