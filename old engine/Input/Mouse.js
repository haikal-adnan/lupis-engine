import { MapToCanvasPixels } from "../Util/MapToCanvasPixels.js";

export default class Mouse {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = 0;
        this.y = 0;
        this.buttons = new Set();

        // QUEUE, bukan single number!
        this.wheel = 0;

        this._move = e => {
            const p = MapToCanvasPixels(e, this.canvas);
            this.x = p.px;
            this.y = p.py;
        };

        this._down = e => this.buttons.add(e.button);
        this._up   = e => this.buttons.delete(e.button);

        this._wheel = e => {
            e.preventDefault();
            this.wheel += e.deltaY; // accumulate!
        };

        canvas.addEventListener("mousemove", this._move);
        canvas.addEventListener("mousedown", this._down);
        canvas.addEventListener("mouseup",   this._up);
        canvas.addEventListener("wheel",     this._wheel, { passive:false });
    }

    isDown(btn) { return this.buttons.has(btn); }

    consumeWheel() {
        const v = this.wheel;
        this.wheel = 0;
        return v;
    }
}
