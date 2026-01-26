export default class LoadScript {
    
    static load(game, payload) {
        const { project, scripts } = payload;

        if (!game.variables || !game.events) {
            console.error("[LoadScript] VariableManager or EventManager not initialized in Game.");
            return;
        }

        console.group("LoadScript Analysis");

        if (project && project.globalVariables) {
            game.variables.initGlobals(project.globalVariables);
        }

        if (project && project.globalEvents) {
            console.log(`[LoadScript] Found ${project.globalEvents.length} Global Events definition.`);
            
            if (game.events.registerGlobalDefinitions) {
                game.events.registerGlobalDefinitions(project.globalEvents);
            }
        }

        if (Array.isArray(scripts)) {
            scripts.forEach(script => {
                if (script.exposedVariables && script.exposedVariables.length > 0) {
                    game.variables.registerScriptSchema(script._id, script.exposedVariables);
                }
            });
            console.log(`[LoadScript] Processed schemas for ${scripts.length} scripts.`);
        }

        console.groupEnd();
    }
}
