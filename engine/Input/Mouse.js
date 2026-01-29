import { MapToCanvasPixels } from "../Util/MapToCanvasPixels.js";

export default class Mouse {
    constructor(canvas, eventManager) {
        this.canvas = canvas;
        this.eventManager = eventManager; 
        this.x = 0;
        this.y = 0;
        this.buttons = new Set();
        this.wheel = 0;

        this._move = e => {
            const p = MapToCanvasPixels(e, this.canvas);
            this.x = p.px;
            this.y = p.py;
            
            if (this.eventManager) {
                this.eventManager.emit("input:pointermove", { x: this.x, y: this.y });
            }
        };

        this._down = e => {
            this.buttons.add(e.button);
            const p = MapToCanvasPixels(e, this.canvas);
            
            if (this.eventManager) {
                const btnLabel = e.button === 0 ? 'left' : (e.button === 2 ? 'right' : 'middle');
                this.eventManager.emit("input:pointerdown", { 
                    button: btnLabel, 
                    x: p.px, 
                    y: p.py 
                });
            }
        };

        this._up = e => {
            this.buttons.delete(e.button);
            const p = MapToCanvasPixels(e, this.canvas);
            
            if (this.eventManager) {
                this.eventManager.emit("input:pointerup", { 
                    button: e.button, 
                    x: p.px, 
                    y: p.py 
                });
            }
        };

        this._wheel = e => {
            e.preventDefault();
            this.wheel += e.deltaY;
        };

        canvas.addEventListener("mousemove", this._move);
        canvas.addEventListener("mousedown", this._down);
        canvas.addEventListener("mouseup", this._up);
        canvas.addEventListener("wheel", this._wheel, { passive: false });
    }

    isDown(btn) {
        return this.buttons.has(btn);
    }

    consumeWheel() {
        const v = this.wheel;
        this.wheel = 0;
        return v;
    }

    destroy() {
        this.canvas.removeEventListener("mousemove", this._move);
        this.canvas.removeEventListener("mousedown", this._down);
        this.canvas.removeEventListener("mouseup", this._up);
        this.canvas.removeEventListener("wheel", this._wheel);
    }
}