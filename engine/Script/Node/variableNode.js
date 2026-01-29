export const variableNode = {
    'variable_set': {
        execute: (runner, node) => {
            const varId = node.data?.variableId
            const val = runner.getInputValue(node, 'val')
            
            if (varId) {
                runner.setVariable(varId, val)
            }
            runner.executeFlow(node._id, 'out')
        }
    },
    'variable_get': {
        getOutput: (runner, node, outputKey) => {
            const varId = node.data?.variableId
            
            const localVal = runner.getVariable(varId)
            if (localVal !== null && localVal !== undefined) {
                return localVal
            }

            if (runner.game.variables && typeof runner.game.variables.hasGlobal === 'function') {
                if (runner.game.variables.hasGlobal(varId)) {
                    return runner.game.variables.getGlobal(varId)
                }
            }
            
            return 0
        }
    }
}