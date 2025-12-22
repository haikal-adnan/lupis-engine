// engine/Util/calculateQuadVertices.js

export function calculateQuadVertices(x, y, w, h, rot, sx, sy, px, py) {
    // 1. Hitung dimensi akhir setelah scale (bisa negatif untuk flip)
    const finalW = w * sx;
    const finalH = h * sy;

    // 2. Hitung Offset Pivot
    // Jika pivot 0.5 (tengah), offset adalah -setengah lebar
    const offsetX = -px * finalW;
    const offsetY = -py * finalH;

    // 3. Pre-kalkulasi Sin & Cos untuk Rotasi
    const c = Math.cos(rot);
    const s = Math.sin(rot);

    // 4. Fungsi Rotasi Lokal
    // Mengubah titik lokal (lx, ly) menjadi posisi dunia yang terotasi
    const transform = (lx, ly) => {
        // Terapkan pivot offset dulu
        const ox = lx + offsetX;
        const oy = ly + offsetY;

        // Rumus Rotasi 2D + Translasi kembali ke (x,y)
        return {
            x: x + (ox * c - oy * s),
            y: y + (ox * s + oy * c)
        };
    };

    // 5. Hitung 4 Sudut (Quad)
    // 0,0 adalah titik kiri-atas relatif sebelum offset pivot
    return {
        tl: transform(0, 0),           // Top-Left
        tr: transform(finalW, 0),      // Top-Right
        bl: transform(0, finalH),      // Bottom-Left
        br: transform(finalW, finalH)  // Bottom-Right
    };
}