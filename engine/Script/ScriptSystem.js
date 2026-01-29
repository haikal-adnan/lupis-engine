import GraphRunner from "./GraphRunner.js";

export default class ScriptSystem {
    constructor(game) {
        this.game = game;
        this.runners = [];
    }

    add(scriptData, ownerEntity = null) {
        const runner = new GraphRunner(this.game, scriptData, ownerEntity);
        this.runners.push(runner);
    }

    startAll() {
        console.log(`[ScriptSystem] Starting ${this.runners.length} scripts...`);
        this.runners.forEach(runner => runner.start());
    }

    update(dt) {
        this.runners.forEach(runner => runner.update(dt));
    }
    
    clear() {
        this.runners = [];
    }
}