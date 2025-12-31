export default class WorldRenderer {
    constructor(image, text, shape) {
        this.image = image;
        this.text = text;
        this.shape = shape;
        this._colorCache = new Map();
        // Prioritas render dalam satu layer yang sama: Image dulu, baru Shape, baru Text
        this.TYPE_PRIORITY = { image: 0, shape: 1, text: 2 };
    }

    render(world, proj) {
        const image = this.image;
        const text = this.text;
        const shape = this.shape;

        // 1. Render Grid (Background paling bawah)
        if (world.gridRenderer) {
            world.gridRenderer(shape, proj);
            shape.flush();
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

                // =========================================================
                // [NEW] SYNC LOGIC: Component Data -> Render Frame
                // Agar perubahan di Inspector (Source Rect) langsung terlihat
                // =========================================================
                if (e.components && e.components.SpriteRenderer) {
                    const s = e.components.SpriteRenderer;
                    
                    // Jika user mengisi Source Rect di Inspector
                    if (s.source) {
                         e.frame = { 
                            sx: Number(s.source.x) || 0, 
                            sy: Number(s.source.y) || 0, 
                            sw: Number(s.source.w) || 0, 
                            sh: Number(s.source.h) || 0 
                         };
                    } 
                    // Fallback: Jika source kosong, kembalikan ke full texture size
                    else if (e.image) {
                        e.frame = { sx: 0, sy: 0, sw: e.image.width, sh: e.image.height };
                    }
                }
                // =========================================================

                const t = e.transform;
                const baseZ = t.zIndex || 0;
                const layerIndex = li;

                const rawOpacity = (e.opacity !== undefined && e.opacity !== null) ? e.opacity : 100;
                const normalizedOpacity = Math.max(0, Math.min(100, rawOpacity)) / 100;
                const finalAlpha = normalizedOpacity * (e.alpha ?? 1);

                // Siapkan data render umum
                const renderData = {
                    x: t.x, y: t.y,
                    w: e.width, h: e.height,
                    rot: t.rotation || 0,
                    sx: t.scaleX ?? 1, sy: t.scaleY ?? 1,
                    px: t.pivotX ?? 0.5, py: t.pivotY ?? 0.5,
                    alpha: finalAlpha
                };

                // Masukkan ke Queue berdasarkan tipe komponen yang tersedia di entity
                if (e.image && e.frame) {
                    queue.push({ type: "image", layerIndex, z: baseZ, e, renderData });
                }
                if (e.shape) {
                    queue.push({ type: "shape", layerIndex, z: baseZ, e, renderData });
                }
                if (e.text) {
                    queue.push({ type: "text", layerIndex, z: baseZ, e, renderData });
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
            // Flush jika tipe renderer berubah
            if (item.type !== lastType) {
                if (lastType === "image") image.flush();
                else if (lastType === "shape") shape.flush();
                else if (lastType === "text") text.flush();
                lastType = item.type;
            }

            const e = item.e;
            const r = item.renderData;

            if (item.type === "image") {
                image.draw(
                    e.image, e.frame,
                    r.x, r.y, r.w, r.h,
                    r.rot, r.sx, r.sy, r.px, r.py,
                    proj, e.pixelPerfect, r.alpha
                );
            } 
            else if (item.type === "shape") {
                const c = this._getColorVec(e.shape.color);
                const t = e.shape.thickness || 1;

                if (e.shape.type === "rectangle") {
                    shape.drawRect(
                        r.x, r.y, r.w, r.h, 
                        c, proj, 
                        r.rot, r.sx, r.sy, r.px, r.py, 
                        r.alpha
                    );
                } 
                else if (e.shape.type === "rectStroke") {
                    shape.drawRectStroke(
                        r.x, r.y, r.w, r.h, 
                        c, t, proj,
                        r.rot, r.sx, r.sy, r.px, r.py, 
                        r.alpha
                    );
                } 
                else if (e.shape.type === "line") {
                    // Line kadang pakai koordinat absolute world (e.shape.x1), 
                    // kadang relatif transform (r.x).
                    const x1 = e.shape.x1 !== undefined ? e.shape.x1 : r.x;
                    const y1 = e.shape.y1 !== undefined ? e.shape.y1 : r.y;
                    shape.drawLine(x1, y1, e.shape.x2, e.shape.y2, c, t, proj);
                }
            } 
            else if (item.type === "text") {
                const col = this._getColorVec(e.text.color); 
                
                text.drawText(
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

        // 6. Render Gizmos / Editor Selection Overlay
        if (world.selectionRenderer) {
            // Kita flush dulu batching game object sebelum menggambar UI Editor
            image.flush();
            shape.flush();
            text.flush();
            
            world.selectionRenderer(image, shape, text, proj);
        }

        // Flush final untuk memastikan sisa buffer tergambar
        image.flush();
        shape.flush();
        text.flush();
    }

    // Helper untuk cache konversi Hex ke Vec4 (WebGL format)
    _getColorVec(hex) {
        if (!hex) return [1, 1, 1, 1];
        if (this._colorCache.has(hex)) return this._colorCache.get(hex);
        
        const clean = hex.replace("#", "");
        const r = parseInt(clean.slice(0, 2), 16) / 255;
        const g = parseInt(clean.slice(2, 4), 16) / 255;
        const b = parseInt(clean.slice(4, 6), 16) / 255;
        const a = clean.length === 8 ? parseInt(clean.slice(6, 8), 16) / 255 : 1;
        
        const vec = [r, g, b, a];
        
        if (this._colorCache.size > 1000) this._colorCache.clear();
        this._colorCache.set(hex, vec);
        return vec;
    }
}