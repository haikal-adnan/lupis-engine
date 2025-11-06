// src/engine/Editor/CameraController.js
import Config from "../Config/Config.js";
import { bus } from "../Core/EventBus.js";

/**
 * CameraController (Editor Mode)
 * ------------------------------
 * - Pan: Tekan SPACE + drag kiri, atau klik tengah.
 * - Zoom: Scroll wheel (fokus di posisi mouse).
 * - Aktif hanya saat ENGINE_MODE === "editor".
 */
export default class CameraController {
    constructor(camera, glCanvas) {
        this.camera = camera;
        this.canvas = glCanvas;
        this.active = Config.ENGINE_MODE === "editor";

        this.isDragging = false;
        this.spaceKeyHeld = false;
        this.lastX = 0;
        this.lastY = 0;

        this.scale = 1.0;
        this.minZoom = 0.25;
        this.maxZoom = 4.0;
        this.zoomSpeed = 0.1;

        if (this.active) {
        this._bindEvents();
        console.log("🎥 CameraController aktif (Space + Drag untuk pan, Scroll untuk zoom)");
        }
    }

    _bindEvents() {
        // Bind semua event ke instance agar bisa dilepas nanti
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onWheel = this._onWheel.bind(this);

        window.addEventListener("keydown", this._onKeyDown);
        window.addEventListener("keyup", this._onKeyUp);
        this.canvas.addEventListener("mousedown", this._onMouseDown);
        window.addEventListener("mousemove", this._onMouseMove);
        window.addEventListener("mouseup", this._onMouseUp);
        this.canvas.addEventListener("wheel", this._onWheel, { passive: false });
    }

    _onKeyDown(e) {
        if (e.code === "Space") {
        this.spaceKeyHeld = true;
        this.canvas.style.cursor = "grab";
        }
    }

    _onKeyUp(e) {
        if (e.code === "Space") {
        this.spaceKeyHeld = false;
        this.isDragging = false;
        this.canvas.style.cursor = "default";
        }
    }

    _onMouseDown(e) {
        // Pan aktif jika: klik tengah, atau Space + klik kiri
        const canPan = e.button === 1 || (e.button === 0 && this.spaceKeyHeld);
        if (canPan) {
        e.preventDefault();
        this.isDragging = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        this.canvas.style.cursor = "grabbing";
        }
    }

    _onMouseMove(e) {
        if (!this.isDragging) return;

        const dx = e.clientX - this.lastX;
        const dy = e.clientY - this.lastY;
        this.lastX = e.clientX;
        this.lastY = e.clientY;

        // Geser kamera bebas tanpa clamp
        this.camera.x -= dx / this.scale;
        this.camera.y -= dy / this.scale;

        // Tidak perlu batas 0
        bus.emit("camera:pan", { x: this.camera.x, y: this.camera.y });
    }

    _onMouseUp() {
        this.isDragging = false;
        this.canvas.style.cursor = this.spaceKeyHeld ? "grab" : "default";
    }

    _onWheel(e) {
        e.preventDefault();

        const oldScale = this.scale;
        const delta = e.deltaY < 0 ? 1 + this.zoomSpeed : 1 - this.zoomSpeed;
        this.scale = Math.min(this.maxZoom, Math.max(this.minZoom, this.scale * delta));

        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const cx = this.camera.x + mx / oldScale;
        const cy = this.camera.y + my / oldScale;

        // Zoom relatif terhadap posisi mouse
        this.camera.x = cx - mx / this.scale;
        this.camera.y = cy - my / this.scale;

        this.camera.scale = this.scale;
        bus.emit("camera:zoom", { scale: this.scale });
    }

    destroy() {
        window.removeEventListener("keydown", this._onKeyDown);
        window.removeEventListener("keyup", this._onKeyUp);
        this.canvas.removeEventListener("mousedown", this._onMouseDown);
        window.removeEventListener("mousemove", this._onMouseMove);
        window.removeEventListener("mouseup", this._onMouseUp);
        this.canvas.removeEventListener("wheel", this._onWheel);
    }
}
