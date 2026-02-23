export class AutoPanner {
    constructor(game, canvas) {
        this.game = game;
        this.canvas = canvas;
        this.vel = { x: 0, y: 0 };
        this.lastTime = 0;
        this.insets = { top: 0, left: 0, right: 0, bottom: 0 };
    }

    calculateInsets() {
        const topEl = document.getElementById("editor-topbar");
        const leftEl = document.getElementById("editor-sidebar-left");
        const rightEl = document.getElementById("editor-sidebar-right");
        this.insets = {
            top: topEl ? topEl.offsetHeight : 0,
            left: leftEl ? leftEl.offsetWidth : 0,
            right: rightEl ? rightEl.offsetWidth : 0,
            bottom: 0
        };
    }

    apply(px, py) {
        const rect = this.canvas.getBoundingClientRect();
        if (!rect) return;

        const W = rect.width;
        const H = rect.height;
        const scaleX = this.canvas.width / W;
        const scaleY = this.canvas.height / H;
        const cssX = px / scaleX;
        const cssY = py / scaleY;

        const margin = 50;
        const maxSpeed = 600;

        let vx = 0;
        let vy = 0;

        const getSpeed = (dist) =>
            dist <= 0 ? 0 : maxSpeed * Math.min(1.5, dist / margin) ** 2;

        const distLeft = (this.insets.left + margin) - cssX;
        if (distLeft > 0) vx = -getSpeed(distLeft);

        const distRight = cssX - (W - this.insets.right - margin);
        if (distRight > 0) vx = getSpeed(distRight);

        const distTop = (this.insets.top + margin) - cssY;
        if (distTop > 0) vy = -getSpeed(distTop);

        const distBottom = cssY - (H - this.insets.bottom - margin);
        if (distBottom > 0) vy = getSpeed(distBottom);

        this.vel.x = Math.min(maxSpeed, Math.max(-maxSpeed, this.vel.x + vx));
        this.vel.y = Math.min(maxSpeed, Math.max(-maxSpeed, this.vel.y + vy));
    }

    update() {
        const now = performance.now();
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        if (Math.abs(this.vel.x) < 0.01 && Math.abs(this.vel.y) < 0.01) return;

        const cam = this.game.camera;
        const scale = Math.max(0.001, cam.scale);

        cam.x += (this.vel.x / scale) * dt;
        cam.y += (this.vel.y / scale) * dt;

        this.vel.x *= 0.85;
        this.vel.y *= 0.85;
    }
}