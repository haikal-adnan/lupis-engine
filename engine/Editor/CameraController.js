import Config from "../Core/Config.js";
import { bus } from "../Util/EventBus.js";

export default class CameraController {
    constructor(camera, canvas, input) {
        this.camera = camera;
        this.canvas = canvas;
        this.input  = input;

        this.active = Config.ENGINE_MODE === "editor";

        this.spaceKeyHeld = false;
        this.isDragging   = false;

        this.lastPx = 0;
       	this.lastPy = 0;

        this.touchMode = null;
        this.startPinchDist = 0;
        this.startPinchScale = 1;

        this.minZoom = 0.25;
        this.maxZoom = 99999;
        this.zoomSpeed = 0.1;
        this.fastZoomMultiplier = 2;
    }

    update() {
        if (!this.active) return;

        this._updateKeyboard();
        this._updateMouse();
        this._updateTouch();
    }

    _updateKeyboard() {
        const kb = this.input.keyboard;

        this.spaceKeyHeld = kb.isDown(" ");

        if (!this.spaceKeyHeld && !this.isDragging) {
            this.canvas.style.cursor = "default";
        }

        if (this.spaceKeyHeld && !this.isDragging) {
            this.canvas.style.cursor = "grab";
        }
    }

    _updateMouse() {
        const mouse = this.input.mouse;
        const cam   = this.camera;

        if (!this.isDragging) {
            const canPan = mouse.isDown(1) || (mouse.isDown(0) && this.spaceKeyHeld);
            if (canPan) {
                this.isDragging = true;
                this.lastPx = mouse.x;
                this.lastPy = mouse.y;
                this.canvas.style.cursor = "grabbing";
            }
        }

        if (this.isDragging) {
            if (!mouse.isDown(1) && !(mouse.isDown(0) && this.spaceKeyHeld)) {
                this.isDragging = false;
                this.canvas.style.cursor = this.spaceKeyHeld ? "grab" : "default";
                return;
            }

            const dx = mouse.x - this.lastPx;
            const dy = mouse.y - this.lastPy;

            this.lastPx = mouse.x;
            this.lastPy = mouse.y;

            cam.x -= dx / cam.scale;
            cam.y -= dy / cam.scale;

            bus.emit("camera:pan", { x: cam.x, y: cam.y });
        }

        const wheel = mouse.consumeWheel();
        if (wheel !== 0) {
            this._applyWheelZoom(wheel);
        }
    }

    _applyWheelZoom(deltaY) {
        const cam = this.camera;

        const cssX = this.input.mouse.x;
        const cssY = this.input.mouse.y;

        const cw = this.canvas.width;
        const ch = this.canvas.height;

        if (this.input.keyboard.shift) {
            cam.y += (deltaY * 0.5) / cam.scale;
            return;
        }

        if (this.input.keyboard.alt) {
            cam.x += (deltaY * 0.5) / cam.scale;
            return;
        }

        const speed = this.input.keyboard.ctrl
            ? this.zoomSpeed * this.fastZoomMultiplier
            : this.zoomSpeed;

        const old = cam.scale;
        let next = old * (deltaY < 0 ? 1 + speed : 1 - speed);
        next = Math.max(this.minZoom, Math.min(this.maxZoom, next));

        if (next === old) return;

        const wx = cam.x + (cssX - cw * 0.5) / old;
        const wy = cam.y + (cssY - ch * 0.5) / old;

        cam.scale = next;
        cam.x = wx - (cssX - cw * 0.5) / next;
        cam.y = wy - (cssY - ch * 0.5) / next;

        bus.emit("camera:zoom", { scale: cam.scale });
    }

    _updateTouch() {
        const touch = this.input.touch;
        const cam   = this.camera;

        if (!touch.active) {
            this.touchMode = null;
            return;
        }

        const T = touch.touches;
        if (T.length !== 2) {
            this.touchMode = null;
            return;
        }

        const t1 = T[0];
        const t2 = T[1];

        const rawMidX = (t1.x + t2.x) * 0.5;
        const rawMidY = (t1.y + t2.y) * 0.5;

        const rawDist = Math.hypot(t2.x - t1.x, t2.y - t1.y);

        if (this.touchMode !== "pinch") {
            this.touchMode = "pinch";

            this.smoothMidX = rawMidX;
            this.smoothMidY = rawMidY;

            this.startDist = rawDist;
            this.startScale = cam.scale;

            const rect = this.canvas.getBoundingClientRect();
            const cw = this.canvas.width;
            const ch = this.canvas.height;

            const px = rawMidX * (cw / rect.width);
            const py = rawMidY * (ch / rect.height);

            this.anchorWX = cam.x + (px - cw * 0.5) / cam.scale;
            this.anchorWY = cam.y + (py - ch * 0.5) / cam.scale;

            this.targetScale = cam.scale;
            this.targetX = cam.x;
            this.targetY = cam.y;

            return;
        }

        this.smoothMidX = this.smoothMidX + (rawMidX - this.smoothMidX) * 0.3;
        this.smoothMidY = this.smoothMidY + (rawMidY - this.smoothMidY) * 0.3;

        const scaleRatio = rawDist / this.startDist;
        this.targetScale = this.startScale * scaleRatio;
        this.targetScale = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetScale));

        const rect = this.canvas.getBoundingClientRect();
        const cw = this.canvas.width;
        const ch = this.canvas.height;

        const px = this.smoothMidX * (cw / rect.width);
        const py = this.smoothMidY * (ch / rect.height);

        const wx = cam.x + (px - cw * 0.5) / cam.scale;
        const wy = cam.y + (py - ch * 0.5) / cam.scale;

        const wx2 = cam.x + (px - cw * 0.5) / this.targetScale;
        const wy2 = cam.y + (py - ch * 0.5) / this.targetScale;

        this.targetX = cam.x + (wx - wx2);
        this.targetY = cam.y + (wy - wy2);

        cam.scale = cam.scale + (this.targetScale - cam.scale) * 0.2;
        cam.x     = cam.x     + (this.targetX    - cam.x)     * 0.2;
        cam.y     = cam.y     + (this.targetY    - cam.y)     * 0.2;

        bus.emit("camera:zoom", { scale: cam.scale });
    }



}
