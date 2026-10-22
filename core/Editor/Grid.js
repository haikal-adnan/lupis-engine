export default class Grid {
    constructor(world, game, canvas, renderer, camera, opt = {}) {
        this.world = world;
        this.game = game;
        this.canvas = canvas;
        this.renderer = renderer;
        this.camera = camera;

        this.width = opt.width || 32;
        this.height = opt.height || 32;
        this.offsetX = 0;
        this.offsetY = 0;
        this.color = opt.color || "#ffffff";
        this.alpha = opt.alpha || 0.1;
        this._cachedColor = this.color;
        this._cachedAlpha = this.alpha;
        this._cachedRGBA = this._hexToRGBA(this.color, this.alpha);

        world.gridRenderer = (shape, projection) => {
            this.render(shape, projection);
        };
    }

    update() {
        const gridSettings = this.world.settings?.grid;
        
        if (!gridSettings) return;

        if (!gridSettings.visible) {
            this.enabled = false;
            return;
        }
        this.enabled = true;

        this.width = gridSettings.width || 32;
        this.height = gridSettings.height || 32;
        this.color = gridSettings.color || "#ffffff";
        this.alpha = gridSettings.opacity || 0.1;

        if (this.color !== this._cachedColor || this.alpha !== this._cachedAlpha || !this._cachedRGBA) {
            this._cachedColor = this.color;
            this._cachedAlpha = this.alpha;
            this._cachedRGBA = this._hexToRGBA(this.color, this.alpha);
        }

        this.offsetX = 0;
        this.offsetY = 0;
    }

    render(shape, projection) {
        this.update();
        if (!this.enabled) return;

        const cam = this.camera;
        const w = this.width;
        const h = this.height;
        const ox = this.offsetX; 
        const oy = this.offsetY;

        if (!w || !h || w <= 0 || h <= 0) return;

        const scale = Math.max(0.0001, cam.scale || 1);
        const screenCellW = w * scale;
        const screenCellH = h * scale;

        // Skip if cells are smaller than 4 screen pixels to avoid line explosion and moire
        if (screenCellW < 4 && screenCellH < 4) return;

        // Dynamic LoD stepping when cells become small (< 12px)
        let stepX = w;
        let stepY = h;
        if (screenCellW < 12) {
            const factorX = Math.pow(2, Math.ceil(Math.log2(12 / screenCellW)));
            stepX = w * factorX;
        }
        if (screenCellH < 12) {
            const factorY = Math.pow(2, Math.ceil(Math.log2(12 / screenCellH)));
            stepY = h * factorY;
        }

        const rectW = this.canvas.width / scale;
        const rectH = this.canvas.height / scale;
        const left = cam.x - rectW * 0.5;
        const right = cam.x + rectW * 0.5;
        const top = cam.y - rectH * 0.5;
        const bottom = cam.y + rectH * 0.5;

        const startX = ox + Math.floor((left - ox) / stepX) * stepX;
        const endX   = ox + Math.ceil((right - ox) / stepX) * stepX;
        const startY = oy + Math.floor((top - oy) / stepY) * stepY;
        const endY   = oy + Math.ceil((bottom - oy) / stepY) * stepY;

        // Safety line clamp (max 400 lines total)
        const lineCountX = Math.ceil((endX - startX) / stepX);
        const lineCountY = Math.ceil((endY - startY) / stepY);
        if (lineCountX + lineCountY > 400) return;

        const rgba = this._cachedRGBA || this._hexToRGBA(this.color, this.alpha);
        const lineThick = 1 / scale;

        for (let x = startX; x <= endX; x += stepX) {
            shape.drawLine(x, top, x, bottom, rgba, lineThick, projection);
        }

        for (let y = startY; y <= endY; y += stepY) {
            shape.drawLine(left, y, right, y, rgba, lineThick, projection);
        }
    }
    
    _hexToRGBA(hex, alpha) {
        if (!hex) return [1, 1, 1, alpha];
        
        const h = hex.replace("#", "");
        const r = parseInt(h.slice(0,2),16) / 255;
        const g = parseInt(h.slice(2,4),16) / 255;
        const b = parseInt(h.slice(4,6),16) / 255;
        return [r,g,b,alpha];
    }
}