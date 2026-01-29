export const mathNode = {
    'math_add': {
        execute: (runner, node) => runner.executeFlow(node._id, 'out'),
        getOutput: (runner, node, outputKey) => {
            const a = Number(runner.getInputValue(node, 'a')) || 0
            const b = Number(runner.getInputValue(node, 'b')) || 0
            return outputKey === 'res' ? a + b : 0
        }
    },
    'math_subtract': {
        execute: (runner, node) => runner.executeFlow(node._id, 'out'),
        getOutput: (runner, node, outputKey) => {
            const a = Number(runner.getInputValue(node, 'a')) || 0
            const b = Number(runner.getInputValue(node, 'b')) || 0
            return outputKey === 'res' ? a - b : 0
        }
    },
    'math_multiply': {
        execute: (runner, node) => runner.executeFlow(node._id, 'out'),
        getOutput: (runner, node, outputKey) => {
            const a = Number(runner.getInputValue(node, 'a')) || 0
            const b = Number(runner.getInputValue(node, 'b')) || 0
            return outputKey === 'res' ? a * b : 0
        }
    },
    'math_divide': {
        execute: (runner, node) => runner.executeFlow(node._id, 'out'),
        getOutput: (runner, node, outputKey) => {
            const a = Number(runner.getInputValue(node, 'a')) || 0
            const b = Number(runner.getInputValue(node, 'b')) || 0
            
            // Proteksi pembagian dengan nol
            if (outputKey === 'res') {
                return b !== 0 ? a / b : 0; 
            }
            return 0;
        }
    },
    'math_random': {
        execute: (runner, node) => runner.executeFlow(node._id, 'out'),
        getOutput: (runner, node, outputKey) => {
            const min = Number(runner.getInputValue(node, 'min')) || 0
            const max = Number(runner.getInputValue(node, 'max')) || 1
            return outputKey === 'res' ? Math.random() * (max - min) + min : 0
        }
    },
    'math_negate': {
        execute: (runner, node) => runner.executeFlow(node._id, 'out'),
        getOutput: (runner, node, outputKey) => {
            const a = Number(runner.getInputValue(node, 'a')) || 0
            return outputKey === 'res' ? -a : 0
        }
    },
    'compare_equal': {
        getOutput: (runner, node, outputKey) => {
            const a = runner.getInputValue(node, 'a')
            const b = runner.getInputValue(node, 'b')
            return outputKey === 'res' ? (a == b) : false
        }
    },
    'compare_not_equal': {
        getOutput: (runner, node, outputKey) => {
            const a = runner.getInputValue(node, 'a')
            const b = runner.getInputValue(node, 'b')
            return outputKey === 'res' ? (a != b) : false
        }
    },
    'compare_greater': {
        getOutput: (runner, node, outputKey) => {
            return outputKey === 'res' ? (Number(runner.getInputValue(node, 'a')) > Number(runner.getInputValue(node, 'b'))) : false
        }
    },
    'compare_less': {
        getOutput: (runner, node, outputKey) => {
            return outputKey === 'res' ? (Number(runner.getInputValue(node, 'a')) < Number(runner.getInputValue(node, 'b'))) : false
        }
    }
}