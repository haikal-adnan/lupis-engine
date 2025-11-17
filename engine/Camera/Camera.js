// engine/Camera/Camera.js

export default class Camera {
    constructor(x = 0, y = 0) {
        this.x = x;     // world center
        this.y = y;

        this.prevX = x;
        this.prevY = y;

        this.scale = 1;
        this.lerp = 0.1;
        this.pixelLock = false;
    }

    // =========================================================
    // FOLLOW PLAYER (world-centered coordinate)
    // =========================================================
    updateFollow(player, dt) {
        // if (!player) return;

        // // target = pusat player
        // const targetX = player.x + player.width / 2;
        // const targetY = player.y + player.height / 2;

        // this.prevX = this.x;
        // this.prevY = this.y;

        // const k = this.lerp * dt;

        // let nx = this.x + (targetX - this.x) * k;
        // let ny = this.y + (targetY - this.y) * k;

        // if (this.pixelLock) {
        //     nx = Math.round(nx);
        //     ny = Math.round(ny);
        // }

        // this.x = nx;
        // this.y = ny;
    }

    // =========================================================
    // INTERPOLATION
    // =========================================================
    getInterpolated(alpha) {
        return {
            x: this.prevX + (this.x - this.prevX) * alpha,
            y: this.prevY + (this.y - this.prevY) * alpha,
            scale: this.scale
        };
    }
}
