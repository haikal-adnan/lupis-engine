import Config from "../Core/Config.js";

export default class Camera {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;

        this.prevX = x;
        this.prevY = y;

        this.scale = 1;

        this.lerp = 0.1;
        this.pixelLock = false;
    }

    updateFollow(player, dt) {
        if (!player) return;

        const targetX = player.x + player.width / 2;
        const targetY = player.y + player.height / 2;

        this.prevX = this.x;
        this.prevY = this.y;

        const k = this.lerp * dt;

        let nx = this.x + (targetX - this.x) * k;
        let ny = this.y + (targetY - this.y) * k;

        if (this.pixelLock) {
            nx = Math.round(nx);
            ny = Math.round(ny);
        }

        this.x = nx;
        this.y = ny;
    }

    getInterpolated(alpha) {
        if (Config.ENGINE_MODE === "editor") {
            return {
                x: this.x,
                y: this.y,
                scale: this.scale
            };
        }

        return {
            x: this.prevX + (this.x - this.prevX) * alpha,
            y: this.prevY + (this.y - this.prevY) * alpha,
            scale: this.scale
        };
    }
}
