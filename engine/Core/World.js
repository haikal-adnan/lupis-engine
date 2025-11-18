// engine/World/World.js

export default class World {
    constructor() {
        this.layers = new Map();
        this.layerOrder = [];
        this.entities = [];
        this.systems = [];

        this.assets = {
            textures: {},
            fonts: {}
        };

        this.ui = [];

        this.showAxis = true;
        this.showUIRect = true;

        this.camera = {
            x: 0,
            y: 0,
            scale: 1
        };
    }

    addUI(fn) {
        this.ui.push(fn);
    }

    addEntity(e, layer) {
        if (!this.layers.has(layer)) this.layers.set(layer, []);
        this.layers.get(layer).push(e);
    }

    async loadProject(project, scene, loader, baseURL, fontLoader) {
        this.layerOrder = scene.layers.map(l => l.id);
        for (const l of scene.layers) {
            this.layers.set(l.id, []);
        }

        for (const tex of scene.assets.textures) {
            const img = await loader.load(baseURL + "assets/" + tex);
            this.assets.textures[tex] = img;
        }

        if (fontLoader && scene.assets.fonts.length === 2) {
            const [fnt, png] = scene.assets.fonts;
            const fontObj = await fontLoader(
                baseURL + "assets/" + fnt,
                baseURL + "assets/" + png
            );
            this.assets.fonts.default = fontObj;
        }

        for (const ent of scene.entities) {
            const e = this._buildEntity(ent);
            this.entities.push(e);

            const layer = ent.layer || "objects";
            this.addEntity(e, layer);
        }
    }

    _buildEntity(desc) {
        const e = {
            id: desc.id,
            name: desc.name,
            layer: desc.layer,
            components: desc.components || {},
            visible: desc.visible ?? true
        };

        const t = e.components.Transform;
        if (t) {
            e.x = t.x || 0;
            e.y = t.y || 0;
            e.scaleX = t.scaleX ?? 1;
            e.scaleY = t.scaleY ?? 1;
            e.rotation = t.rotation || 0;
        }

        const s = e.components.SpriteRenderer;
        if (s) {
            e.image = this.assets.textures[s.texture];
            e.frame = s.source;
            e.width = s.width;
            e.height = s.height;
            e.zIndex = s.zIndex || 0;
            e.pixelPerfect = !!s.pixelPerfect;
        }

        const text = e.components.TextRenderer;
        if (text) {
            e.text = {
                value: text.text,
                size: text.size,
                color: text.color,
                offsetX: 0,
                offsetY: 0
            };

            const fontObj = this.assets.fonts.default;

            if (fontObj && typeof fontObj.measureText === "function") {
                const metrics = fontObj.measureText(text.text, text.size);

                e.hitX = e.x + metrics.xMin;
                e.hitY = e.y + metrics.yMin;

                e.hitWidth = metrics.boundsWidth;
                e.hitHeight = metrics.boundsHeight;

                e.width = metrics.width;
                e.height = metrics.boundsHeight;
            }
        }

        const sh = e.components.ShapeRenderer;
        if (sh) {
            e.shape = sh;

            if (sh.type === "rectangle" || sh.type === "rectStroke") {
                e.width = sh.width;
                e.height = sh.height;
            }

            if (sh.type === "line") {
                const x1 = e.x;
                const y1 = e.y;
                const x2 = sh.x2;
                const y2 = sh.y2;

                const t = sh.thickness ?? 1;
                const dx = x2 - x1;
                const dy = y2 - y1;

                if (Math.abs(dy) < 0.0001) {
                    e.hitX = Math.min(x1, x2);
                    e.hitY = y1 - t / 2;
                    e.hitWidth = Math.abs(dx);
                    e.hitHeight = t;
                } else if (Math.abs(dx) < 0.0001) {
                    e.hitX = x1 - t / 2;
                    e.hitY = Math.min(y1, y2);
                    e.hitWidth = t;
                    e.hitHeight = Math.abs(dy);
                } else {
                    const minX = Math.min(x1, x2);
                    const maxX = Math.max(x1, x2);
                    const minY = Math.min(y1, y2);
                    const maxY = Math.max(y1, y2);

                    e.hitX = minX - t / 2;
                    e.hitY = minY - t / 2;
                    e.hitWidth = (maxX - minX) + t;
                    e.hitHeight = (maxY - minY) + t;
                }

                e.width = 0;
                e.height = 0;
            }
        }

        return e;
    }

    update(dt) {
        for (const system of this.systems) {
            for (const layer of this.layerOrder) {
                const ents = this.layers.get(layer);
                if (!ents) continue;

                for (const e of ents) {
                    system.update?.(e, dt);
                }
            }
        }
    }
}
