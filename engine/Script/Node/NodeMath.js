export const NodeMath = {
    'math_chain': {
        execute: (runner, node) => runner.executeFlow(node._id, 'out'),
        getOutput: (runner, node, outputKey) => {
            let result = Number(runner.getInputValue(node, 'v0')) || 0;
            
            const ops = node.data?.ops || ['add'];

            for (let i = 0; i < ops.length; i++) {
                const nextValIndex = i + 1;
                const nextVal = Number(runner.getInputValue(node, `v${nextValIndex}`)) || 0;
                const op = ops[i];

                switch (op) {
                    case 'add': 
                        result += nextVal; 
                        break;
                    case 'subtract': 
                        result -= nextVal; 
                        break;
                    case 'multiply': 
                        result *= nextVal; 
                        break;
                    case 'divide': 
                        result = nextVal !== 0 ? result / nextVal : 0; 
                        break;
                    case 'modulo':
                        result = nextVal !== 0 ? result % nextVal : 0;
                        break;
                }
            }

            return outputKey === 'res' ? result : 0;
        }
    },

    'math_random': {
        execute: (runner, node) => runner.executeFlow(node._id, 'out'),
        getOutput: (runner, node, outputKey) => {
            const min = Number(runner.getInputValue(node, 'min')) || 0;
            const max = Number(runner.getInputValue(node, 'max')) || 1;
            return outputKey === 'res' ? Math.random() * (max - min) + min : 0;
        }
    },

    'math_negate': {
        execute: (runner, node) => runner.executeFlow(node._id, 'out'),
        getOutput: (runner, node, outputKey) => {
            const a = Number(runner.getInputValue(node, 'a')) || 0;
            return outputKey === 'res' ? -a : 0;
        }
    },
}