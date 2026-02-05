// File: ../Renderer/RendererManager.js

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
        this.projUI = Mat4.create(); // [NEW] Proyeksi Khusus UI Runtime
        this.projEditor = Mat4.create(); 
    }

    render(world, camera, game, alpha = 1.0) {
        this._handleResize();
        this._beginFrame();

        // 1. Render World (Game Entities)
        const pWorld = this._updateWorldProjection(camera);
        
        const { activeTabId, tabs } = world._editors || {};
        const activeTab = tabs?.find(t => t.id === activeTabId);
        
        // Mode Editor Detection
        const isEditor = Config.ENGINE_MODE === "editor";
        const isUIMode = isEditor && activeTab?.type === 'ui';
        const isSceneMode = isEditor && (activeTabId === "scene" || !activeTabId);

        // Editor Gizmos Logic
        if (isEditor) {
            this._handleEditorGizmos(world, game, isUIMode);
        }

        // --- LAYER RENDERING ---

        // Render World Layer (Background, Player, Enemies)
        // Jika sedang mode UI Editor penuh, mungkin kita tidak ingin merender world (opsional), 
        // tapi biasanya designer ingin melihat overlay.
        this.worldRenderer.render(world, pWorld, alpha, isUIMode);

        // Render UI Layer
        if (isEditor) {
            // [EDITOR MODE]
            // Gunakan pWorld (Kamera Editor) agar kita bisa zoom in/out UI saat mengeditnya
            if (isUIMode) {
                this.uiRenderer.render(world, pWorld, false); // false = UI Editor Mode
            } else if (isSceneMode) {
                this.uiRenderer.render(world, pWorld, true); // true = Scene Overlay Mode
            }
        } else {
            // [RUNTIME MODE]
            // Gunakan Proyeksi Layar (Screen Space) yang statis/responsif, BUKAN kamera world.
            // UI Runtime tidak boleh ikut ter-zoom/geser oleh kamera player.
            const pUI = this._updateUIProjection(world);
            this.uiRenderer.render(world, pUI, false); 
        }

        // Editor Overlays (Gizmo, Selection Box)
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
            // Pastikan flush terakhir di runtime
            this._flushAll();
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

        if (isUIMode) {
            game.selection.active = true;
            game.transform.active = true;
            game.selection.filter = (entity, layer) => isUILayer(layer);
        } else if (isSceneMode) {
            game.selection.active = true;
            game.transform.active = true;
            game.selection.filter = (entity, layer) => !isUILayer(layer);
        } else {
            game.selection.filter = null;
        }
    }

    _handleResize() {
        // [FIX] Jika Runtime, JANGAN ubah resolusi internal. 
        // Biarkan index.html yang mengatur resolusi tetap (misal 1920x1080).
        if (Config.ENGINE_MODE === "runtime") return;

        // [EDITOR MODE] Logic lama tetap dipakai agar editor tajam saat di-resize panelnya
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
        // [FIX] Gunakan resolusi canvas (yang sudah dikunci di runtime)
        const viewW = this.canvas.width / camera.scale;
        const viewH = this.canvas.height / camera.scale;
        const hw = viewW * 0.5;
        const hh = viewH * 0.5;

        // Reset Proyeksi agar bersih
        Mat4.identity(this.projWorld);

        // Kamera World (Center Origin)
        Mat4.ortho(this.projWorld, camera.x - hw, camera.x + hw, camera.y + hh, camera.y - hh, -1, 1);
        
        // [OPTIONAL] Tambahkan ini jika Tilemap perlu disesuaikan viewport-nya saat resize buffer
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        return this.projWorld;
    }

    // [NEW] Proyeksi UI Runtime (Screen Space)
    // Menyesuaikan dengan Reference Resolution agar UI responsif (Scale with Screen Size logic)
    _updateUIProjection(world) {
        const uiSettings = world.settings?.ui || { referenceWidth: 1920, referenceHeight: 1080 };
        const refW = uiSettings.referenceWidth;
        const refH = uiSettings.referenceHeight;

        // Logic Scale Mode (Fit, Fill, Stretch, atau Constant)
        // Untuk sekarang kita implementasikan 'Fit' (Letterbox logic) atau 'Match Width/Height' secara sederhana.
        // Di sini saya gunakan pendekatan "Match Reference" -> UI selalu menganggap layarnya 1920x1080
        // Dan Renderer (Canvas) sudah di-scale oleh CSS atau window resize, jadi kita proyeksikan 1:1 ke reference.
        
        // PENTING: Jika canvas fisik berbeda rasio dengan reference, 
        // kita mungkin perlu menyesuaikan ortho agar UI tidak gepeng.
        
        // Versi Sederhana: Selalu gunakan Reference Resolution sebagai koordinat sistem UI
        // Ini membuat UI designer bekerja di 1920x1080, dan di runtime sistem koordinatnya tetap 1920x1080.
        // WebGL Viewport yang akan menangani scaling visualnya.
        
        Mat4.ortho(this.projUI, 0, refW, refH, 0, -1, 1); // Top-Left origin (0,0) -> (1920, 1080)
        
        return this.projUI;
    }

    _updateEditorProjection() {
        // Pixel Perfect projection untuk Editor UI (Gizmo, Text)
        Mat4.ortho(this.projEditor, 0, this.canvas.width, this.canvas.height, 0, -1, 1);
        return this.projEditor;
    }
}