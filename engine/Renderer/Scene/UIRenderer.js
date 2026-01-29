export default class UIRenderer {
    constructor(image, shape, text, game) {
        this.image = image;
        this.shape = shape;
        this.text = text;
        this.game = game;
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
        if (!tex) {
            this.fillRect(x, y, w, h, [1, 1, 1, 1]);
            return;
        }

        this.image.draw(
            tex,
            { sx: 0, sy: 0, sw: tex.width, sh: tex.height },
            { x, y, width: w, height: h },
            null,
            this.projection
        );
    }

    fillRect(x, y, w, h, color) {
        this.shape.drawRect(x, y, w, h, color, this.projection);
    }

    strokeRect(x, y, w, h, color, t=1) {
        this.shape.drawRectStroke(x, y, w, h, color, t, this.projection);
    }

    drawText(str, x, y, size, color, font = null, rotation = 0) {
        let targetFont = font;

        if (!targetFont) {
            targetFont = this.game.assetLoader?.fontLoader?.defaultFont;
        }

        if (!targetFont && this.game.world?.assets?.fonts) {
            targetFont = this.game.world.assets.fonts["system_default"];
        }

        if (!targetFont || !targetFont.glTexture) return;

        this.text.drawText(
            targetFont,
            str,
            x, y,
            0, 0,
            size,
            color,
            this.projection,
            rotation
        );
    }

    drawCircle(x, y, r, color) {
        this.shape.drawCircle(x, y, r, color, 24, this.projection);
    }

    strokeCircle(x, y, r, color, t=2) {
        this.shape.drawCircleOutline(x, y, r, color, t, 32, this.projection);
    }
}