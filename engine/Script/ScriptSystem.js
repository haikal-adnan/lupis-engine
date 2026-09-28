import ScriptRunner from "./ScriptRunner.js";

export default class ScriptSystem {
    constructor(game) {
        this.game = game;
        this.runners = [];
    }

    add(scriptData, ownerEntity = null) {
        const runner = new ScriptRunner(this.game, scriptData, ownerEntity);
        this.runners.push(runner);
    }

    startAll() {
        console.log(`[ScriptSystem] Starting ${this.runners.length} scripts...`);
        this.runners.forEach(runner => runner.start());
    }

    update(dt) {
        this.runners.forEach(runner => runner.update(dt));
    }

    removeEntityScripts(entity) {
        if (!entity) return;

        this.runners = this.runners.filter(runner => {
            if (runner.owner === entity) {
                if (typeof runner.destroy === 'function') {
                    runner.destroy();
                }
                return false;
            }
            return true;
        });
    }
    
    clear() {
        this.runners.forEach(runner => {
            if (typeof runner.destroy === 'function') {
                runner.destroy();
            }
        });
        this.runners = [];
        console.log("[ScriptSystem] Cleared all script runners.");
    }
}