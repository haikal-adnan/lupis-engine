export default class WorldRenderer {
    constructor(image, text, shape) {
        this.image = image;
        this.text = text;
        this.shape = shape;
        this._colorCache = new Map();
        this.TYPE_PRIORITY = { image: 0, shape: 1, text: 2 };
    }

    render(world, proj) {
        const image = this.image;
        const text = this.text;
        const shape = this.shape;

        if (world.gridRenderer) {
            world.gridRenderer(shape, proj);
            shape.flush();
        }

        const queue = [];

        for (let li = 0; li < world.layerOrder.length; li++) {
            const layerId = world.layerOrder[li];
            if (!world.layerVisibility[layerId]) continue;

            const ents = world.layers.get(layerId);
            if (!ents || !ents.length) continue;

            for (const e of ents) {
                if (!e.visible) continue;

                const t = e.transform;
                const baseZ = t.zIndex || 0;
                const layerIndex = li;

                const rawOpacity = (e.opacity !== undefined && e.opacity !== null) ? e.opacity : 100;
                const normalizedOpacity = Math.max(0, Math.min(100, rawOpacity)) / 100;
                // Alpha mungkin di komponen atau root, asumsi belum ada di transform secara explisit selain via opacity
                const finalAlpha = normalizedOpacity * (e.alpha ?? 1);

                const renderData = {
                    x: t.x, y: t.y,
                    w: e.width, h: e.height,
                    rot: t.rotation || 0,
                    sx: t.scaleX ?? 1, sy: t.scaleY ?? 1,
                    px: t.pivotX ?? 0.5, py: t.pivotY ?? 0.5,
                    alpha: finalAlpha
                };

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

        queue.sort((a, b) => {
            if (a.layerIndex !== b.layerIndex) return a.layerIndex - b.layerIndex;
            if (a.z !== b.z) return a.z - b.z;
            return this.TYPE_PRIORITY[a.type] - this.TYPE_PRIORITY[b.type];
        });

        let lastType = null;

        for (const item of queue) {
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
                    // Line menggunakan world coordinate dari shape properties, 
                    // atau fallback ke renderData (root entity pos) jika x1/y1 null
                    shape.drawLine(e.shape.x1 ?? r.x, e.shape.y1 ?? r.y, e.shape.x2, e.shape.y2, c, t, proj);
                }
            } 
            else if (item.type === "text") {
                const col = this._getColorVec(e.text.color);
                text.drawText(
                    e.text.value,
                    r.x, r.y, r.w, r.h,
                    e.text.size, col, proj,
                    r.rot, r.sx, r.sy, r.px, r.py, 
                    r.alpha
                );
            }
        }

        if (world.selectionRenderer) {
            world.selectionRenderer(image, shape, text, proj);
        }

        image.flush();
        shape.flush();
        text.flush();
    }

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