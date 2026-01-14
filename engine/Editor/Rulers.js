import { HexToVec4 } from "../Util/HexToVec4.js";

export default class Rulers {
    constructor(game) {
        this.game = game;
        
        // Config Tampilan ala Figma
        this.thickness = 20; // Sedikit lebih tipis agar elegan
        
        // Warna
        this.bgColor = HexToVec4("#1e1e1e");   // Gelap (Background)
        this.lineColor = HexToVec4("#88888869"); // Abu-abu (Tick marks)
        this.textColor = HexToVec4("#888888"); // Teks agak redup
        
        this.fontSize = 9;
        this.tickSize = 15; // Panjang garis strip
    }

    render(ui) {
        const cam = this.game.camera;
        const width = this.game.renderer.canvas.width;
        const height = this.game.renderer.canvas.height;
        
        // 1. Gambar Background Bars
        ui.fillRect(0, 0, width, this.thickness, this.bgColor);         // Top
        ui.fillRect(0, 0, this.thickness, height, this.bgColor);        // Left
        ui.fillRect(0, 0, this.thickness, this.thickness, this.bgColor); // Corner

        const rectW = width / cam.scale;
        const rectH = height / cam.scale;
        
        const viewWorldLeft = cam.x - rectW * 0.5;
        const viewWorldTop = cam.y - rectH * 0.5;

        const step = this._calculateStep(cam.scale);

        // --- TOP RULER (X Axis) ---
        const startX = Math.floor(viewWorldLeft / step) * step;
        const endX = viewWorldLeft + rectW; 

        for (let wx = startX; wx <= endX; wx += step) {
            const screenX = (wx - viewWorldLeft) * cam.scale;

            if (screenX < this.thickness) continue;

            // Tick (Strip): Posisi di bawah (menempel ke canvas)
            // Dari y = thickness - tickSize sampai y = thickness
            ui.fillRect(
                screenX, 
                this.thickness - this.tickSize, 
                1, 
                this.tickSize, 
                this.lineColor
            );

            // Angka: Di atas strip
            ui.drawText(
                Math.round(wx).toString(), 
                screenX + 3, // Sedikit geser kanan dari strip
                4,           // Padding atas
                this.fontSize, 
                this.textColor
            );
        }

        // --- LEFT RULER (Y Axis) ---
        const startY = Math.floor(viewWorldTop / step) * step;
        const endY = viewWorldTop + rectH;

        // Rotasi -90 derajat (dalam radian)
        const rotation = -Math.PI / 2;

        for (let wy = startY; wy <= endY; wy += step) {
            const screenY = (wy - viewWorldTop) * cam.scale;

            if (screenY < this.thickness) continue;

            // Tick (Strip): Posisi di kanan (menempel ke canvas)
            // Dari x = thickness - tickSize sampai x = thickness
            ui.fillRect(
                this.thickness - this.tickSize, 
                screenY, 
                this.tickSize, 
                1, 
                this.lineColor
            );

            // Angka: ROTATE -90 Derajat
            // x: di tengah ruler secara horizontal
            // y: sejajar dengan strip (nanti diputar)
            ui.drawText(
                Math.round(wy).toString(), 
                this.thickness / 2 - 2, // Posisi X (agak kiri dikit biar centered vertikal pas muter)
                screenY + 3,            // Posisi Y (geser bawah dikit karena rotasi pivot)
                this.fontSize, 
                this.textColor,
                null,       // font (default)
                rotation    // ROTASI DI SINI
            );
        }
        
        // Garis Pembatas Halus (Border dengan Canvas)
        ui.fillRect(0, this.thickness, width, 1, this.lineColor);      // Horizontal line
        ui.fillRect(this.thickness, 0, 1, height, this.lineColor);     // Vertical line
    }

    _calculateStep(scale) {
        // Step logic tetap sama, sudah oke
        const screenStep = 100;
        const worldStep = screenStep / scale;
        const magnitude = Math.pow(10, Math.floor(Math.log10(worldStep)));
        const residual = worldStep / magnitude;

        if (residual > 5) return 10 * magnitude;
        if (residual > 2) return 5 * magnitude;
        if (residual > 1) return 2 * magnitude;
        return magnitude;
    }
}