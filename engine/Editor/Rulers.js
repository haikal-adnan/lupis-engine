import { HexToVec4 } from "../Util/HexToVec4.js";

export default class Rulers {
    constructor(game) {
        this.game = game;
        this.thickness = 20;
        this.fontSize = 9;
        this.tickSize = 15;
        
        // Inisialisasi warna default ke dark mode saat pertama kali dirender
        this.updateColors(true); 
    }

    updateColors(isDark) {
        if (isDark) {
            // Tema Dark Mode (Sesuai aslimu)
            this.bgColor = HexToVec4("#131720");
            this.lineColor = HexToVec4("#88888869");
            this.textColor = HexToVec4("#888888");
        } else {
            // Tema Light Mode
            this.bgColor = HexToVec4("#FFFFFF");
            this.lineColor = HexToVec4("#D1D1D1");
            this.textColor = HexToVec4("#333333");
        }
    }

    render(ui) {
        const cam = this.game.camera;
        const width = this.game.renderer.canvas.width;
        const height = this.game.renderer.canvas.height;

        // 1. Gambar base background (kotak ujung kiri atas belum ditimpa di sini)
        ui.fillRect(0, 0, width, this.thickness, this.bgColor);
        ui.fillRect(0, 0, this.thickness, height, this.bgColor);

        const rectW = width / cam.scale;
        const rectH = height / cam.scale;

        const viewWorldLeft = cam.x - rectW * 0.5;
        const viewWorldTop = cam.y - rectH * 0.5;

        const step = this._calculateStep(cam.scale);

        // --- Render Horizontal Rulers ---
        const startX = Math.floor(viewWorldLeft / step) * step;
        const endX = viewWorldLeft + rectW;

        for (let wx = startX; wx <= endX; wx += step) {
            const screenX = (wx - viewWorldLeft) * cam.scale;
            
            // Jangan proses jika masuk kotak ujung
            if (screenX < this.thickness) continue;

            ui.fillRect(
                screenX,
                this.thickness - this.tickSize,
                1,
                this.tickSize,
                this.lineColor
            );

            // Figma style: Beri sedikit jarak aman agar teks tidak terlalu menempel ke sudut
            if (screenX > this.thickness + 5) {
                ui.drawText(
                    Math.round(wx).toString(),
                    screenX + 3,
                    4,
                    this.fontSize,
                    this.textColor
                );
            }
        }

        // --- Render Vertical Rulers ---
        const startY = Math.floor(viewWorldTop / step) * step;
        const endY = viewWorldTop + rectH;
        const rotation = -Math.PI / 2;

        for (let wy = startY; wy <= endY; wy += step) {
            const screenY = (wy - viewWorldTop) * cam.scale;
            
            if (screenY < this.thickness) continue;

            ui.fillRect(
                this.thickness - this.tickSize,
                screenY,
                this.tickSize,
                1,
                this.lineColor
            );

            const textStr = Math.round(wy).toString();
            // Estimasi panjang teks (kira-kira 6px per karakter untuk fontSize 9)
            // Karena rotasi -90, teks akan "naik" ke atas memakan ruang Y
            const textHeightEst = textStr.length * 6;

            // Figma style: Hanya render angka JIKA ada ruang yang cukup sampai ke kotak batas atas
            if (screenY - textHeightEst > this.thickness + 5) {
                ui.drawText(
                    textStr,
                    this.thickness / 2 - 2, // Parameter X: Geser ke kiri/kanan dari tepi
                    screenY - 5,            // Parameter Y: UBAH DI SINI (sebelumnya + 3, ubah jadi minus agar naik)
                    this.fontSize,
                    this.textColor,
                    null,
                    rotation
                );
            }
        }

        // 2. TIMPA ULANG KOTAK ORIGIN (0,0)
        // Ini adalah trik termudah untuk menjamin tidak ada garis atau sisa piksel teks yang bocor ke sudut
        ui.fillRect(0, 0, this.thickness, this.thickness, this.bgColor);

        // 3. Render garis pembatas utama di paling akhir agar menutupi segalanya dengan rapi
        ui.fillRect(0, this.thickness, width, 1, this.lineColor);
        ui.fillRect(this.thickness, 0, 1, height, this.lineColor);
    }

    _calculateStep(scale) {
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