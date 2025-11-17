// engine/Renderer/UIRenderer.js
export default class UIRenderer {
    constructor(image, shape, text) {
        this.image = image;
        this.shape = shape;
        this.text = text;
        this.projection = null;
    }

    setProjection(p) {
        this.projection = p;
    }

    render(uiList) {
        if (!uiList) return;

        for (const fn of uiList) {
            fn(this);
        }
    }

    drawImage(tex, x, y, w, h) {
        this.image.draw(
            tex,
            { sx:0, sy:0, sw:tex.width, sh:tex.height },
            x, y, w, h,
            this.projection
        );
    }

    fillRect(x, y, w, h, color) {
        this.shape.drawRect(x, y, w, h, color, this.projection);
    }

    strokeRect(x, y, w, h, color, t=1) {
        this.shape.drawLine(x, y, x+w, y, color, t, this.projection);
        this.shape.drawLine(x+w, y, x+w, y+h, color, t, this.projection);
        this.shape.drawLine(x+w, y+h, x, y+h, color, t, this.projection);
        this.shape.drawLine(x, y+h, x, y, color, t, this.projection);
    }

    drawText(str, x, y, size, color) {
        this.text.drawText(str, x, y, size, color, this.projection);
    }
}
