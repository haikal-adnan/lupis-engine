import { bus } from "../Util/EventBus.js";

export default class HistoryManager {
    constructor(game, input) {
        this.game = game;
        this.input = input; // InputManager dipasang di sini

        this.undoStack = [];
        this.redoStack = [];
        this.limit = 50; // Batas history

        // Debounce agar tidak undo 60 kali per detik saat tombol ditekan
        this.lastActionTime = 0;
        this.COOLDOWN = 200; 
    }

    update() {
        // Cek Keyboard Shortcut
        const k = this.input.keyboard;
        const ctrl = k.ctrl || k.meta; // Support Windows (Ctrl) & Mac (Cmd)
        const shift = k.shift;
        const z = k.isDown("z");
        const y = k.isDown("y");

        const now = performance.now();
        if (now - this.lastActionTime < this.COOLDOWN) return;

        // Undo: Ctrl + Z
        if (ctrl && z && !shift) {
            this.undo();
            this.lastActionTime = now;
        }

        // Redo: Ctrl + Y  ATAU  Ctrl + Shift + Z
        if ((ctrl && y) || (ctrl && shift && z)) {
            this.redo();
            this.lastActionTime = now;
        }
    }

    // Dipanggil oleh Frontend (Vue) atau Tool
    execute(cmd) {
        // 1. Jalankan aksi (Redo logic)
        cmd.redo();

        // 2. Simpan ke stack
        this.push(cmd);
    }

    push(cmd) {
        this.undoStack.push(cmd);
        this.redoStack = []; // Hapus redo stack jika ada cabang sejarah baru
        
        if (this.undoStack.length > this.limit) {
            this.undoStack.shift();
        }

        this._emitState();
        
        // Log opsional
        // console.log(`📝 [History] Push: ${cmd.name || 'Unnamed'}`);
    }

    undo() {
        console.log("jalan")
        if (this.undoStack.length === 0) return;

        const cmd = this.undoStack.pop();
        console.log(`⏪ [History] Undo: ${cmd.name || 'Unnamed'}`);
        
        cmd.undo();
        this.redoStack.push(cmd);

        this._emitState();
        bus.emit("scene:updated"); // Sinyal ke Vue untuk refresh inspector
    }

    redo() {
        if (this.redoStack.length === 0) return;

        const cmd = this.redoStack.pop();
        console.log(`⏩ [History] Redo: ${cmd.name || 'Unnamed'}`);

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