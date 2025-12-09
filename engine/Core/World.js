// engine/World/World.js
export default class World {
    constructor() {
        this.layers = new Map();
        this.layerOrder = [];
        this.layerVisibility = {};
        this.entities = [];
        this.systems = [];
        this.assets = { textures: {}, fonts: {} };
        this.ui = [];
        this.camera = { x: 0, y: 0, scale: 1 };
        this.showAxis = true;
        this.showUIRect = true;
    }

    addUI(fn) {
        this.ui.push(fn);
    }

    addEntity(e, layer) {
        if (!this.layers.has(layer)) this.layers.set(layer, []);
        this.layers.get(layer).push(e);
    }

    async loadProject(project, scene, loader, baseURL, fontLoader) {
        const sortedLayers = scene.layers.slice().sort((a, b) => a.order - b.order);
        this.layerOrder = sortedLayers.map(l => l.id);

        for (const l of scene.layers) {
            this.layers.set(l.id, []);
            this.layerVisibility[l.id] = l.visible ?? true;
        }

        for (const tex of scene.assets.textures) {
            const img = await loader.load(baseURL + "assets/" + tex);
            this.assets.textures[tex] = img;
        }

        if (fontLoader && scene.assets.fonts.length === 2) {
            const [fnt, png] = scene.assets.fonts;
            const f = await fontLoader(
                baseURL + "assets/" + fnt,
                baseURL + "assets/" + png
            );
            this.assets.fonts.default = f;
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
            visible: desc.visible ?? true,
            zIndex: 0
        };

        const t = e.components.Transform;
        if (t) {
            e.x = t.x ?? 0;
            e.y = t.y ?? 0;
            e.scaleX = t.scaleX ?? 1;
            e.scaleY = t.scaleY ?? 1;
            e.rotation = t.rotation ?? 0;
        }

        const s = e.components.SpriteRenderer;
        if (s) {
            e.image = this.assets.textures[s.texture];
            e.frame = s.source;
            e.width = s.width;
            e.height = s.height;
            e.pixelPerfect = !!s.pixelPerfect;
            e.zIndex = s.zIndex ?? 0;
            e.alpha = s.alpha ?? 1;
        }

        const text = e.components.TextRenderer;
        if (text) {
            e.text = {
                value: text.text,
                size: text.size,
                color: text.color
            };

            e.zIndex = text.zIndex ?? e.zIndex;

            const f = this.assets.fonts.default;
            if (f && f.measureText) {
                const m = f.measureText(text.text, text.size);
                e.hitX = e.x + m.xMin;
                e.hitY = e.y + m.yMin;
                e.hitWidth = m.boundsWidth;
                e.hitHeight = m.boundsHeight;
                e.width = m.width;
                e.height = m.boundsHeight;
            }
        }

        const sh = e.components.ShapeRenderer;
        if (sh) {
            e.shape = sh;
            e.zIndex = sh.zIndex ?? 0;

            if (sh.type === "rectangle" || sh.type === "rectStroke") {
                e.width = sh.width;
                e.height = sh.height;
            }

            if (sh.type === "line") {
                const x1 = e.x;
                const y1 = e.y;
                const x2 = sh.x2;
                const y2 = sh.y2;
                const th = sh.thickness ?? 1;

                const dx = x2 - x1;
                const dy = y2 - y1;

                if (Math.abs(dy) < 0.0001) {
                    e.hitX = Math.min(x1, x2);
                    e.hitY = y1 - th / 2;
                    e.hitWidth = Math.abs(dx);
                    e.hitHeight = th;
                } else if (Math.abs(dx) < 0.0001) {
                    e.hitX = x1 - th / 2;
                    e.hitY = Math.min(y1, y2);
                    e.hitWidth = th;
                    e.hitHeight = Math.abs(dy);
                } else {
                    const minX = Math.min(x1, x2);
                    const maxX = Math.max(x1, x2);
                    const minY = Math.min(y1, y2);
                    const maxY = Math.max(y1, y2);
                    e.hitX = minX - th / 2;
                    e.hitY = minY - th / 2;
                    e.hitWidth = (maxX - minX) + th;
                    e.hitHeight = (maxY - minY) + th;
                }
            }
        }

        return e;
    }

    update(dt) {
        for (const sys of this.systems) {
            for (const layer of this.layerOrder) {
                const ents = this.layers.get(layer);
                if (!ents) continue;
                for (const e of ents) sys.update?.(e, dt);
            }
        }
    }
}
