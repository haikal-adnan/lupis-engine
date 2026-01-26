export const newModuleNode = {
    'node_unique_type': {
        execute: (runner, node) => {
            const someData = runner.getInputValue(node, 'input_1')
            runner.executeFlow(node._id, 'out')
        },

        getOutput: (runner, node, outputKey) => {
            const valA = runner.getInputValue(node, 'input_1')
            switch (outputKey) {
                case 'res':
                    return (valA === 'something')
                default:
                    return null
            }
        }
    }
}
