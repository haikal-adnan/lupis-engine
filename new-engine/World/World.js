// engine/World/World.js

import Camera from "../Camera/Camera.js";
import Config from "../Config/Config.js";

export default class World {
    constructor() {
        this.camera = new Camera(0, 0);

        // Layer → array of entities
        this.layers = new Map();

        // Ordered layer list
        this.layerOrder = [
            "background",
            "terrain",
            "objects",
            "players",
            "effects",
            "ui-world"
        ];

        this.systems = [];
        this.player = null;
    }

    // =====================================================
    // ENTITY MANAGEMENT
    // =====================================================
    addEntity(entity, layer = "objects") {
        if (!this.layers.has(layer))
            this.layers.set(layer, []);

        this.layers.get(layer).push(entity);
        entity.layer = layer;
        entity.world = this;

        entity.onAddedToWorld?.(this);

        if (entity.isPlayer || entity.type === "player") {
            this.player = entity;
        }
    }

    removeEntity(entity) {
        const arr = this.layers.get(entity.layer);
        if (!arr) return;
        const idx = arr.indexOf(entity);
        if (idx !== -1) arr.splice(idx, 1);
    }

    addSystem(system) {
        this.systems.push(system);
    }

    // =====================================================
    // UPDATE LOOP
    // =====================================================
    update(dt) {
        // Update all systems
        for (const system of this.systems) {
            for (const layer of this.layerOrder) {
                const ents = this.layers.get(layer);
                if (!ents) continue;

                for (const e of ents) {
                    system.update?.(e, dt);
                }
            }
        }

        // Update camera if runtime
        if (Config.ENGINE_MODE !== "editor" && this.player) {
            this.camera.updateFollow(
                this.player,
                dt,
                Config.WORLD.WIDTH,
                Config.WORLD.HEIGHT
            );
        }
    }

    // =====================================================
    // RENDER REQUEST GENERATOR
    // (RendererManager yang akan menggambar)
    // =====================================================
    renderCollect(imageRenderer, textRenderer, projection) {
        for (const layer of this.layerOrder) {
            const ents = this.layers.get(layer);
            if (!ents) continue;

            for (const e of ents) {
                // Sprite
                if (e.image && e.frame) {
                    imageRenderer.draw(
                        e.image,
                        e.frame,
                        e.x, 
                        e.y,
                        e.frame.sw,
                        e.frame.sh
                    );
                }

                // World-space text
                if (e.text) {
                    const t = e.text;
                    textRenderer.fill(
                        t.value,
                        e.x + (t.offsetX || 0),
                        e.y + (t.offsetY || -20),
                        t.size || 24,
                        t.color || [1,1,1,1]
                    );
                }
            }
        }
    }

    async load() {
        console.log("🌍 Loading world...");
        await new Promise(res => setTimeout(res, 300));
    }
}
