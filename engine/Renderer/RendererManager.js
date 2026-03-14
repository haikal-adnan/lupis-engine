import GLContext from "./Graphic/GLContext.js";
import GLStateCache from "./Graphic/GLStateCache.js";
import Config from "../Core/Config.js";
import Mat4 from "../Util/Mat4.js";

import { HexToVec4 } from "../Util/HexToVec4.js";

import ImageRenderer from "./Entity/ImageRenderer.js";
import ShapeRenderer from "./Entity/ShapeRenderer.js";
import TextRenderer from "./Entity/TextRenderer.js";

import WorldRenderer from "./Scene/WorldRenderer.js";
import TilemapRenderer from "./Scene/TilemapRenderer.js"; 
import EditorRenderer from "./Scene/EditorRenderer.js"; 
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
        this.editorRenderer = new EditorRenderer(this.image, this.shape, this.text, this.game);
        this.uiRenderer = new UIRenderer(this.image, this.shape, this.text, this.game);

        this.projWorld = Mat4.create();
        this.projUI = Mat4.create();
        this.projEditor = Mat4.create(); 
    }

    render(world, camera, game, alpha = 1.0) {
        this._handleResize();
        this._beginFrame();

        const pWorld = this._updateWorldProjection(camera);
        
        const { activeTabId, tabs } = world._editors || {};
        const activeTab = tabs?.find(t => t.id === activeTabId);
        
        const isEditor = Config.ENGINE_MODE === "editor";
        const isUIMode = isEditor && activeTab?.type === 'ui';
        const isSceneMode = isEditor && (activeTabId === "scene" || !activeTabId);

        if (isEditor) {
            this._handleEditorGizmos(world, game, isUIMode);
        }

        this.worldRenderer.render(world, pWorld, alpha, isUIMode);

        if (isEditor) {
            if (isUIMode) {
                this.uiRenderer.render(world, pWorld, false);
            } else if (isSceneMode) {
                this.uiRenderer.render(world, pWorld, true);
            }
        } else {
            const pUI = this._updateUIProjection(world);
            this.uiRenderer.render(world, pUI, false); 
        }

        if (isEditor) {
            this._renderSelection(world, pWorld);

            const pEditor = this._updateEditorProjection();
            this.editorRenderer.setProjection(pEditor);

            const wasDepthEnabled = this.gl.isEnabled(this.gl.DEPTH_TEST);
            this.gl.disable(this.gl.DEPTH_TEST);

            this.editorRenderer.render(world.ui); 

            this._flushAll(); 

            if (wasDepthEnabled) {
                this.gl.enable(this.gl.DEPTH_TEST);
            }
        } else {
            this._flushAll();
        }

        if (game.transitionSystem && game.transitionSystem.active) {
            const pScreen = this._updateEditorProjection(); 

            const wasDepthEnabled = this.gl.isEnabled(this.gl.DEPTH_TEST);
            this.gl.disable(this.gl.DEPTH_TEST);

            this.shape.drawRect(
                0, 0, this.canvas.width, this.canvas.height, 
                game.transitionSystem.color, pScreen, 
                0, 1, 1, 0, 0, 
                game.transitionSystem.alpha, 
                false, false
            );
            this.shape.flush();

            if (wasDepthEnabled) {
                this.gl.enable(this.gl.DEPTH_TEST);
            }
        }
    }

    _beginFrame() {
        this.cache.reset();
        
        const sceneSettings = this.game.world.settings;
        const bgColorHex = sceneSettings?.backgroundColor || "#222222";
        const bgColor = HexToVec4(bgColorHex);
        
        this.gl.clearColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    _renderSelection(world, proj) {
        if (world.selectionRenderer && this.game.selection.active) {
            this._flushAll();
            world.selectionRenderer(this.image, this.shape, this.text, proj);
            this._flushAll();
        }
    }

    _flushAll() {
        this.image.flush();
        this.shape.flush();
        this.text.flush();
    }

    _handleEditorGizmos(world, game, isUIMode) {
        const { activeTabId } = world._editors || {};
        const isSceneMode = activeTabId === "scene" || !activeTabId; 
        const isUILayer = (layer) => layer && (layer.scriptId === 'ui' || layer.name === 'UI');
        
        const isLayerInteractable = (layer) => layer && layer.active !== false && layer.visible !== false;

        if (isUIMode) {
            game.selection.active = true;
            game.transform.active = true;
            game.selection.filter = (entity, layer) => isUILayer(layer) && isLayerInteractable(layer);
        } else if (isSceneMode) {
            game.selection.active = true;
            game.transform.active = true;
            game.selection.filter = (entity, layer) => !isUILayer(layer) && isLayerInteractable(layer);
        } else {
            game.selection.filter = null;
        }
    }

    _handleResize() {
        if (Config.ENGINE_MODE === "runtime") return;

        const dpr = window.devicePixelRatio || 1;
        const dw = Math.floor(this.canvas.clientWidth * dpr);
        const dh = Math.floor(this.canvas.clientHeight * dpr);

        if (this.canvas.width !== dw || this.canvas.height !== dh) {
            this.canvas.width = dw;
            this.canvas.height = dh;
            this.gl.viewport(0, 0, dw, dh);
        }
    }

    _updateWorldProjection(camera) {
        const viewW = this.canvas.width / camera.scale;
        const viewH = this.canvas.height / camera.scale;
        const hw = viewW * 0.5;
        const hh = viewH * 0.5;

        Mat4.identity(this.projWorld);

        Mat4.ortho(this.projWorld, camera.x - hw, camera.x + hw, camera.y + hh, camera.y - hh, -1, 1);
        
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        return this.projWorld;
    }

    _updateUIProjection(world) {
        const uiSettings = world.settings?.ui || { width: 1920, height: 1080 };
        const refW = uiSettings.width;
        const refH = uiSettings.height;

        Mat4.ortho(this.projUI, 0, refW, refH, 0, -1, 1);
        
        return this.projUI;
    }

    _updateEditorProjection() {
        Mat4.ortho(this.projEditor, 0, this.canvas.width, this.canvas.height, 0, -1, 1);
        return this.projEditor;
    }

    destroy() {
        if (!this.gl) return;
        
        const loseCtx = this.gl.getExtension('WEBGL_lose_context');
        if (loseCtx) loseCtx.loseContext();
        
        this.gl = null;
        this.ctx = null;
        this.canvas = null;
    }
}
