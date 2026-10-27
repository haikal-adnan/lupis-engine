import Config from "../Core/Config.js";

export default class Camera {
    constructor(x = 0, y = 0) {
        this.x = isNaN(x) ? 0 : x;
        this.y = isNaN(y) ? 0 : y;
        this.scale = 1;
        this.target = null;
        this.offset = { x: 0, y: 0 }; 
        this.lerp = 0.5;
        this.isFirstFrameTracking = false; 
    }

    snapTo(x, y) {
        this.x = x;
        this.y = y;
    }

    setTarget(entity, speed = 0.1, offset = { x: 0, y: 0 }) {
        this.target = entity;
        this.lerp = (typeof speed === 'number' && !isNaN(speed)) ? speed : 0.1;
        this.offset = {
            x: (offset && typeof offset.x === 'number') ? offset.x : 0,
            y: (offset && typeof offset.y === 'number') ? offset.y : 0
        };
        this.isFirstFrameTracking = true; 
    }

    clearTarget() {
        this.target = null;
        this.lerp = 0.5;
        this.isFirstFrameTracking = false;
    }

    update(dt, world, canvas) {
        if (this.target && !this.target._isDestroyed) {
            let tX = 0, tY = 0;
            if (this.target.components && this.target.components.Transform) {
                const transform = this.target.components.Transform;
                tX = Number(transform.x) || 0;
                tY = Number(transform.y) || 0;
            }

            const desiredX = tX + this.offset.x;
            const desiredY = tY + this.offset.y;

            if (this.isFirstFrameTracking) {
                this.x = desiredX;
                this.y = desiredY;
                this.isFirstFrameTracking = false;
            } else {
                const safeDt = dt || 0.016; 
                const k = 1 - Math.pow(1 - this.lerp, safeDt * 60.0); 

                let nx = this.x + (desiredX - this.x) * k;
                let ny = this.y + (desiredY - this.y) * k;

                this.x = isNaN(nx) ? this.x : nx;
                this.y = isNaN(ny) ? this.y : ny;
            }
        }

        if (isNaN(this.x)) this.x = 0;
        if (isNaN(this.y)) this.y = 0;

        if (world && canvas && world.settings?.worldBounds?.active) {
            this._applyClamp(world.settings.worldBounds, canvas);
        }
    }

    _applyClamp(bounds, canvas) {
        const viewW = canvas.width / this.scale;
        const viewH = canvas.height / this.scale;
        const halfW = viewW / 2;
        const halfH = viewH / 2;

        const boundsW = bounds.x2 - bounds.x1;
        const boundsH = bounds.y2 - bounds.y1;

        if (boundsW < viewW) {
            this.x = bounds.x1 + boundsW / 2;
        } else {
            const minX = bounds.x1 + halfW;
            const maxX = bounds.x2 - halfW;
            this.x = Math.max(minX, Math.min(this.x, maxX));
        }

        if (boundsH < viewH) {
            this.y = bounds.y1 + boundsH / 2;
        } else {
            const minY = bounds.y1 + halfH;
            const maxY = bounds.y2 - halfH;
            this.y = Math.max(minY, Math.min(this.y, maxY));
        }
    }
}