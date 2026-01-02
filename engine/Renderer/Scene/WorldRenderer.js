// engine/Renderer/WorldRenderer.js

export default class WorldRenderer {
    constructor(image, text, shape) {
        this.image = image;
        this.text = text;
        this.shape = shape;
        this._colorCache = new Map();
        
        // Prioritas render dalam satu layer yang sama (z-index sama):
        // Image paling bawah, lalu Shape, lalu Text paling atas.
        this.TYPE_PRIORITY = { image: 0, shape: 1, text: 2 };
    }

    render(world, proj) {
        // 1. Render Grid (Background paling bawah jika ada)
        if (world.gridRenderer) {
            world.gridRenderer(this.shape, proj);
            this.shape.flush();
        }

        const queue = [];

        // 2. Loop Layers
        for (let li = 0; li < world.layerOrder.length; li++) {
            const layerId = world.layerOrder[li];
            if (!world.layerVisibility[layerId]) continue;

            const ents = world.layers.get(layerId);
            if (!ents || !ents.length) continue;

            // 3. Loop Entities
            for (const e of ents) {
                if (!e.visible) continue;

                const t = e.transform;
                if (!t) continue; // Safety check

                const baseZ = t.zIndex || 0;
                
                // Kalkulasi Opacity & Alpha
                const rawOpacity = (e.opacity !== undefined && e.opacity !== null) ? e.opacity : 100;
                const normalizedOpacity = Math.max(0, Math.min(100, rawOpacity)) / 100;
                const finalAlpha = normalizedOpacity * (e.alpha ?? 1);

                // Siapkan data render umum (Transformasi)
                const renderData = {
                    x: t.x, y: t.y,
                    w: e.width, h: e.height,
                    rot: t.rotation || 0,
                    sx: t.scaleX ?? 1, sy: t.scaleY ?? 1,
                    px: t.pivotX ?? 0.5, py: t.pivotY ?? 0.5,
                    alpha: finalAlpha
                };

                // --- LOGIC DETEKSI TIPE RENDERER ---

                // A. SPRITE RENDERER
                // Kita anggap dia Sprite jika punya texture (e.image) ATAU punya komponen SpriteRenderer
                // Ini penting agar saat texture dihapus (null), dia tetap dianggap sprite (untuk render checkerboard)
                const isSprite = (e.image || (e.components && e.components.SpriteRenderer));
                
                if (isSprite && e.frame) {
                    queue.push({ type: "image", layerIndex: li, z: baseZ, e, renderData });
                }

                // B. SHAPE RENDERER
                if (e.shape) {
                    queue.push({ type: "shape", layerIndex: li, z: baseZ, e, renderData });
                }

                // C. TEXT RENDERER
                if (e.text) {
                    queue.push({ type: "text", layerIndex: li, z: baseZ, e, renderData });
                }
            }
        }

        // 4. Sorting Queue
        // Urutan: Layer Index -> Z-Index -> Tipe (Image < Shape < Text)
        queue.sort((a, b) => {
            if (a.layerIndex !== b.layerIndex) return a.layerIndex - b.layerIndex;
            if (a.z !== b.z) return a.z - b.z;
            return this.TYPE_PRIORITY[a.type] - this.TYPE_PRIORITY[b.type];
        });

        // 5. Eksekusi Render Batching
        let lastType = null;

        for (const item of queue) {
            // Flush batch jika tipe renderer berubah
            if (item.type !== lastType) {
                if (lastType === "image") this.image.flush();
                else if (lastType === "shape") this.shape.flush();
                else if (lastType === "text") this.text.flush();
                lastType = item.type;
            }

            const e = item.e;
            const r = item.renderData;

            // --- EKSEKUSI GAMBAR ---

            if (item.type === "image") {
                // Logic Fallback Checkerboard
                // Jika e.image null, maka hasTexture = false -> useCheckerboard = true
                const hasTexture = !!e.image;

                this.image.draw(
                    e.image,             // Texture (bisa null)
                    e.frame,             // Frame koordinat
                    r.x, r.y, r.w, r.h,  // Transform Position & Size
                    r.rot, r.sx, r.sy, r.px, r.py, // Transform Rotation, Scale, Pivot
                    proj,                // Projection Matrix
                    e.pixelPerfect,      // Pixel Perfect toggle
                    r.alpha,             // Opacity
                    !hasTexture          // <--- PARAMETER BARU: useCheckerboard (True jika tidak ada texture)
                );
            } 
            else if (item.type === "shape") {
                const c = this._getColorVec(e.shape.color);
                const t = e.shape.thickness || 1;

                if (e.shape.type === "rectangle") {
                    this.shape.drawRect(
                        r.x, r.y, r.w, r.h, 
                        c, proj, 
                        r.rot, r.sx, r.sy, r.px, r.py, 
                        r.alpha
                    );
                } 
                else if (e.shape.type === "rectStroke") {
                    this.shape.drawRectStroke(
                        r.x, r.y, r.w, r.h, 
                        c, t, proj,
                        r.rot, r.sx, r.sy, r.px, r.py, 
                        r.alpha
                    );
                } 
                else if (e.shape.type === "line") {
                    // Line support coordinate absolute atau relative transform
                    const x1 = e.shape.x1 !== undefined ? e.shape.x1 : r.x;
                    const y1 = e.shape.y1 !== undefined ? e.shape.y1 : r.y;
                    this.shape.drawLine(x1, y1, e.shape.x2, e.shape.y2, c, t, proj);
                }
            } 
            else if (item.type === "text") {
                const col = this._getColorVec(e.text.color); 
                
                this.text.drawText(
                    e.text.value,
                    r.x, r.y, r.w, r.h,
                    e.text.size, 
                    col, 
                    proj,
                    r.rot, r.sx, r.sy, r.px, r.py, 
                    r.alpha
                );
            }
        }

        // 6. Flush sisa batch terakhir
        if (lastType === "image") this.image.flush();
        else if (lastType === "shape") this.shape.flush();
        else if (lastType === "text") this.text.flush();

        // 7. Render Gizmos / Editor Selection Overlay (Paling Atas)
        if (world.selectionRenderer) {
            // Render selection UI terpisah
            world.selectionRenderer(this.image, this.shape, this.text, proj);
        }
    }

    // Helper untuk cache konversi Hex ke Vec4 (WebGL format)
    _getColorVec(hex) {
        if (!hex) return [1, 1, 1, 1];
        if (this._colorCache.has(hex)) return this._colorCache.get(hex);
        
        const clean = hex.replace("#", "");
        let r = 1, g = 1, b = 1, a = 1;

        if (clean.length === 6) {
            r = parseInt(clean.slice(0, 2), 16) / 255;
            g = parseInt(clean.slice(2, 4), 16) / 255;
            b = parseInt(clean.slice(4, 6), 16) / 255;
        } else if (clean.length === 8) {
            r = parseInt(clean.slice(0, 2), 16) / 255;
            g = parseInt(clean.slice(2, 4), 16) / 255;
            b = parseInt(clean.slice(4, 6), 16) / 255;
            a = parseInt(clean.slice(6, 8), 16) / 255;
        } else if (clean.length === 3) {
            r = parseInt(clean[0] + clean[0], 16) / 255;
            g = parseInt(clean[1] + clean[1], 16) / 255;
            b = parseInt(clean[2] + clean[2], 16) / 255;
        }
        
        const vec = [r, g, b, a];
        
        if (this._colorCache.size > 1000) this._colorCache.clear();
        this._colorCache.set(hex, vec);
        return vec;
    }
}