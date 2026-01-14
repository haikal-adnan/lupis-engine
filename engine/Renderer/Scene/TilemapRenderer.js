import { HexToVec4 } from "../../Util/HexToVec4.js";

export default class TilemapRenderer {
    constructor(image, shape, game) {
        this.game = game;
        this.image = image;
        this.shape = shape;
        this.renderQueue = [];

        // Config warna (Bisa dipindah ke Config.js nanti)
        this.colors = {
            grid: HexToVec4("#ffffff14"), // Putih
            border: HexToVec4("#00ffff") // Cyan
        };
    }

    render(world, proj) {
        this.renderQueue.length = 0;

        // 1. CARI ENTITY TARGET
        const editors = world._editors || {};
        const activeId = editors.activeTabId;

        if (!activeId) return;

        const entity = this._findEntityById(world, activeId);
        if (!entity || !entity.components || !entity.components.Tilemap) return;

        // 2. AMBIL DATA
        const tm = entity.components.Tilemap;
        const tf = entity.components.Transform || { x: 0, y: 0 };

        // Default value safe guard
        const tileW = tm.tileWidth || 32;
        const tileH = tm.tileHeight || 32;
        const cols = tm.width || 10;   // Jumlah kolom (map width)
        const rows = tm.height || 10;  // Jumlah baris (map height)
        
        const startX = tf.x;
        const startY = tf.y;
        
        const totalW = cols * tileW;
        const totalH = rows * tileH;

        // 3. GAMBAR GRID (Garis Tipis)
        // Vertikal
        for (let i = 0; i <= cols; i++) {
            const xPos = startX + (i * tileW);
            this.renderQueue.push({
                type: "shape",
                transformData: { x: xPos, y: startY, width: 0, height: 0 }, // Dummy transform
                shapeOptions: {
                    type: "line",
                    x2: xPos,
                    y2: startY + totalH,
                    colorVec4: this.colors.grid,
                    opacity: 0.2, // Transparan
                    thickness: 1
                }
            });
        }

        // Horizontal
        for (let j = 0; j <= rows; j++) {
            const yPos = startY + (j * tileH);
            this.renderQueue.push({
                type: "shape",
                transformData: { x: startX, y: yPos, width: 0, height: 0 },
                shapeOptions: {
                    type: "line",
                    x2: startX + totalW,
                    y2: yPos,
                    colorVec4: this.colors.grid,
                    opacity: 0.2,
                    thickness: 1
                }
            });
        }

        // 4. GAMBAR BORDER (Garis Tebal Pembatas Luar)
        this.renderQueue.push({
            type: "shape",
            transformData: { 
                x: startX, 
                y: startY, 
                width: totalW, 
                height: totalH,
                rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0, pivotY: 0
            },
            shapeOptions: {
                type: "rectStroke", // Kotak kosong (hanya garis)
                colorVec4: this.colors.border,
                opacity: 0.8,
                thickness: 2 // Lebih tebal
            }
        });

        // 5. PROCESS RENDER QUEUE & FLUSH
        this._processQueue(proj);
    }

    _findEntityById(world, id) {
        // Helper sederhana cari entity
        for (const layer of world.layers) {
            if(!layer.entities) continue;
            for (const entity of layer.entities) {
                if (entity.id === id) return entity;
            }
        }
        return null;
    }

    _processQueue(proj) {
        for (const item of this.renderQueue) {
            // Kita fokus ke SHAPE dulu sesuai request
             if (item.type === "shape") {
                const s = item.shapeOptions;
                const t = item.transformData;
                const c = s.colorVec4;

                if (s.type === "rectStroke") {
                    this.shape.drawRectStroke(
                        t.x, t.y, t.width, t.height, c, s.thickness, proj,
                        t.rotation || 0, t.scaleX || 1, t.scaleY || 1, 
                        t.pivotX || 0, t.pivotY || 0, s.opacity
                    );
                } else if (s.type === "line") {
                    this.shape.drawLine(t.x, t.y, s.x2, s.y2, c, s.thickness, proj);
                }
            }
            // (Image logic nanti ditambahkan disini)
        }

        this.shape.flush();
        this.image.flush();
    }
}