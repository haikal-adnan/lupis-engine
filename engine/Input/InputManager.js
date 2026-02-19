import Mouse from "./Mouse.js";
import Touch from "./Touch.js";
import Keyboard from "./Keyboard.js";

export default class InputManager {
    constructor(canvas, eventManager) {
        this.eventManager = eventManager;
        this.keyboard = new Keyboard(this.eventManager);
        this.mouse    = new Mouse(canvas, this.eventManager);
        this.touch    = new Touch(canvas);
    }

    destroy() {
        this.mouse.destroy();
        this.touch.destroy();
        this.keyboard.destroy();
    }

    getPointer() {
        if (this.touch.active && this.touch.touches.length === 1) {
            return {
                x: this.touch.touches[0].x,
                y: this.touch.touches[0].y,
                down: true,
                rightDown: false, // Touch biasanya tidak dianggap klik kanan standar
                isTouch: true
            };
        }
        return {
            x: this.mouse.x,
            y: this.mouse.y,
            down: this.mouse.isDown(0),      // Tombol 0 = Kiri
            rightDown: this.mouse.isDown(2), // Tombol 2 = Kanan
            isTouch: false
        };
    }

    isPinching() {
        return this.touch.active && this.touch.touches.length >= 2;
    }
}