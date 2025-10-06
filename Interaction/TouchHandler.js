import Game from "../World/Game.js";
import { loader } from "../main.js";

export default class TouchHandler {
    constructor(canvas) {
        this.canvas = canvas;
        this.touchX = 0;
        this.touchY = 0;
        this.dragging = false;

        // Bind supaya this tetap ke class
        this.onTouchDown = this.onTouchDown.bind(this);
        this.onTouchUp = this.onTouchUp.bind(this);
        this.handleMoveEvent = this.handleMoveEvent.bind(this);

        this.initListeners();
    }

    initListeners() {
        // Pointer Events
        document.addEventListener('pointerdown', this.onTouchDown, { passive: false });
        document.addEventListener('pointermove', this.handleMoveEvent, { passive: false });
        document.addEventListener('pointerup', this.onTouchUp, { passive: false });
        document.addEventListener('pointerleave', this.onTouchUp, { passive: false });

        // Touch Events
        document.addEventListener('touchstart', this.onTouchDown, { passive: false });
        document.addEventListener('touchmove', this.handleMoveEvent, { passive: false });
        document.addEventListener('touchend', this.onTouchUp, { passive: false });
        document.addEventListener('touchcancel', this.onTouchUp, { passive: false });
    }

    onTouchDown(event) {
        event.preventDefault();
        this.touchCoordinate(event);
        this.dragging = true;
    }

    onTouchUp(event) {
        event.preventDefault();
        this.dragging = false;
    }

    handleMoveEvent(event) {
        if (this.dragging) {
            this.touchCoordinate(event);
        }
    }

    touchCoordinate(event) {
        const canvas = document.getElementById("glCanvas");
        const rect = canvas.getBoundingClientRect();

        if (event.touches) {
            this.touchX = event.touches[0].clientX - rect.left;
            this.touchY = event.touches[0].clientY - rect.top;
        } else {
            this.touchX = event.clientX - rect.left;
            this.touchY = event.clientY - rect.top;
        }

        const canvasAspect = canvas.width / canvas.height;
        const screenAspect = window.innerWidth / window.innerHeight;

        let offsetX = 0;
        let offsetY = 0;
        let scaleX = 1;
        let scaleY = 1;

        if (screenAspect > canvasAspect) {
            const actualCanvasWidth = window.innerHeight * canvasAspect;
            offsetX = (window.innerWidth - actualCanvasWidth) / 2;
            scaleX = canvas.width / actualCanvasWidth;
            scaleY = canvas.height / window.innerHeight;
        } else {
            const actualCanvasHeight = window.innerWidth / canvasAspect;
            offsetY = (window.innerHeight - actualCanvasHeight) / 2;
            scaleX = canvas.width / window.innerWidth;
            scaleY = canvas.height / actualCanvasHeight;
        }

        this.touchX = (this.touchX - offsetX) * scaleX;
        this.touchY = (this.touchY - offsetY) * scaleY;

        this.touchX = Math.max(0, Math.min(canvas.width, this.touchX));
        this.touchY = Math.max(0, Math.min(canvas.height, this.touchY));
    }
}
