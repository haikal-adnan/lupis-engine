// engine/Editor/Grid.js
import { bus } from "../Util/EventBus.js";

export default class Grid {
    constructor(world, game, canvas, renderer, camera, opt = {}) {
        this.world = world;
        this.game = game;
        this.canvas = canvas;
        this.renderer = renderer;
        this.camera = camera;

        this.color = opt.color || "#ffffff";
        this.alpha = opt.alpha || 0.15;
        this.width = opt.width || 50;
        this.height = opt.height || 50;

        this.enabled = true;

        bus.on("editor:grid:toggle", () => {
            this.enabled = !this.enabled;
        });

        world.gridRenderer = (shape, projection) => {
            this.render(shape, projection);
        };
    }

    render(shape, projection) {
        if (!this.enabled) return;

        const cam = this.camera;
        const w = this.width;
        const h = this.height;

        const rectW = this.canvas.width / cam.scale;
        const rectH = this.canvas.height / cam.scale;

        const left = cam.x - rectW * 0.5;
        const right = cam.x + rectW * 0.5;
        const top = cam.y - rectH * 0.5;
        const bottom = cam.y + rectH * 0.5;

        const startX = Math.floor(left / w) * w;
        const endX   = Math.ceil(right / w) * w;

        const startY = Math.floor(top / h) * h;
        const endY   = Math.ceil(bottom / h) * h;

        const rgba = this._hexToRGBA(this.color, this.alpha);

        for (let x = startX; x <= endX; x += w) {
            shape.drawLine(x, top, x, bottom, rgba, 1 / cam.scale, projection);
        }

        for (let y = startY; y <= endY; y += h) {
            shape.drawLine(left, y, right, y, rgba, 1 / cam.scale, projection);
        }
    }

    _hexToRGBA(hex, alpha) {
        const h = hex.replace("#", "");
        const r = parseInt(h.slice(0,2),16) / 255;
        const g = parseInt(h.slice(2,4),16) / 255;
        const b = parseInt(h.slice(4,6),16) / 255;
        return [r,g,b,alpha];
    }
}
