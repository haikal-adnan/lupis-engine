import { bus } from "../Util/EventBus.js";

export default class HistoryManager {
    constructor(game, input) {
        this.game = game;
        this.input = input; 

        this.undoStack = [];
        this.redoStack = [];
        this.limit = 50; 

        this.lastActionTime = 0;
        this.COOLDOWN = 200; 
    }

    update() {
        const k = this.input.keyboard;
        const ctrl = k.ctrl || k.meta; 
        const shift = k.shift;
        const z = k.isDown("z");
        const y = k.isDown("y");

        const now = performance.now();
        if (now - this.lastActionTime < this.COOLDOWN) return;

        if (ctrl && z && !shift) {
            this.undo();
            this.lastActionTime = now;
        }

        if ((ctrl && y) || (ctrl && shift && z)) {
            this.redo();
            this.lastActionTime = now;
        }
    }

    execute(cmd) {
        cmd.redo();

        this.push(cmd);
    }

    push(cmd) {
        this.undoStack.push(cmd);
        this.redoStack = []; 
        
        if (this.undoStack.length > this.limit) {
            this.undoStack.shift();
        }

        this._emitState();
    }

    undo() {
        if (this.undoStack.length === 0) return;

        const cmd = this.undoStack.pop();
        console.log(`[History] Undo: ${cmd.name || 'Unnamed'}`);
        
        cmd.undo();
        this.redoStack.push(cmd);

        this._emitState();
        bus.emit("scene:updated");
    }

    redo() {
        if (this.redoStack.length === 0) return;

        const cmd = this.redoStack.pop();
        console.log(`[History] Redo: ${cmd.name || 'Unnamed'}`);

        cmd.redo();
        this.undoStack.push(cmd);

        this._emitState();
        bus.emit("scene:updated");
    }

    _emitState() {
        bus.emit("history:state-changed", {
            canUndo: this.undoStack.length > 0,
            canRedo: this.redoStack.length > 0
        });
    }
}