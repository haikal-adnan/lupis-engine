// engine/Renderer/WorldRenderer.js

/**
 * WorldRenderer
 * --------------
 * Mengambil entity dan system dari World,
 * lalu mengirim drawcall ke:
 *   - ImageRenderer (sprite)
 *   - TextRenderer (world text)
 *
 * Renderer ini TIDAK menggambar langsung.
 * Semua batching & draw dilakukan oleh RendererManager.
 */

export default class WorldRenderer {
    constructor(ctx, imageRenderer, textRenderer) {
        this.ctx = ctx;
        this.imageRenderer = imageRenderer;
        this.textRenderer = textRenderer;
    }

    /**
     * Render seluruh world
     * @param {World} world
     * @param {mat4} projection
     */
    render(world, projection) {
        const entities = world.entities;
        const systems = world.systems;

        // ----------------------------------------------------------
        // 1. Jalankan render per sistem (jika ada)
        //    Sistem bebas memanggil:
        //        this.imageRenderer.draw(...)
        //        this.textRenderer.fill(...)
        // ----------------------------------------------------------
        for (const system of systems) {
            if (typeof system.render === "function") {
                for (const entity of entities) {
                    system.render(entity, this.imageRenderer, this.textRenderer, projection);
                }
            }
        }

        // ----------------------------------------------------------
        // 2. Basic entity sprite rendering (default fallback)
        // ----------------------------------------------------------
        for (const entity of entities) {
            if (!entity.visible) continue;

            // Entity punya sprite
            if (entity.image && entity.frame) {
                const tex = entity.image;   // GLImageResource
                const f   = entity.frame;

                // Jika entity punya transform
                const x = entity.x || 0;
                const y = entity.y || 0;
                const w = f.sw;
                const h = f.sh;

                this.imageRenderer.draw(
                    tex,
                    f,
                    x,
                    y,
                    w,
                    h
                );
            }

            // Jika entity punya text
            if (entity.text) {
                const { value, color, size, offsetX, offsetY } = entity.text;

                this.textRenderer.fill(
                    value,
                    entity.x + (offsetX || 0),
                    entity.y + (offsetY || -20), // default text above entity
                    size || 24,
                    color || [1, 1, 1, 1]
                );
            }
        }
    }
}
