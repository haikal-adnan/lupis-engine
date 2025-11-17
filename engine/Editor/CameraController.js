import Config from "../Config/Config.js";
import { bus } from "../Core/EventBus.js";

export default class CameraController {
    constructor(camera, glCanvas) {
        this.camera = camera;
        this.canvas = glCanvas;

        this.active = Config.ENGINE_MODE === "editor";

        this.isDragging = false;
        this.spaceKeyHeld = false;

        this.lastPx = 0;
        this.lastPy = 0;

        this.minZoom = 0.25;
        this.maxZoom = 99999;
        this.zoomSpeed = 0.1;
        this.fastZoomMultiplier = 2.0; // CTRL zoom lebih cepat

        if (this.active) this._bindEvents();
    }

    _bindEvents() {
        this._onKeyDown  = e => this._onKeyDownImpl(e);
        this._onKeyUp    = e => this._onKeyUpImpl(e);
        this._onMouseDown= e => this._onMouseDownImpl(e);
        this._onMouseMove= e => this._onMouseMoveImpl(e);
        this._onMouseUp  = e => this._onMouseUpImpl(e);
        this._onWheel    = e => this._onWheelImpl(e);

        window.addEventListener("keydown", this._onKeyDown);
        window.addEventListener("keyup", this._onKeyUp);
        this.canvas.addEventListener("mousedown", this._onMouseDown);
        window.addEventListener("mousemove", this._onMouseMove);
        window.addEventListener("mouseup", this._onMouseUp);
        this.canvas.addEventListener("wheel", this._onWheel, { passive: false });
        this.canvas.addEventListener("contextmenu", e => e.preventDefault());
    }

    // ==============================================
    //  MAP POINTER → DEVICE PIXELS
    // ==============================================
    _mapEventToCanvasPixels(e) {
        const canvas = this.canvas;
        const rect = canvas.getBoundingClientRect();

        let px = e.clientX - rect.left;
        let py = e.clientY - rect.top;

        const cAspect = canvas.width / canvas.height;
        const sAspect = window.innerWidth / window.innerHeight;

        if (sAspect > cAspect) {
            const actualW = window.innerHeight * cAspect;
            const offsetX = (window.innerWidth - actualW) / 2;
            px = (e.clientX - offsetX) * (canvas.width / actualW);
            py *= canvas.height / window.innerHeight;
        } else {
            const actualH = window.innerWidth / cAspect;
            const offsetY = (window.innerHeight - actualH) / 2;
            py = (e.clientY - offsetY) * (canvas.height / actualH);
            px *= canvas.width / window.innerWidth;
        }

        return {
            px: Math.max(0, Math.min(canvas.width, px)),
            py: Math.max(0, Math.min(canvas.height, py))
        };
    }

    // ==============================================
    //           KEYBOARD
    // ==============================================
    _onKeyDownImpl(e) {
        if (e.code === "Space") {
            this.spaceKeyHeld = true;
            this.canvas.style.cursor = "grab";
        }
    }

    _onKeyUpImpl(e) {
        if (e.code === "Space") {
            this.spaceKeyHeld = false;
            this.isDragging = false;
            this.canvas.style.cursor = "default";
        }
    }

    // ==============================================
    // PAN START
    // ==============================================
    _onMouseDownImpl(e) {
        const canPan = e.button === 1 || (e.button === 0 && this.spaceKeyHeld);
        if (!canPan) return;

        e.preventDefault();
        const { px, py } = this._mapEventToCanvasPixels(e);
        this.lastPx = px;
        this.lastPy = py;

        this.isDragging = true;
        this.canvas.style.cursor = "grabbing";
    }

    // ==============================================
    // PAN MOVE
    // ==============================================
    _onMouseMoveImpl(e) {
        if (!this.isDragging) return;

        const cam = this.camera;
        const { px, py } = this._mapEventToCanvasPixels(e);

        let dx = px - this.lastPx;
        let dy = py - this.lastPy;

        // anti micro jitter
        if (Math.abs(dx) < 0.01) dx = 0;
        if (Math.abs(dy) < 0.01) dy = 0;

        this.lastPx = px;
        this.lastPy = py;

        cam.prevX = cam.x;
        cam.prevY = cam.y;

        cam.x -= dx / cam.scale;
        cam.y -= dy / cam.scale;

        bus.emit("camera:pan", { x: cam.x, y: cam.y });
    }

    // ==============================================
    // PAN END
    // ==============================================
    _onMouseUpImpl() {
        this.isDragging = false;
        this.canvas.style.cursor = this.spaceKeyHeld ? "grab" : "default";
    }

    // ==============================================
    // DOUBLE RIGHT CLICK → ZOOM TO CURSOR
    // ==============================================

    // ==============================================
    // SCROLL → ZOOM / PAN
    // ==============================================
    _onWheelImpl(e) {
        e.preventDefault();
        const cam = this.camera;

        const rect = this.canvas.getBoundingClientRect();
        const cssX = e.clientX - rect.left;
        const cssY = e.clientY - rect.top;

        const cw = this.canvas.clientWidth;
        const ch = this.canvas.clientHeight;

        // SHIFT = vertical pan
        if (e.shiftKey) {
            cam.y += (e.deltaY * 0.5) / cam.scale;
            return;
        }

        // ALT = horizontal pan
        if (e.altKey) {
            cam.x += (e.deltaY * 0.5) / cam.scale;
            return;
        }

        let speed = this.zoomSpeed;
        if (e.ctrlKey) speed *= this.fastZoomMultiplier; // CTRL = fast zoom

        const oldScale = cam.scale;
        let newScale = oldScale * (e.deltaY < 0 ? 1 + speed : 1 - speed);

        newScale = Math.max(this.minZoom, Math.min(this.maxZoom, newScale));
        if (newScale === oldScale) return;

        cam.prevX = cam.x;
        cam.prevY = cam.y;

        const worldBeforeX = cam.x + (cssX - cw * 0.5) / oldScale;
        const worldBeforeY = cam.y + (cssY - ch * 0.5) / oldScale;

        cam.scale = newScale;

        cam.x = worldBeforeX - (cssX - cw * 0.5) / newScale;
        cam.y = worldBeforeY - (cssY - ch * 0.5) / newScale;

        // zoom snapping ringan (tidak berat)
        if (Math.abs(cam.scale - 1) < 0.02) cam.scale = 1;
        if (Math.abs(cam.scale - 2) < 0.02) cam.scale = 2;
        if (Math.abs(cam.scale - 0.5) < 0.02) cam.scale = 0.5;

        bus.emit("camera:zoom", { scale: cam.scale });
    }
}
