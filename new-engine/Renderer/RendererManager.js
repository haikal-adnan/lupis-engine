// engine/Renderer/RendererManager.js

import GLContext from "./GLContext.js";
import GLStateCache from "./GLStateCache.js";
import ImageRenderer from "./ImageRenderer.js";
import TextRenderer from "./TextRenderer.js";
import WorldRenderer from "./WorldRenderer.js";

import Mat4 from "../Util/Mat4.js";

/**
 * RendererManager
 * ----------------
 * Pipeline rendering utama untuk engine:
 *
 * begin()
 *    world-space rendering
 *    ui-space rendering
 * end()
 *
 * Semua renderer terpusat di sini untuk memastikan:
 *  - urutan render benar
 *  - batching optimal
 *  - state tetap bersih
 */

export default class RendererManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = new GLContext(canvas);
        this.gl = this.ctx.gl;
        this.cache = new GLStateCache(this.gl);

        // Renderers
        this.imageRenderer = new ImageRenderer(this.ctx);
        this.textRenderer  = new TextRenderer(this.ctx);
        this.worldRenderer = new WorldRenderer(
            this.ctx, 
            this.imageRenderer, 
            this.textRenderer
        );

        // Cached matrices
        this.projWorld = Mat4.create();
        this.projUI = Mat4.create();

        this._resize();
        window.addEventListener("resize", () => this._resize());
    }

    // ============================================================
    //  VIEWPORT + CANVAS RESIZE HANDLING
    // ============================================================
    _resize() {
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = Math.floor(this.canvas.clientWidth * dpr);
        this.canvas.height = Math.floor(this.canvas.clientHeight * dpr);

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    // ============================================================
    //  CLEAR SCREEN
    // ============================================================
    begin() {
        const gl = this.gl;

        // Reset state cache per frame
        this.cache.reset();

        gl.clearColor(0.05, 0.05, 0.06, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    // ============================================================
    //  PROJECTION: WORLD-SPACE
    // ============================================================
    getWorldProjection(camera) {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Camera transform → projection matrix
        // (orthographic projection following camera)
        Mat4.ortho(
            this.projWorld,
            camera.x,
            camera.x + w / camera.scale,
            camera.y + h / camera.scale,
            camera.y,
            -1,
            1
        );

        return this.projWorld;
    }

    // ============================================================
    //  PROJECTION: UI / SCREEN SPACE
    // ============================================================
    getScreenProjection() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        Mat4.ortho(this.projUI, 0, w, h, 0, -1, 1);
        return this.projUI;
    }

    // ============================================================
    //  RENDERING PIPELINE
    // ============================================================
    render(world, camera) {
        // 1. Clear frame
        this.begin();

        // ===================================================
        // WORLD-SPACE RENDERING
        // ===================================================
        const projWorld = this.getWorldProjection(camera);

        // Render entity & systems
        this.worldRenderer.render(world, projWorld);

        // Flush sprite & text batch in world space
        this.imageRenderer.flush(projWorld);
        this.textRenderer.flush(projWorld);

        // ===================================================
        // UI / SCREEN-SPACE RENDERING
        // ===================================================
        const projUI = this.getScreenProjection();

        this.imageRenderer.flush(projUI);
        this.textRenderer.flush(projUI);

        // 3. End (no special action needed)
        this.end();
    }

    end() {
        // future use — postprocessing, fxaa, overlays…
    }
}
