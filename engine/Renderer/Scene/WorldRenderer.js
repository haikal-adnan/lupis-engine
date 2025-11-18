// engine/Renderer/WorldRenderer.js
export default class WorldRenderer {
    constructor(image, text, shape) {
        this.image = image;
        this.text = text;
        this.shape = shape;
        
        this._colorCache = new Map();
    }

    render(world, proj) {
        const shape = this.shape;
        const image = this.image;
        const text  = this.text;

        for (const layerName of world.layerOrder) {
            const ents = world.layers.get(layerName);
            if (!ents || ents.length === 0) continue;

            for (const e of ents) {
                if (!e.visible) continue;

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
                    const colorVec = this._getColorVec(e.text.color);
                    
                    text.drawText(
                        e.text.value,
                        e.x,
                        e.y,
                        e.text.size,
                        colorVec,
                        proj
                    );
                }

                if (e.shape) {
                    const c = this._getColorVec(e.shape.color);
                    const t = e.shape.thickness || 1;

                    if (e.shape.type === "rectangle") {
                        shape.drawRect(e.x, e.y, e.shape.width, e.shape.height, c, proj);
                    } 
                    else if (e.shape.type === "rectStroke") {
                        const x = e.x, y = e.y, w = e.shape.width, h = e.shape.height;
                        
                        shape.drawLine(x, y, x + w, y, c, t, proj);     
                        shape.drawLine(x + w, y, x + w, y + h, c, t, proj); 
                        shape.drawLine(x + w, y + h, x, y + h, c, t, proj);
                        shape.drawLine(x, y + h, x, y, c, t, proj);         
                    }
                    else if (e.shape.type === "line") {
                        shape.drawLine(e.x, e.y, e.shape.x2, e.shape.y2, c, t, proj);
                    }
                }
            }
        }
    }

    _getColorVec(hex) {
        if (!hex) return [1, 1, 1, 1]; 
        
        if (this._colorCache.has(hex)) {
            return this._colorCache.get(hex);
        }

        const cleanHex = hex.replace("#", "");
        const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
        const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
        const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
        const a = cleanHex.length === 8 ? parseInt(cleanHex.substring(6, 8), 16) / 255 : 1;

        const vec = [r, g, b, a];
        
        if (this._colorCache.size > 1000) this._colorCache.clear();
        this._colorCache.set(hex, vec);

        return vec;
    }
}