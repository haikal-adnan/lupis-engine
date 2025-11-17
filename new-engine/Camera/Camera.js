// engine/Camera/Camera.js

import Config from "../Config/Config.js";

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export default class Camera {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;

        this.prevX = x;
        this.prevY = y;

        this.scale = 1;
        this.lerp = Config.CAMERA.LERP || 0.1;
        this.pixelLock = Config.CAMERA.PIXEL_LOCK && Config.PIXEL_ART;
    }

    updateFollow(player, dt, worldW, worldH, viewW, viewH) {
        if (!player) return;

        const halfW = viewW / 2 / this.scale;
        const halfH = viewH / 2 / this.scale;

        const targetX = clamp(
            player.x + player.width / 2 - halfW,
            0,
            worldW - halfW * 2
        );

        const targetY = clamp(
            player.y + player.height / 2 - halfH,
            0,
            worldH - halfH * 2
        );

        const k = this.lerp * dt;

        this.prevX = this.x;
        this.prevY = this.y;

        const nx = this.x + (targetX - this.x) * k;
        const ny = this.y + (targetY - this.y) * k;

        this.x = this.pixelLock ? Math.round(nx) : nx;
        this.y = this.pixelLock ? Math.round(ny) : ny;
    }

    getInterpolated(alpha) {
        return {
            x: this.prevX + (this.x - this.prevX) * alpha,
            y: this.prevY + (this.y - this.prevY) * alpha,
            scale: this.scale
        };
    }
}
