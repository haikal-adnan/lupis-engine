// engine/Renderer/WorldRenderer.js
export default class WorldRenderer {
    constructor(image, text, shape) {
        this.image = image;
        this.text = text;
        this.shape = shape;
    }

    render(world, proj) {
        const shape = this.shape;
        const image = this.image;
        const text  = this.text;

        for (const layer of world.layerOrder) {
            const ents = world.layers.get(layer);
            if (!ents) continue;

            for (const e of ents) {
                if (e.image && e.frame) {
                    image.draw(
                        e.image,
                        e.frame,
                        e.x,
                        e.y,
                        e.width,
                        e.height,
                        proj,
                        e.pixelPerfect
                    );
                }

                if (e.text) {
                    text.drawText(
                        e.text.value,
                        e.x,
                        e.y,
                        e.text.size,
                        this._hex(e.text.color),
                        proj
                    );
                }

                if (e.shape) {
                    let c = this._hex(e.shape.color);
                    if (e.shape.type === "rectangle")
                        shape.drawRect(e.x, e.y, e.shape.width, e.shape.height, c, proj);

                    if (e.shape.type === "rectStroke") {
                        const x = e.x;
                        const y = e.y;
                        const w = e.shape.width;
                        const h = e.shape.height;
                        const t = e.shape.thickness;

                        // TOP
                        shape.drawLine(x, y, x + w, y, c, t, proj);

                        // RIGHT
                        shape.drawLine(x + w, y, x + w, y + h, c, t, proj);

                        // BOTTOM
                        shape.drawLine(x + w, y + h, x, y + h, c, t, proj);

                        // LEFT
                        shape.drawLine(x, y + h, x, y, c, t, proj);
                    }

                    if (e.shape.type === "line")
                        shape.drawLine(e.x, e.y, e.shape.x2, e.shape.y2, c, e.shape.thickness, proj);
                }
            }
        }
    }

    _hex(hex) {
        hex = hex.replace("#", "");
        const r = parseInt(hex.substring(0,2),16)/255;
        const g = parseInt(hex.substring(2,4),16)/255;
        const b = parseInt(hex.substring(4,6),16)/255;
        const a = hex.length===8 ? parseInt(hex.substring(6,8),16)/255 : 1;

        return [r,g,b,a];
    }
}
