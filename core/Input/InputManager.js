import Mouse from "./Mouse.js";
import Touch from "./Touch.js";
import Keyboard from "./Keyboard.js";
import PointerRaycast from "../System/PointerRaycast.js";

export default class InputManager {
    constructor(canvas, eventManager, game = null) {
        this.game = game;
        this.eventManager = eventManager;
        this.keyboard = new Keyboard(this.eventManager, this.game);
        this.mouse    = new Mouse(canvas, this.eventManager);
        this.touch    = new Touch(canvas);
    }

    destroy() {
        this.mouse.destroy();
        this.touch.destroy();
        this.keyboard.destroy();
    }

    isPointerOver(entity, useRaycast = true) {
        if (!entity) return false;
        if (this.game?.layerSystem?.isEntityInputFrozen(entity, 'pointer')) return false;
        const raycast = this.game?.pointerRaycast || PointerRaycast;
        return raycast && typeof raycast.isPointerOver === 'function'
            ? raycast.isPointerOver(this.game, entity, useRaycast)
            : false;
    }

    getPointer(contextEntity = null) {
        if (contextEntity) {
            if (contextEntity.active === false || contextEntity.visible === false) {
                return null;
            }
            if (this.game?.layerSystem?.isEntityInputFrozen(contextEntity, 'pointer')) {
                return null;
            }
        }

        if (this.touch.active && this.touch.touches.length === 1) {
            return {
                x: this.touch.touches[0].x,
                y: this.touch.touches[0].y,
                down: true,
                rightDown: false,
                isTouch: true
            };
        }
        return {
            x: this.mouse.x,
            y: this.mouse.y,
            down: this.mouse.isDown(0),      
            rightDown: this.mouse.isDown(2), 
            isTouch: false
        };
    }

    getMouse(contextEntity = null) {
        if (contextEntity) {
            if (contextEntity.active === false || contextEntity.visible === false) {
                return null;
            }
            if (this.game?.layerSystem?.isEntityInputFrozen(contextEntity, 'pointer')) {
                return null;
            }
        }
        return this.mouse;
    }

    isPinching() {
        return this.touch.active && this.touch.touches.length >= 2;
    }
}
