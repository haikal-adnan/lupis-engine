// InputManager.js
import Mouse from "./Mouse.js";
import Touch from "./Touch.js";
import Keyboard from "./Keyboard.js";

export default class InputManager {
    constructor(canvas) {
        this.keyboard = new Keyboard();
        this.mouse    = new Mouse(canvas);
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
                isTouch: true
            };
        }

        // Mouse default
        return {
            x: this.mouse.x,
            y: this.mouse.y,
            down: this.mouse.isDown(0),
            isTouch: false
        };
    }

    isPinching() {
        return this.touch.active && this.touch.touches.length >= 2;
    }


}
