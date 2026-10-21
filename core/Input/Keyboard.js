export default class Keyboard {
    constructor(eventManager, game = null) {
        this.eventManager = eventManager; 
        this.game = game;
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

        this._blur = () => {
            this.keys.clear();
            this.pressed.clear();
            this.released.clear();
            this.shift = false;
            this.alt = false;
            this.ctrl = false;
            this.meta = false;
        };
        window.addEventListener("blur", this._blur);
    }

    _isInputElement(target) {
        if (!target) return false;
        const tagName = target.tagName;
        if (tagName === 'INPUT' || tagName === 'TEXTAREA') return true;
        if (target.isContentEditable) return true;
        if (typeof target.closest === 'function') {
            return Boolean(target.closest('input, textarea, [contenteditable="true"]'));
        }
        return false;
    }

    _down(e) {
        if (this._isInputElement(e.target)) return;

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

    isDown(k, contextEntity = null) {
        if (!k) return false;
        if (this.game?.layerSystem?.isEntityInputFrozen(contextEntity, 'keyboard')) return false;
        return this.keys.has(String(k).toLowerCase());
    }

    isPressed(k, contextEntity = null) {
        if (!k) return false;
        if (this.game?.layerSystem?.isEntityInputFrozen(contextEntity, 'keyboard')) return false;
        return this.pressed.has(String(k).toLowerCase());
    }

    isReleased(k, contextEntity = null) {
        if (!k) return false;
        if (this.game?.layerSystem?.isEntityInputFrozen(contextEntity, 'keyboard')) return false;
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
        window.removeEventListener("blur", this._blur);
    }
}