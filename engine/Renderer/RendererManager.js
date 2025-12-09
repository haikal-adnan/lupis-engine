// engine/Renderer/RendererManager.js
import GLContext from "./Graphic/GLContext.js";
import GLStateCache from "./Graphic/GLStateCache.js";

import ImageRenderer from "./Entity/ImageRenderer.js";
import ShapeRenderer from "./Entity/ShapeRenderer.js";
import TextRenderer from "./Entity/TextRenderer.js";

import WorldRenderer from "./Scene/WorldRenderer.js";
import UIRenderer from "./Scene/UIRenderer.js";

import Mat4 from "../Util/Mat4.js";

export default class RendererManager {
    constructor(canvas) {
        this.canvas = canvas;

        this.ctx = new GLContext(canvas);
        this.gl = this.ctx.gl;

        this.cache = new GLStateCache(this.gl, this.ctx.bindVAO);

        this.image = new ImageRenderer(this.ctx, this.cache);
        this.shape = new ShapeRenderer(this.ctx, this.cache);
        this.text = new TextRenderer(this.ctx, this.cache);

        this.worldRenderer = new WorldRenderer(
            this.image,
            this.text,
            this.shape
        );

        this.uiRenderer = new UIRenderer(
            this.image,
            this.shape,
            this.text
        );

        this.projWorld = Mat4.create();
        this.projUI = Mat4.create();

        this._resize();
        window.addEventListener("resize", () => this._resize());
    }

    _resize() {
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = this.canvas.clientWidth * dpr;
        this.canvas.height = this.canvas.clientHeight * dpr;

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    begin() {
        this.cache.reset();
        this.gl.clearColor(0.05, 0.05, 0.06, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    getWorldProjection(camera) {
        const viewW = this.canvas.width / camera.scale;
        const viewH = this.canvas.height / camera.scale;

        const hw = viewW * 0.5;
        const hh = viewH * 0.5;

        Mat4.ortho(
            this.projWorld,
            camera.x - hw,
            camera.x + hw,
            camera.y + hh,
            camera.y - hh,
            -1, 1
        );

        return this.projWorld;
    }

    getUIProjection() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        Mat4.ortho(
            this.projUI,
            0, w,
            h, 0,
            -1, 1
        );

        return this.projUI;
    }

    render(world, camera, game) {
        this.begin();

        const pWorld = this.getWorldProjection(camera);
        this.worldRenderer.render(world, pWorld);

        const pUI = this.getUIProjection();
        this.uiRenderer.setProjection(pUI);
        this.uiRenderer.render(world.ui);

        this.image.flush();
        this.shape.flush();
        this.text.flush();
    }
}
