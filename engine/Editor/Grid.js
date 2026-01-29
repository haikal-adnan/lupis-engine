export default class Grid {
    constructor(world, game, canvas, renderer, camera, opt = {}) {
        this.world = world;
        this.game = game;
        this.canvas = canvas;
        this.renderer = renderer;
        this.camera = camera;

        this.width = opt.width || 50;
        this.height = opt.height || 50;
        this.offsetX = 0;
        this.offsetY = 0;
        this.color = opt.color || "#ffffff";
        this.alpha = opt.alpha || 0.15;

        world.gridRenderer = (shape, projection) => {
            this.render(shape, projection);
        };
    }

    update() {
        const editors = this.world._editors;
        if (!editors) return;

        const ctx = editors.gridContext;
        const isVisible = ctx ? ctx.display : true;

        if (!isVisible) {
            this.enabled = false;
            return;
        }
        this.enabled = true;

        this.width = ctx ? ctx.width : 50;
        this.height = ctx ? ctx.height : 50;
        
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

        const rectW = this.canvas.width / cam.scale;
        const rectH = this.canvas.height / cam.scale;
        const left = cam.x - rectW * 0.5;
        const right = cam.x + rectW * 0.5;
        const top = cam.y - rectH * 0.5;
        const bottom = cam.y + rectH * 0.5;

        const startX = ox + Math.floor((left - ox) / w) * w;
        const endX   = ox + Math.ceil((right - ox) / w) * w;
        const startY = oy + Math.floor((top - oy) / h) * h;
        const endY   = oy + Math.ceil((bottom - oy) / h) * h;

        const rgba = this._hexToRGBA(this.color, this.alpha);

        for (let x = startX; x <= endX; x += w) {
            shape.drawLine(x, top, x, bottom, rgba, 1 / cam.scale, projection);
        }

        for (let y = startY; y <= endY; y += h) {
            shape.drawLine(left, y, right, y, rgba, 1 / cam.scale, projection);
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