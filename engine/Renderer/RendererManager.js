import GLContext from "./Graphic/GLContext.js";
import GLStateCache from "./Graphic/GLStateCache.js";
import Config from "../Core/Config.js";
import Mat4 from "../Util/Mat4.js";

import ImageRenderer from "./Entity/ImageRenderer.js";
import ShapeRenderer from "./Entity/ShapeRenderer.js";
import TextRenderer from "./Entity/TextRenderer.js";

import WorldRenderer from "./Scene/WorldRenderer.js";
import TilemapRenderer from "./Scene/TilemapRenderer.js"; 
import UIRenderer from "./Scene/UIRenderer.js";

export default class RendererManager {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        
        this.ctx = new GLContext(canvas);
        this.gl = this.ctx.gl;
        this.cache = new GLStateCache(this.gl, this.ctx.bindVAO);

        this.image = new ImageRenderer(this.ctx, this.cache);
        this.shape = new ShapeRenderer(this.ctx, this.cache);
        this.text = new TextRenderer(this.ctx, this.cache);

        this.tilemapRenderer = new TilemapRenderer(this.image, this.shape, this.game);
        this.worldRenderer = new WorldRenderer(this.image, this.text, this.shape, this.game, this.tilemapRenderer);
        this.uiRenderer = new UIRenderer(this.image, this.shape, this.text, this.game);

        this.projWorld = Mat4.create();
        this.projUI = Mat4.create();
    }

    render(world, camera, game, alpha = 1.0) {
        this._handleResize();
        this._beginFrame();

        const pWorld = this._updateWorldProjection(camera);
        
        if (Config.ENGINE_MODE === "editor") {
            this._handleEditorGizmos(world, game);
        }

        this.worldRenderer.render(world, pWorld, alpha);

        const pUI = this._updateUIProjection();
        this.uiRenderer.setProjection(pUI);
        this.uiRenderer.render(world.ui);
    }

    _handleResize() {
        const dpr = window.devicePixelRatio || 1;
        const dw = Math.floor(this.canvas.clientWidth * dpr);
        const dh = Math.floor(this.canvas.clientHeight * dpr);

        if (this.canvas.width !== dw || this.canvas.height !== dh) {
            this.canvas.width = dw;
            this.canvas.height = dh;
            this.gl.viewport(0, 0, dw, dh);
        }
    }

    _beginFrame() {
        this.cache.reset();
        this.gl.clearColor(0.05, 0.05, 0.06, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    _handleEditorGizmos(world, game) {
        const { activeTabId } = world._editors || {};
        const isSceneMode = activeTabId === "scene";

        game.selection.active = isSceneMode;
        game.transform.active = isSceneMode;
    }

    _updateWorldProjection(camera) {
        const viewW = this.canvas.width / camera.scale;
        const viewH = this.canvas.height / camera.scale;
        const hw = viewW * 0.5;
        const hh = viewH * 0.5;

        Mat4.ortho(this.projWorld, camera.x - hw, camera.x + hw, camera.y + hh, camera.y - hh, -1, 1);
        return this.projWorld;
    }

    _updateUIProjection() {
        Mat4.ortho(this.projUI, 0, this.canvas.width, this.canvas.height, 0, -1, 1);
        return this.projUI;
    }
}