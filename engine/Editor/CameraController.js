import Config from "../Config/Config.js";
import { bus } from "../Core/EventBus.js";

export default class CameraController {
    constructor(camera, canvas) {
        this.camera = camera;
        this.canvas = canvas;

        this.active = Config.ENGINE_MODE === "editor";
        this.isDragging = false;
        this.spaceKeyHeld = false;

        this.lastPx = 0;
        this.lastPy = 0;

        this.minZoom = 0.25;
        this.maxZoom = 99999;
        this.zoomSpeed = 0.1;
        this.fastZoomMultiplier = 2;

        if (this.active) this._bind();
    }

    _bind() {
        this._onKeyDown = e => this._onKeyDownImpl(e);
        this._onKeyUp = e => this._onKeyUpImpl(e);
        this._onDown = e => this._onMouseDownImpl(e);
        this._onMove = e => this._onMouseMoveImpl(e);
        this._onUp = () => this._onMouseUpImpl();
        this._onWheel = e => this._onWheelImpl(e);

        window.addEventListener("keydown", this._onKeyDown);
        window.addEventListener("keyup", this._onKeyUp);
        window.addEventListener("mousemove", this._onMove);
        window.addEventListener("mouseup", this._onUp);

        this.canvas.addEventListener("mousedown", this._onDown);
        this.canvas.addEventListener("wheel", this._onWheel, { passive: false });
        this.canvas.addEventListener("contextmenu", e => e.preventDefault());
    }

    _mapEventToCanvasPixels(e) {
        const c = this.canvas;
        const r = c.getBoundingClientRect();
        let px = e.clientX - r.left;
        let py = e.clientY - r.top;

        const cAspect = c.width / c.height;
        const sAspect = window.innerWidth / window.innerHeight;

        if (sAspect > cAspect) {
            const w = window.innerHeight * cAspect;
            const ox = (window.innerWidth - w) / 2;
            px = (e.clientX - ox) * (c.width / w);
            py *= c.height / window.innerHeight;
        } else {
            const h = window.innerWidth / cAspect;
            const oy = (window.innerHeight - h) / 2;
            py = (e.clientY - oy) * (c.height / h);
            px *= c.width / window.innerWidth;
        }

        return {
            px: Math.max(0, Math.min(c.width, px)),
            py: Math.max(0, Math.min(c.height, py))
        };
    }

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

    _onMouseMoveImpl(e) {
        if (!this.isDragging) return;

        const cam = this.camera;
        const { px, py } = this._mapEventToCanvasPixels(e);

        let dx = px - this.lastPx;
        let dy = py - this.lastPy;

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

    _onMouseUpImpl() {
        this.isDragging = false;
        this.canvas.style.cursor = this.spaceKeyHeld ? "grab" : "default";
    }

    _onWheelImpl(e) {
        e.preventDefault();
        const cam = this.camera;

        const r = this.canvas.getBoundingClientRect();
        const cssX = e.clientX - r.left;
        const cssY = e.clientY - r.top;

        const cw = this.canvas.clientWidth;
        const ch = this.canvas.clientHeight;

        if (e.shiftKey) {
            cam.y += (e.deltaY * 0.5) / cam.scale;
            return;
        }

        if (e.altKey) {
            cam.x += (e.deltaY * 0.5) / cam.scale;
            return;
        }

        let speed = e.ctrlKey ? this.zoomSpeed * this.fastZoomMultiplier : this.zoomSpeed;

        const old = cam.scale;
        let next = old * (e.deltaY < 0 ? 1 + speed : 1 - speed);
        next = Math.max(this.minZoom, Math.min(this.maxZoom, next));
        if (next === old) return;

        cam.prevX = cam.x;
        cam.prevY = cam.y;

        const wx = cam.x + (cssX - cw * 0.5) / old;
        const wy = cam.y + (cssY - ch * 0.5) / old;

        cam.scale = next;

        cam.x = wx - (cssX - cw * 0.5) / next;
        cam.y = wy - (cssY - ch * 0.5) / next;

        if (Math.abs(cam.scale - 1) < 0.02) cam.scale = 1;
        if (Math.abs(cam.scale - 2) < 0.02) cam.scale = 2;
        if (Math.abs(cam.scale - 0.5) < 0.02) cam.scale = 0.5;

        bus.emit("camera:zoom", { scale: cam.scale });
    }
}
