export const variableNode = {
    'variable_set': {
        execute: (runner, node) => {
            const varId = node.data?.variableId
            const val = runner.getInputValue(node, 'val')
            
            if (varId) {
                // Set ke local variable runner
                runner.setVariable(varId, val)
            }
            runner.executeFlow(node._id, 'out')
        }
    },
    'variable_get': {
        getOutput: (runner, node, outputKey) => {
            const varId = node.data?.variableId
            
            // 1. Cek Local Variable dulu
            const localVal = runner.getVariable(varId)
            if (localVal !== null && localVal !== undefined) {
                return localVal
            }

            // 2. Cek Global Variable (Game Scope)
            if (runner.game.variables && typeof runner.game.variables.hasGlobal === 'function') {
                if (runner.game.variables.hasGlobal(varId)) {
                    return runner.game.variables.getGlobal(varId)
                }
            }
            
            return 0 // Default value
        }
    }
}