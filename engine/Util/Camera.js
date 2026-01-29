import Config from "../Core/Config.js";

export default class Camera {
    constructor(x = 0, y = 0) {
        this.x = isNaN(x) ? 0 : x;
        this.y = isNaN(y) ? 0 : y;

        this.prevX = this.x;
        this.prevY = this.y;

        this.scale = 1;

        this.target = null;
        this.offset = { x: 0, y: 0 }; 
        this.lerp = 0.5;
        this.pixelLock = false;
    }

    setTarget(entity, speed = 0.1, offset = { x: 0, y: 0 }) {
        this.target = entity;
        this.lerp = (typeof speed === 'number' && !isNaN(speed)) ? speed : 0.1;
        this.offset = {
            x: (offset && typeof offset.x === 'number') ? offset.x : 0,
            y: (offset && typeof offset.y === 'number') ? offset.y : 0
        };
    }

    clearTarget() {
        this.target = null;
    }

    update(dt) {
        if (!this.target || this.target._isDestroyed) return;

        this.prevX = this.x;
        this.prevY = this.y;

        if (isNaN(this.x)) this.x = 0;
        if (isNaN(this.y)) this.y = 0;

        this.prevX = this.x;
        this.prevY = this.y;

        let tX = 0, tY = 0, tW = 0, tH = 0;

        if (this.target.components && this.target.components.Transform) {
            const transform = this.target.components.Transform;
            tX = Number(transform.x) || 0;
            tY = Number(transform.y) || 0;
            tW = Number(transform.width) || 0;
            tH = Number(transform.height) || 0;
        }

        const desiredX = tX + this.offset.x;
        const desiredY = tY + this.offset.y;

        const safeDt = dt || 0.016; 
        const k = 1 - Math.pow(1 - this.lerp, safeDt * 60.0); 

        let nx = this.x + (desiredX - this.x) * k;
        let ny = this.y + (desiredY - this.y) * k;

        this.x = isNaN(nx) ? this.x : nx;
        this.y = isNaN(ny) ? this.y : ny;
    }
    
    getInterpolated(alpha) {
        if (Config.ENGINE_MODE === "editor") {
            return { x: this.x, y: this.y, scale: this.scale };
        }
        const a = isNaN(alpha) ? 0 : alpha;
        return {
            x: this.prevX + (this.x - this.prevX) * a,
            y: this.prevY + (this.y - this.prevY) * a,
            scale: this.scale
        };
    }
}