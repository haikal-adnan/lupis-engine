import { MapToCanvasPixels } from "../Util/MapToCanvasPixels.js";

export default class Mouse {
    constructor(canvas, eventManager) {
        this.canvas = canvas;
        this.eventManager = eventManager; 
        this.x = 0;
        this.y = 0;
        this.buttons = new Set();
        this.pressedButtons = new Set();
        this.releasedButtons = new Set();
        this.wheel = 0;

        this._move = e => {
            if (!this.canvas || typeof this.canvas.getBoundingClientRect !== "function") return;

            const p = MapToCanvasPixels(e, this.canvas);
            this.x = p.px;
            this.y = p.py;
            
            if (this.eventManager) {
                this.eventManager.emit("input:pointermove", { x: this.x, y: this.y });
            }
        };

        this._down = e => {
            if (!this.buttons.has(e.button)) {
                this.pressedButtons.add(e.button);
            }
            this.buttons.add(e.button);

            let px = this.x;
            let py = this.y;
            if (this.canvas && typeof this.canvas.getBoundingClientRect === "function") {
                const p = MapToCanvasPixels(e, this.canvas);
                px = p.px;
                py = p.py;
            }
            
            if (this.eventManager) {
                const btnLabel = e.button === 0 ? 'left' : (e.button === 2 ? 'right' : 'middle');
                this.eventManager.emit("input:pointerdown", { 
                    button: btnLabel, 
                    x: px, 
                    y: py 
                });
            }
        };

        this._up = e => {
            if (this.buttons.has(e.button)) {
                this.buttons.delete(e.button);
                this.releasedButtons.add(e.button);

                let px = this.x;
                let py = this.y;
                if (this.canvas && typeof this.canvas.getBoundingClientRect === "function") {
                    const p = MapToCanvasPixels(e, this.canvas);
                    px = p.px;
                    py = p.py;
                }
                
                if (this.eventManager) {
                    this.eventManager.emit("input:pointerup", { 
                        button: e.button, 
                        x: px, 
                        y: py 
                    });
                }
            }
        };

        this._wheel = e => {
            e.preventDefault();
            this.wheel += e.deltaY;
        };

        this._contextMenu = e => e.preventDefault();

        this._blur = () => {
            this.buttons.clear();
            this.pressedButtons.clear();
            this.releasedButtons.clear();
        };
        window.addEventListener("blur", this._blur);

        if (this.canvas && typeof this.canvas.addEventListener === "function") {
            this.canvas.addEventListener("contextmenu", this._contextMenu);
            this.canvas.addEventListener("mousemove", this._move);
            this.canvas.addEventListener("mousedown", this._down);
            this.canvas.addEventListener("wheel", this._wheel, { passive: false });
            window.addEventListener("mouseup", this._up);
        }
    }

    isDown(btn) {
        const code = typeof btn === 'string' ? (btn === 'left' ? 0 : btn === 'right' ? 2 : 1) : btn;
        return this.buttons.has(code);
    }

    isPressed(btn) {
        const code = typeof btn === 'string' ? (btn === 'left' ? 0 : btn === 'right' ? 2 : 1) : btn;
        return this.pressedButtons.has(code);
    }

    isReleased(btn) {
        const code = typeof btn === 'string' ? (btn === 'left' ? 0 : btn === 'right' ? 2 : 1) : btn;
        return this.releasedButtons.has(code);
    }

    endFrame() {
        this.pressedButtons.clear();
        this.releasedButtons.clear();
    }

    consumeWheel() {
        const v = this.wheel;
        this.wheel = 0;
        return v;
    }

    destroy() {
        if (this.canvas && typeof this.canvas.removeEventListener === "function") {
            this.canvas.removeEventListener("mousemove", this._move);
            this.canvas.removeEventListener("mousedown", this._down);
            this.canvas.removeEventListener("wheel", this._wheel);
            this.canvas.removeEventListener("contextmenu", this._contextMenu);
        }
        window.removeEventListener("mouseup", this._up);
        window.removeEventListener("blur", this._blur);
    }
}