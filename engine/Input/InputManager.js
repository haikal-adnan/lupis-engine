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
}
