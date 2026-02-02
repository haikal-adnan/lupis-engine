import { MapToCanvasPixels } from "../Util/MapToCanvasPixels.js";

export default class Mouse {
    constructor(canvas, eventManager) {
        this.canvas = canvas;
        this.eventManager = eventManager; 
        this.x = 0;
        this.y = 0;
        this.buttons = new Set();
        this.wheel = 0;

        // Handler Move (Tetap di canvas agar koordinat akurat relatif canvas)
        this._move = e => {
            const p = MapToCanvasPixels(e, this.canvas);
            this.x = p.px;
            this.y = p.py;
            
            if (this.eventManager) {
                this.eventManager.emit("input:pointermove", { x: this.x, y: this.y });
            }
        };

        // Handler Down (Tetap di canvas)
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

        // Handler Up (DIPINDAHKAN ke Window)
        // Agar jika mouse dilepas di luar canvas, status klik tetap terhapus
        this._up = e => {
            // Cek apakah tombol memang sedang ditekan sebelumnya
            if (this.buttons.has(e.button)) {
                this.buttons.delete(e.button);
                const p = MapToCanvasPixels(e, this.canvas);
                
                if (this.eventManager) {
                    this.eventManager.emit("input:pointerup", { 
                        button: e.button, 
                        x: p.px, 
                        y: p.py 
                    });
                }
            }
        };

        this._wheel = e => {
            e.preventDefault();
            this.wheel += e.deltaY;
        };

        // Event listener setup
        this.canvas.addEventListener("mousemove", this._move);
        this.canvas.addEventListener("mousedown", this._down);
        this.canvas.addEventListener("wheel", this._wheel, { passive: false });
        
        // PENTING: Listen mouseup di window
        window.addEventListener("mouseup", this._up);
        
        // Tambahan: Reset jika window kehilangan fokus (Alt-Tab)
        this._blur = () => {
            this.buttons.clear();
        };
        window.addEventListener("blur", this._blur);
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
        this.canvas.removeEventListener("wheel", this._wheel);
        
        // Bersihkan listener window
        window.removeEventListener("mouseup", this._up);
        window.removeEventListener("blur", this._blur);
    }
}