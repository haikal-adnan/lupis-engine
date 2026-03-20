export const NodeLogic = {
    'logic_and': {
        getOutput: (runner, node, outputKey) => {
            const a = runner.getInputValue(node, 'a')
            const b = runner.getInputValue(node, 'b')
            return outputKey === 'result' ? (a && b) : false
        }
    },
    'logic_or': {
        getOutput: (runner, node, outputKey) => {
            const a = runner.getInputValue(node, 'a')
            const b = runner.getInputValue(node, 'b')
            return outputKey === 'result' ? (a || b) : false
        }
    },
}