import { MapToCanvasPixels } from "../Util/MapToCanvasPixels.js";

export default class Touch {
    constructor(canvas) {
        this.canvas = canvas;

        this.touches = [];
        this.active = false;
        this.lockScroll = false;

        this._globalBlocker = e => {
            if (this.lockScroll) {
                e.preventDefault();
            }
        };
        document.addEventListener("touchmove", this._globalBlocker, { passive:false });

        this._start = e => {
            this.lockScroll = true;
            this.active = true;
            e.preventDefault();
            this._updateTouches(e);
        };

        this._move = e => {
            if (this.lockScroll) {
                e.preventDefault();
            }
            this._updateTouches(e);
        };

        this._end = e => {
            if (this.lockScroll) e.preventDefault();
            this._updateTouches(e);
            if (e.touches.length === 0) {
                this.active = false;
                this.lockScroll = false;
            }
        };

        canvas.addEventListener("touchstart",  this._start,  { passive:false });
        canvas.addEventListener("touchmove",   this._move,   { passive:false });
        canvas.addEventListener("touchend",    this._end,    { passive:false });
        canvas.addEventListener("touchcancel", this._end,    { passive:false });

        this._blockPTR = e => {
            if (this.lockScroll && window.scrollY === 0) {
                e.preventDefault();
            }
        };
        window.addEventListener("touchmove", this._blockPTR, { passive:false });

        this.canvas.style.touchAction = "none";
    }

    _updateTouches(e) {
        this.touches = [];
        for (let t of e.touches) {
            const p = MapToCanvasPixels(
                { clientX: t.clientX, clientY: t.clientY },
                this.canvas
            );
            this.touches.push({ x: p.px, y: p.py });
        }
    }

    destroy() {
        document.removeEventListener("touchmove", this._globalBlocker, { passive:false });
        window.removeEventListener("touchmove", this._blockPTR, { passive:false });
    }
}
