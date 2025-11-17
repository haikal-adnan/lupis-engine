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

        // ======= ADD TOGGLES ========
        this.showAxis = true;
        this.showUIRect = true;
    }

    addUI(fn) { this.ui.push(fn); }

    addEntity(e, layer) {
        if (!this.layers.has(layer))
            this.layers.set(layer, []);

        this.layers.get(layer).push(e);
    }

    async loadProject(project, scene, loader, baseURL, fontLoader) {

        this.layerOrder = scene.layers.map(l => l.id);
        for (const l of scene.layers)
            this.layers.set(l.id, []);

        // textures
        for (const tex of scene.assets.textures) {
            const img = await loader.load(baseURL + "assets/" + tex);
            this.assets.textures[tex] = img;
        }

        // font
        if (fontLoader && scene.assets.fonts.length === 2) {
            const [fnt, png] = scene.assets.fonts;
            const fontObj = await fontLoader(
                baseURL + "assets/" + fnt,
                baseURL + "assets/" + png
            );
            this.assets.fonts.default = fontObj;
        }

        // entities
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
            components: desc.components || {}
        };

        // Transform
        const t = e.components.Transform;
        if (t) {
            e.x = t.x || 0;
            e.y = t.y || 0;
            e.scaleX = t.scaleX ?? 1;
            e.scaleY = t.scaleY ?? 1;
            e.rotation = t.rotation || 0;
        }

        // SpriteRenderer
        const s = e.components.SpriteRenderer;
        if (s) {
            e.image = this.assets.textures[s.texture];
            e.frame = s.source;
            e.width = s.width;
            e.height = s.height;
            e.zIndex = s.zIndex || 0;
            e.pixelPerfect = !!s.pixelPerfect;
        }

        // TextRenderer
        const text = e.components.TextRenderer;
        if (text) {
            e.text = {
                value: text.text,
                size: text.size,
                color: text.color,
                offsetX: 0,
                offsetY: 0
            };
        }

        // ShapeRenderer
        const sh = e.components.ShapeRenderer;
        if (sh) {
            e.shape = sh;
        }

        return e;
    }

    update(dt) {
        for (const system of this.systems) {
            for (const layer of this.layerOrder) {
                const ents = this.layers.get(layer);
                if (!ents) continue;
                for (const e of ents)
                    system.update?.(e, dt);
            }
        }
    }
}
