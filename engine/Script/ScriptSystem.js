import GraphRunner from "./GraphRunner.js";

export default class ScriptSystem {
    constructor(game) {
        this.game = game;
        this.runners = [];
    }

    /**
     * Menambahkan script instance baru untuk dijalankan
     */
    add(scriptData, ownerEntity = null) {
        const runner = new GraphRunner(this.game, scriptData, ownerEntity);
        this.runners.push(runner);
    }

    update(dt) {
        // Loop terbalik kadang lebih aman jika ada runner yang menghapus dirinya sendiri
        // Tapi forEach standar cukup untuk sekarang
        this.runners.forEach(runner => runner.update(dt));
    }
    
    clear() {
        this.runners = [];
    }
}