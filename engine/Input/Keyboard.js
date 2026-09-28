export default class Keyboard {
    constructor(eventManager) {
        this.eventManager = eventManager; 
        this.keys = new Set();
        this.pressed = new Set();
        this.released = new Set();

        this.shift = false;
        this.alt = false;
        this.ctrl = false;
        this.meta = false;

        this._onDown = e => this._down(e);
        this._onUp   = e => this._up(e);

        window.addEventListener("keydown", this._onDown);
        window.addEventListener("keyup", this._onUp);

        this._blockAltDown = e => {
            if (e.key === "Alt") e.preventDefault();
        };
        this._blockAltUp = e => {
            if (e.key === "Alt") e.preventDefault();
        };

        window.addEventListener("keydown", this._blockAltDown, { capture: true });
        window.addEventListener("keyup", this._blockAltUp, { capture: true });
    }

    _down(e) {
        let k = e.key.toLowerCase();
        if (k === " ") k = "space";

        if (!this.keys.has(k)) {
            this.pressed.add(k);
        }

        this.keys.add(k);
        this.shift = e.shiftKey;
        this.alt = e.altKey;
        this.ctrl = e.ctrlKey;
        this.meta = e.metaKey;
    }

    _up(e) {
        let k = e.key.toLowerCase();
        if (k === " ") k = "space";

        this.keys.delete(k);
        this.released.add(k);

        this.shift = e.shiftKey;
        this.alt = e.altKey;
        this.ctrl = e.ctrlKey;
        this.meta = e.metaKey;
    }

    isDown(k) {
        if (!k) return false;
        return this.keys.has(String(k).toLowerCase());
    }

    isPressed(k) {
        if (!k) return false;
        return this.pressed.has(String(k).toLowerCase());
    }

    isReleased(k) {
        if (!k) return false;
        return this.released.has(String(k).toLowerCase());
    }

    getPressedKeys() {
        return Array.from(this.pressed);
    }

    endFrame() {
        this.pressed.clear();
        this.released.clear();
    }

    destroy() {
        window.removeEventListener("keydown", this._onDown);
        window.removeEventListener("keyup", this._onUp);
        window.removeEventListener("keydown", this._blockAltDown, { capture: true });
        window.removeEventListener("keyup", this._blockAltUp, { capture: true });
    }
}