export default class LoadScript {
    static load(game, payload) {
        const { project, scripts } = payload;

        if (!game.variables || !game.events) {
            console.error("[LoadScript] VariableManager or EventManager not initialized in Game.");
            return;
        }

        if (project && project.globalVariables) {
            game.variables.initGlobals(project.globalVariables);
        }

        if (Array.isArray(scripts)) {
            scripts.forEach(script => {
                const vars = script.variables || script.localVariables || [];
                game.variables.registerScriptSchema(script.id, vars);
            });
        }
    }
}
