// engine/Core/Game.js

import RendererManager from "../Renderer/RendererManager.js";
import GameLoop from "../Loop/GameLoop.js";
import World from "../World/World.js";
import Camera from "../Camera/Camera.js";

/**
 * Game
 * ----
 * Engine utama. Mengurus:
 *  - RendererManager (GL pipeline)
 *  - World (entity, systems)
 *  - Camera
 *  - GameLoop (update & render)
 */

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;

        // ===============================
        // 1. Renderer Pipeline (WebGL2 → WebGL1 fallback)
        // ===============================
        this.renderer = new RendererManager(canvas);

        // ===============================
        // 2. World (Entity + Systems)
        // ===============================
        this.world = new World();

        // ===============================
        // 3. Camera
        // ===============================
        this.camera = new Camera(0, 0);
        this.camera.scale = 1;

        // ===============================
        // 4. Game Loop
        // ===============================
        this.loop = new GameLoop({
            update: (dt) => this.update(dt),
            render: (alpha) => this.render(alpha)
        });
    }

    // ============================================================
    //  START ENGINE
    // ============================================================
    start() {
        this.loop.start();
    }

    // ============================================================
    //  UPDATE (LOGIC)
    // ============================================================
    update(dt) {
        // Update World
        this.world.update(dt);

        // Update Camera (if following player)
        if (this.world.player) {
            this.camera.follow(
                this.world.player,
                dt
            );
        }
    }

    // ============================================================
    //  RENDER (GRAPHICS)
    // ============================================================
    render(alpha) {
        // Interpolate camera for smooth motion
        const cam = this.camera.getInterpolated(alpha);

        // Main render pipeline is inside RendererManager
        this.renderer.render(this.world, cam);
    }
}
