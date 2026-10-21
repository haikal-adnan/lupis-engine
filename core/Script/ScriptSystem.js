import ScriptRunner from "./ScriptRunner.js";

export default class ScriptSystem {
    constructor(game) {
        this.game = game;
        this.runners = [];
    }

    add(scriptData, ownerEntity = null) {
        const runner = new ScriptRunner(this.game, scriptData, ownerEntity);
        this.runners.push(runner);
        return runner;
    }

    startAll() {
        console.log(`[ScriptSystem] Starting ${this.runners.length} scripts...`);
        this.runners.forEach(runner => runner.start());
    }

    update(dt) {
        const isPaused = this.game.isPaused;
        const uiLayerIds = new Set((this.game.world.layersUI || []).map(l => l.id));

        this.runners.forEach(runner => {
            const isUIEntity = runner.owner && (
                uiLayerIds.has(runner.owner.layerId) || 
                runner.owner.tag === 'ui'
            );

            // UI scripts or scripts with runInPause flag continue running during pause
            if (!isPaused || isUIEntity || runner.runInPause) {
                runner.update(dt);
            }
        });
    }

    removeEntityScripts(entity) {
        if (!entity) return;

        this.runners = this.runners.filter(runner => {
            if (runner.owner === entity || (entity.id && runner.owner?.id === entity.id)) {
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