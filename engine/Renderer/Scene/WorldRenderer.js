// engine/Renderer/WorldRenderer.js
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

                const baseZ = e.zIndex || 0;
                const layerIndex = li;

                if (e.image && e.frame) {
                    queue.push({ type: "image", layerIndex, z: baseZ, e });
                }
                if (e.shape) {
                    queue.push({ type: "shape", layerIndex, z: baseZ, e });
                }
                if (e.text) {
                    queue.push({ type: "text", layerIndex, z: baseZ, e });
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

            if (item.type === "image") {
                image.draw(
                    e.image,
                    e.frame,
                    e.x,
                    e.y,
                    e.width,
                    e.height,
                    proj,
                    e.pixelPerfect,
                    e.alpha
                );
            } else if (item.type === "shape") {
                const c = this._getColorVec(e.shape.color);
                const t = e.shape.thickness || 1;

                if (e.shape.type === "rectangle") {
                    shape.drawRect(e.x, e.y, e.shape.width, e.shape.height, c, proj);
                } else if (e.shape.type === "rectStroke") {
                    const x = e.x;
                    const y = e.y;
                    const w = e.shape.width;
                    const h = e.shape.height;
                    shape.drawLine(x, y, x + w, y, c, t, proj);
                    shape.drawLine(x + w, y, x + w, y + h, c, t, proj);
                    shape.drawLine(x + w, y + h, x, y + h, c, t, proj);
                    shape.drawLine(x, y + h, x, y, c, t, proj);
                } else if (e.shape.type === "line") {
                    shape.drawLine(e.x, e.y, e.shape.x2, e.shape.y2, c, t, proj);
                }
            } else if (item.type === "text") {
                const col = this._getColorVec(e.text.color);
                text.drawText(e.text.value, e.x, e.y, e.text.size, col, proj);
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
