import Config from "../Config/Config.js";

export default class GameLoop {
  constructor(game) {
    this.game = game;

    // Target FPS (gunakan nilai default aman)
    this.fps = Math.max(1, Config.TICK_RATE || 60);
    this.interval = 1000 / this.fps;

    this.lastTime = performance.now();
    this.accumulator = 0;
  }

  loop(now) {
    // --- Delta time & accumulator ---
    let delta = now - this.lastTime;
    this.lastTime = now;

    // Hindari lompatan waktu ekstrem (misal tab pindah)
    if (delta > 1000) delta = this.interval;
    this.accumulator += delta;

    // --- Fixed update (seperti di contoh) ---
    while (this.accumulator >= this.interval) {
      this.game.update(this.interval / 1000);
      this.accumulator -= this.interval;
    }

    // --- Interpolasi render ---
    const alpha = this.accumulator / this.interval;
    this.game.render(alpha);

    // --- Frame berikutnya ---
    requestAnimationFrame(t => this.loop(t));
  }

  start() {
    this.lastTime = performance.now();
    this.accumulator = 0;
    requestAnimationFrame(t => this.loop(t));
  }
}
