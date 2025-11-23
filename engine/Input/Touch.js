import { MapToCanvasPixels } from "../Util/MapToCanvasPixels.js";

export default class Touch {
    constructor(canvas) {
        this.canvas = canvas;

        this.touches = [];
        this.active = false;

        // apakah sedang lock scroll
        this.lockScroll = false;

        // GLOBAL handler - tapi hanya active jika lockScroll = true
        this._globalBlocker = e => {
            if (this.lockScroll) {
                e.preventDefault();   // block scroll hanya saat mode aktif
            }
        };
        document.addEventListener("touchmove", this._globalBlocker, { passive:false });

        // ==== CANVAS EVENTS ====
        this._start = e => {
            // Jika sentuhan dimulai dari canvas → aktifkan lock scroll
            this.lockScroll = true;
            this.active = true;

            e.preventDefault(); // block gesture browser
            this._updateTouches(e);
        };

        this._move = e => {
            if (this.lockScroll) {
                e.preventDefault(); // block only when started on canvas
            }
            this._updateTouches(e);
        };

        this._end = e => {
            if (this.lockScroll) e.preventDefault();

            this._updateTouches(e);
            if (e.touches.length === 0) {
                this.active = false;
                this.lockScroll = false; // ==== sangat penting
            }
        };

        canvas.addEventListener("touchstart",  this._start,  { passive:false });
        canvas.addEventListener("touchmove",   this._move,   { passive:false });
        canvas.addEventListener("touchend",    this._end,    { passive:false });
        canvas.addEventListener("touchcancel", this._end,    { passive:false });

        // ONLY prevent pull-to-refresh when touching canvas
        this._blockPTR = e => {
            if (this.lockScroll && window.scrollY === 0) {
                e.preventDefault();
            }
        };
        window.addEventListener("touchmove", this._blockPTR, { passive:false });

        // canvas-only gesture control
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
