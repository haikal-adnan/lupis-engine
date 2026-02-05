import { HexToVec4 } from "../Util/HexToVec4.js";

export default class Rulers {
    constructor(game) {
        this.game = game;
        this.thickness = 20;
        this.bgColor = HexToVec4("#131720");
        this.lineColor = HexToVec4("#88888869");
        this.textColor = HexToVec4("#888888");
        this.fontSize = 9;
        this.tickSize = 15;
    }

    render(ui) {
        const cam = this.game.camera;
        const width = this.game.renderer.canvas.width;
        const height = this.game.renderer.canvas.height;

        ui.fillRect(0, 0, width, this.thickness, this.bgColor);
        ui.fillRect(0, 0, this.thickness, height, this.bgColor);
        ui.fillRect(0, 0, this.thickness, this.thickness, this.bgColor);

        const rectW = width / cam.scale;
        const rectH = height / cam.scale;

        const viewWorldLeft = cam.x - rectW * 0.5;
        const viewWorldTop = cam.y - rectH * 0.5;

        const step = this._calculateStep(cam.scale);

        const startX = Math.floor(viewWorldLeft / step) * step;
        const endX = viewWorldLeft + rectW;

        for (let wx = startX; wx <= endX; wx += step) {
            const screenX = (wx - viewWorldLeft) * cam.scale;
            if (screenX < this.thickness) continue;

            ui.fillRect(
                screenX,
                this.thickness - this.tickSize,
                1,
                this.tickSize,
                this.lineColor
            );

            ui.drawText(
                Math.round(wx).toString(),
                screenX + 3,
                4,
                this.fontSize,
                this.textColor
            );
        }

        const startY = Math.floor(viewWorldTop / step) * step;
        const endY = viewWorldTop + rectH;

        const rotation = -Math.PI / 2;

        for (let wy = startY; wy <= endY; wy += step) {
            const screenY = (wy - viewWorldTop) * cam.scale;
            if (screenY < this.thickness) continue;

            ui.fillRect(
                this.thickness - this.tickSize,
                screenY,
                this.tickSize,
                1,
                this.lineColor
            );

            ui.drawText(
                Math.round(wy).toString(),
                this.thickness / 2 - 2,
                screenY + 3,
                this.fontSize,
                this.textColor,
                null,
                rotation
            );
        }

        ui.fillRect(0, this.thickness, width, 1, this.lineColor);
        ui.fillRect(this.thickness, 0, 1, height, this.lineColor);
    }

    _calculateStep(scale) {
        const screenStep = 100;
        const worldStep = screenStep / scale;
        const magnitude = Math.pow(10, Math.floor(Math.log10(worldStep)));
        const residual = worldStep / magnitude;

        if (residual > 5) return 10 * magnitude;
        if (residual > 2) return 5 * magnitude;
        if (residual > 1) return 2 * magnitude;
        return magnitude;
    }
}
