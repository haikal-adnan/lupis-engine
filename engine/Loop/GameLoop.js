import Config from "../Core/Config.js";

export default class GameLoop {
    constructor(game) {
        this.game = game;
        
        this.fps = Math.max(1, this.game.world.settings.tickRate || 60);
        this.interval = 1000 / this.fps;
        
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.rafId = null;
        
        this.isFirstFrame = true; 
    }

    loop(now) {
        const currentTickRate = Math.max(1, this.game.world.settings.tickRate || 60);
        if (this.fps !== currentTickRate) {
            this.fps = currentTickRate;
            this.interval = 1000 / this.fps;
        }

        let delta = now - this.lastTime;
        this.lastTime = now;

        if (delta > 100) delta = this.interval;

        if (Config.ENGINE_MODE === "editor") {
            this.game.update(delta / 1000);
            this.game.render(1);
        } else {
            if (!this.game.isPaused) {
                if (this.isFirstFrame && this.accumulator < this.interval) {
                    this.accumulator = this.interval;
                }

                this.accumulator += delta;
                while (this.accumulator >= this.interval) {
                    this.game.update(this.interval / 1000);
                    this.accumulator -= this.interval;
                }
            } else {
                this.accumulator = 0;
            }

            const alpha = this.accumulator / this.interval;

            if (this.isFirstFrame) {
                this.isFirstFrame = false;
            } else {
                this.game.render(alpha); 
            }
        }

        if (this.game.isRunning) {
            this.rafId = requestAnimationFrame(t => this.loop(t));
        }
    }

    start() {
        if (this.game.isRunning) return;
        this.game.isRunning = true;
        
        this.isFirstFrame = true;
        
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.rafId = requestAnimationFrame(t => this.loop(t));
    }

    stop() {
        this.game.isRunning = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
}